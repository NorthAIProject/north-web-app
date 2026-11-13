"""The Khepri mascot in 3D: turns the source GLB into the models the clients load.

The source (`Khepri_V2_Mascot_Mobile.glb`) is a flat list of 79 named parts, named
`NN_NN_PART__Material`: Y up, facing +Z, no normals, no transforms, no textures. Its geometry is
kept as supplied. Standard library only; the GLB reader, normals and colour maths are shared with
`emblem_3d.py`. This script:

  1. reads the GLB defensively (the file is outside data);
  2. centres the mascot on its feet axis and scales it to one unit tall;
  3. restyles every part by its material suffix to the brand tokens in `src/lib/styles/app.css`
     (`MATERIALS`, `LOOKS`): navy armour, Solar Gold trim, copper, ivory-hot lights;
  4. groups parts into joints the clients move (`JOINTS`): the head turns toward the pointer,
     the eyes close for a blink, the pupils follow, the solar core glows;
  5. adds smooth normals and merges parts that share a joint and a look;
  6. writes `mascot.glb` (web, float; pack it with gltfpack, see static/assets/models/README.md),
     `Mascot.usdz` (iOS) and `mascot-rig.json` (joints, pivots, glow meshes, framing) to --out.

    python3 -I scripts/brand/mascot_3d.py --mascot /path/to/copy/Khepri_V2_Mascot_Mobile.glb \\
        --css src/lib/styles/app.css --out out/mascot-3d

Run it with `-I` and keep the source in a directory of its own: the GLB is not ours.
"""

import argparse
import hashlib
import json
import math
import re
import shutil
import struct
import subprocess
import sys
from collections import defaultdict
from pathlib import Path

# -I leaves the script's directory off sys.path; the shared helpers are ours, next to this file.
sys.dont_write_bytecode = True  # no __pycache__ next to the scripts
sys.path.insert(0, str(Path(__file__).resolve().parent))
import emblem_3d as kit  # noqa: E402

SCENE = "Mascot"
FOV_DEGREES = 30
MARGIN = 1.12  # frame 12 % wider than the mascot so hover and head turn never clip

# Brand tokens the looks are painted with (selector, custom property in app.css).
TOKENS = {
    "armor_navy": (":root", "primary"),  # Armor Navy #1B2A40
    "midnight_steel": (".dark", "card"),  # Midnight Steel #121C2B
    "obsidian": (".dark", "background"),  # Obsidian Navy #0B111C
    "solar_gold": (".dark", "north-signal"),  # Solar Gold #E8B65C
    "copper": (".dark", "north-ember"),  # copper #E08A4F
    "ivory": (".dark", "foreground"),  # Warm Ivory #F6F2EA
}

# look: (token, metallic, roughness, glow). Glow scales the base colour into emission.
LOOKS = {
    "armor": ("armor_navy", 0.2, 0.36, 0.0),
    "ceramic": ("midnight_steel", 0.15, 0.42, 0.0),
    "joint": ("obsidian", 0.7, 0.34, 0.0),
    "ink": ("obsidian", 0.1, 0.3, 0.0),
    "glass": ("obsidian", 0.0, 0.08, 0.0),
    "gold": ("solar_gold", 1.0, 0.26, 0.0),
    "copper": ("copper", 1.0, 0.32, 0.0),
    "amber": ("copper", 0.0, 0.12, 0.45),
    "ember_glow": ("copper", 0.0, 0.3, 0.9),
    "sun_glow": ("solar_gold", 0.0, 0.3, 0.7),
    "gold_glow": ("solar_gold", 0.8, 0.3, 0.25),
    "hot": ("ivory", 0.0, 0.2, 1.0),
}

# Source material suffix -> look. Every source material must be listed.
MATERIALS = {
    "Obsidian_Blue_Enamel": "armor",
    "Midnight_Ceramic_Armor": "ceramic",
    "Joint_Mechanism_Gunmetal": "joint",
    "Ink_Enamel": "ink",
    "Shadow_Socket_Glass": "glass",
    "Brushed_Antique_Gold": "gold",
    "Polished_Gold": "gold",
    "Light_Edge_Gold": "gold",
    "Satin_Bronze": "copper",
    "Recessed_Copper": "copper",
    "Solar_Amber_Glass": "amber",
    "Solar_Emissive_Orange": "ember_glow",
    "Solar_Emissive_Yellow": "sun_glow",
    "Subtle_Antique_Gold_Emissive": "gold_glow",
    "White_Hot_Sun": "hot",
}

# Joint tree: name -> (parent, part-name prefixes). A part belongs to the joint with the longest
# matching prefix; every part must match one. Pivots are computed from the parts (see PIVOTS).
JOINTS = {
    "body": (None, ("06_", "07_", "09_", "10_")),
    "core": ("body", ("08_",)),
    "head": ("body", ("01_", "02_", "03_", "04_", "05_")),
    # The eye glass and its glow. A blink squashes it, with the pupils, shut behind the lids.
    "eyes": ("head", ("03_04_", "03_05_")),
    # Iris rings, pupil and catchlights: what follows the pointer inside the eye.
    "pupils": ("eyes", ("03_06_", "03_07_", "03_08_", "03_09_", "03_10_")),
}

# Where each joint turns or scales, from its parts' bounds (source units, before centring).
#   neck: x centre, the head's lowest point, the head's z centre — the head nods and turns there.
#   centre: the centre of the joint's bounds.
PIVOTS = {"body": "origin", "core": "centre", "head": "neck", "eyes": "centre", "pupils": "centre"}

GLOW_JOINT = "core"  # the joint whose glowing looks the clients pulse
PART = re.compile(r"^(\d\d_\d\d_[A-Z0-9_]+?)__([A-Za-z_]+)$")


def joint_of(name):
    best = None
    for joint, (_, prefixes) in JOINTS.items():
        for prefix in prefixes:
            if name.startswith(prefix) and (best is None or len(prefix) > best[1]):
                best = (joint, len(prefix))
    if best is None:
        raise SystemExit(f"{name}: no joint claims this part; update JOINTS")
    return best[0]


def look_of(name):
    m = PART.match(name)
    if not m or m.group(2) not in MATERIALS:
        raise SystemExit(f"{name}: unknown part name or material; update MATERIALS")
    return MATERIALS[m.group(2)]


def check_parts(parts):
    """Every part needs a known material and a joint; every joint needs a part."""
    for name in parts:
        look_of(name)
        joint_of(name)
    empty = sorted(set(JOINTS) - {joint_of(name) for name in parts})
    if empty:
        raise SystemExit(f"joints with no parts: {empty}; update JOINTS")


def bounds(points):
    return [min(p[i] for p in points) for i in range(3)], [max(p[i] for p in points) for i in range(3)]


def build(parts):
    """Returns (joints, size): joints = {name: {"parent", "pivot", "meshes": {look: mesh}}}.

    Mesh points are relative to their joint's pivot; pivots are relative to the parent's pivot.
    The model is centred on x and z, stands on y = 0 and is one unit tall."""
    every = [p for points, _ in parts.values() for p in points]
    low, high = bounds(every)
    mid = [(low[0] + high[0]) / 2, low[1], (low[2] + high[2]) / 2]
    scale = 1.0 / (high[1] - low[1])

    def place(p):
        return tuple((p[i] - mid[i]) * scale for i in range(3))

    by_joint = defaultdict(dict)
    for name, mesh in parts.items():
        by_joint[joint_of(name)][name] = mesh

    def claimed(joint):
        """Parts of the joint and of every joint below it (a pivot covers what it moves)."""
        names = dict(by_joint[joint])
        for child, (parent, _) in JOINTS.items():
            if parent == joint:
                names.update(claimed(child))
        return names

    world_pivot = {}
    for joint in JOINTS:
        pts = [place(p) for points, _ in claimed(joint).values() for p in points]
        lo, hi = bounds(pts)
        kind = PIVOTS[joint]
        if kind == "origin":
            world_pivot[joint] = (0.0, 0.0, 0.0)
        elif kind == "centre":
            world_pivot[joint] = tuple((lo[i] + hi[i]) / 2 for i in range(3))
        elif kind == "neck":
            world_pivot[joint] = ((lo[0] + hi[0]) / 2, lo[1], (lo[2] + hi[2]) / 2)
        world_pivot[joint] = tuple(round(v, 5) for v in world_pivot[joint])

    joints = {}
    for joint, (parent, _) in JOINTS.items():
        pivot = world_pivot[joint]
        base = world_pivot[parent] if parent else (0.0, 0.0, 0.0)
        merged = defaultdict(lambda: ([], []))
        for name in sorted(by_joint[joint]):
            points, faces = by_joint[joint][name]
            out_points, out_faces = merged[look_of(name)]
            start = len(out_points)
            out_points += [tuple(round(v - pivot[i], 6) for i, v in enumerate(place(p))) for p in points]
            out_faces += [(a + start, b + start, c + start) for a, b, c in faces]
        joints[joint] = {
            "parent": parent,
            "pivot": tuple(round(pivot[i] - base[i], 5) for i in range(3)),
            "world": pivot,
            "meshes": {look: kit.with_normals(*merged[look]) for look in sorted(merged)},
        }
    lo, hi = bounds([place(p) for p in every])
    return joints, [round(hi[i] - lo[i], 4) for i in range(3)]


def node_name(joint):
    return f"{SCENE}_{joint}"


def mesh_name(joint, look):
    return f"{SCENE}_{joint}_{look}"


def write_glb(path, joints, looks):
    blob = bytearray()
    views, accessors, gl_meshes, nodes, materials, material_index = [], [], [], [], [], {}

    def view(payload, target):
        while len(blob) % 4:
            blob.append(0)
        views.append({"buffer": 0, "byteOffset": len(blob), "byteLength": len(payload), "target": target})
        blob.extend(payload)
        return len(views) - 1

    def material(look):
        if look not in material_index:
            color, metallic, roughness, glow = looks[look]
            materials.append(
                {
                    "name": look,
                    "pbrMetallicRoughness": {
                        "baseColorFactor": [*color, 1.0],
                        "metallicFactor": metallic,
                        "roughnessFactor": roughness,
                    },
                    "emissiveFactor": [round(c * glow, 5) for c in color],
                }
            )
            material_index[look] = len(materials) - 1
        return material_index[look]

    joint_node = {}
    for joint, spec in joints.items():
        children = []
        for look, (points, normals, faces) in spec["meshes"].items():
            lo, hi = bounds(points)
            pos = view(struct.pack(f"<{len(points) * 3}f", *[v for p in points for v in p]), 34962)
            nor = view(struct.pack(f"<{len(normals) * 3}f", *[v for n in normals for v in n]), 34962)
            wide = len(points) > 65535
            flat = [i for f in faces for i in f]
            idx = view(struct.pack(f"<{len(flat)}{'I' if wide else 'H'}", *flat), 34963)
            accessors += [
                {"bufferView": pos, "componentType": 5126, "count": len(points), "type": "VEC3", "min": lo, "max": hi},
                {"bufferView": nor, "componentType": 5126, "count": len(normals), "type": "VEC3"},
                {"bufferView": idx, "componentType": 5125 if wide else 5123, "count": len(flat), "type": "SCALAR"},
            ]
            a = len(accessors) - 3
            prim = {"attributes": {"POSITION": a, "NORMAL": a + 1}, "indices": a + 2, "material": material(look)}
            gl_meshes.append({"name": mesh_name(joint, look), "primitives": [prim]})
            nodes.append({"name": mesh_name(joint, look), "mesh": len(gl_meshes) - 1})
            children.append(len(nodes) - 1)
        nodes.append({"name": node_name(joint), "translation": list(spec["pivot"]), "children": children})
        joint_node[joint] = len(nodes) - 1
    for joint, spec in joints.items():
        if spec["parent"]:
            nodes[joint_node[spec["parent"]]]["children"].append(joint_node[joint])
    root = next(j for j, s in joints.items() if not s["parent"])
    nodes.append({"name": SCENE, "children": [joint_node[root]]})
    doc = {
        "asset": {"version": "2.0", "generator": "north-web-app scripts/brand/mascot_3d.py"},
        "scene": 0,
        "scenes": [{"nodes": [len(nodes) - 1]}],
        "nodes": nodes,
        "meshes": gl_meshes,
        "materials": materials,
        "accessors": accessors,
        "bufferViews": views,
        "buffers": [{"byteLength": len(blob)}],
    }
    text = json.dumps(doc, separators=(",", ":")).encode()
    text += b" " * (-len(text) % 4)
    blob.extend(b"\0" * (-len(blob) % 4))
    total = 12 + 8 + len(text) + 8 + len(blob)
    out = struct.pack("<4sII", b"glTF", 2, total) + struct.pack("<II", len(text), 0x4E4F534A) + text
    out += struct.pack("<II", len(blob), 0x004E4942) + bytes(blob)
    Path(path).write_bytes(out)


def write_usd(path, joints, looks):
    def tuples(values, digits):
        return ", ".join("(" + ", ".join(f"{v:.{digits}g}" for v in t) + ")" for t in values)

    used = sorted({look for spec in joints.values() for look in spec["meshes"]})
    lines = ['#usda 1.0', '(', f'    defaultPrim = "{SCENE}"', '    metersPerUnit = 1', '    upAxis = "Y"', ')', '',
             f'def Xform "{SCENE}" (', '    kind = "component"', ')', '{', '    def Scope "Materials"', '    {']  # fmt: skip
    for look in used:
        color, metallic, roughness, glow = looks[look]
        root = f"/{SCENE}/Materials/{look}"
        lines += [
            f'        def Material "{look}"', '        {',
            f'            token outputs:surface.connect = <{root}/Surface.outputs:surface>',
            '            def Shader "Surface"', '            {',
            '                uniform token info:id = "UsdPreviewSurface"',
            f'                color3f inputs:diffuseColor = {tuples([color], 5)}',
            f'                float inputs:roughness = {roughness}',
            f'                float inputs:metallic = {metallic}',
            f'                color3f inputs:emissiveColor = {tuples([tuple(c * glow for c in color)], 5)}',
            '                token outputs:surface', '            }', '        }',
        ]  # fmt: skip
    lines += ["    }"]

    def emit(joint, depth):
        pad = "    " * depth
        spec = joints[joint]
        out = [f'{pad}def Xform "{node_name(joint)}"', f"{pad}{{",
               f"{pad}    double3 xformOp:translate = {tuples([spec['pivot']], 6)}",
               f'{pad}    uniform token[] xformOpOrder = ["xformOp:translate"]']  # fmt: skip
        for look, (points, normals, faces) in spec["meshes"].items():
            out += [
                f'{pad}    def Mesh "{mesh_name(joint, look)}" (', f'{pad}        prepend apiSchemas = ["MaterialBindingAPI"]',
                f'{pad}    )', f'{pad}    {{',
                f"{pad}        int[] faceVertexCounts = [{', '.join('3' for _ in faces)}]",
                f"{pad}        int[] faceVertexIndices = [{', '.join(str(i) for f in faces for i in f)}]",
                f"{pad}        point3f[] points = [{tuples(points, 6)}]",
                f'{pad}        normal3f[] normals = [{tuples(normals, 3)}] (', f'{pad}            interpolation = "vertex"', f'{pad}        )',
                f'{pad}        uniform token subdivisionScheme = "none"',
                f"{pad}        rel material:binding = </{SCENE}/Materials/{look}>",
                f'{pad}    }}',
            ]  # fmt: skip
        for child, child_spec in joints.items():
            if child_spec["parent"] == joint:
                out += emit(child, depth + 1)
        return out + [f"{pad}}}"]

    root = next(j for j, s in joints.items() if not s["parent"])
    lines += ['    def Xform "Root"', "    {"] + emit(root, 2) + ["    }", "}"]
    usda = Path(path).with_suffix(".usda")
    usda.write_text("\n".join(lines) + "\n")
    if not (shutil.which("usdcat") and shutil.which("usdzip")):
        print("usdcat/usdzip not found: kept", usda, file=sys.stderr)
        return usda
    usdc = usda.with_suffix(".usdc")
    subprocess.run(["usdcat", str(usda), "-o", str(usdc)], check=True)
    Path(path).unlink(missing_ok=True)
    subprocess.run(["usdzip", str(Path(path).resolve()), usdc.name], check=True, cwd=usdc.parent)
    usda.unlink()
    usdc.unlink()
    return Path(path)


def main():
    here = Path(__file__).resolve().parents[2]
    parser = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    parser.add_argument("--mascot", required=True, type=Path, help="Khepri_V2_Mascot_Mobile.glb (a copy)")
    parser.add_argument("--css", type=Path, default=here / "src/lib/styles/app.css")
    parser.add_argument("--out", type=Path, default=here / "out/mascot-3d")
    args = parser.parse_args()

    css = args.css.read_text()
    colours = {key: kit.token_linear_rgb(css, sel, name) for key, (sel, name) in TOKENS.items()}
    looks = {look: (colours[token], m, r, g) for look, (token, m, r, g) in LOOKS.items()}
    parts = kit.read_glb(args.mascot, check_parts)
    joints, size = build(parts)

    args.out.mkdir(parents=True, exist_ok=True)
    write_glb(args.out / "mascot.glb", joints, looks)
    usd = write_usd(args.out / "Mascot.usdz", joints, looks)
    # The mascot stands on y = 0; the camera looks at its middle.
    centre = [0.0, round(size[1] / 2, 4), 0.0]
    fit = max(size[0], size[1]) * MARGIN / 2 / math.tan(math.radians(FOV_DEGREES) / 2)
    rig = {
        "version": 1,
        "source": {"file": args.mascot.name, "sha256": hashlib.sha256(args.mascot.read_bytes()).hexdigest()},
        "space": "+Y up, facing +Z, standing on y = 0, centred on x and z, 1 unit tall",
        "size": {"width": size[0], "height": size[1], "depth": size[2]},
        "looks": {
            look: {"token": f"{TOKENS[t][0]} --{TOKENS[t][1]}", "srgb": kit.srgb_hex(colours[t]), "glow": g}
            for look, (t, _, _, g) in LOOKS.items()
        },
        "joints": {
            joint: {
                "node": node_name(joint),
                "parent": spec["parent"],
                "pivot": list(spec["world"]),
                "meshes": [mesh_name(joint, look) for look in spec["meshes"]],
            }
            for joint, spec in joints.items()
        },
        "glowMeshes": [mesh_name(GLOW_JOINT, look) for look in joints[GLOW_JOINT]["meshes"] if LOOKS[look][3] > 0],
        "camera": {"fovDegrees": FOV_DEGREES, "target": centre, "distance": round(fit + size[2] / 2, 4)},
        "lights": {"key": ".dark --north-signal", "rim": ".dark --muted-foreground"},
    }
    (args.out / "mascot-rig.json").write_text(json.dumps(rig, indent=2) + "\n")
    for joint, spec in joints.items():
        for look, (points, _, faces) in spec["meshes"].items():
            print(f"{joint:7} {look:11} {len(points):6} points {len(faces):6} faces")
    for f in (args.out / "mascot.glb", usd, args.out / "mascot-rig.json"):
        print(f"{f.name:16} {f.stat().st_size:9,} bytes")


if __name__ == "__main__":
    main()
