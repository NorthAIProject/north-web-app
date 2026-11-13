"""The Khepri emblem in 3D: turns the source GLB into the models the clients load.

The source (`Khepri_V2_Emblem_3D.glb`) is a flat list of 16 named parts: Y up, facing +Z,
no normals, no transforms, no textures. Its geometry is kept as supplied. This script uses the
standard library only:

  1. reads the GLB defensively (the file is outside data: bounds-checked, no external URIs);
  2. centres the emblem on the origin and scales it to one unit tall;
  3. restyles every part to the brand tokens in `src/lib/styles/app.css` (`PAINT`, `LOOKS`):
     navy wings, Midnight Steel head, Solar Gold rules and sun. Only the sun's face glows;
  4. adds smooth normals with a 45 degree crease;
  5. merges parts that share a look (one draw call per look);
  6. writes `emblem.glb` (web, float; pack it with gltfpack, see static/assets/models/README.md),
     `Emblem.usdz` (iOS) and `emblem-rig.json` (looks, glow part, framing) to --out.

    python3 -I scripts/brand/emblem_3d.py --emblem /path/to/copy/Khepri_V2_Emblem_3D.glb \\
        --css src/lib/styles/app.css --out out/emblem-3d

Run it with `-I` and keep the source in a directory of its own: the GLB is not ours.
The USDZ step needs `usdcat` and `usdzip` (in /usr/bin on macOS); without them the .usda is kept.
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

CREASE = math.cos(math.radians(45))
MAX_BYTES = 32 * 1024 * 1024

# Brand colours, by (selector, token) in app.css. The hex in each comment is the brand palette
# name the token carries today; the script reads the token, never the hex.
TOKENS = {
    "armor_navy": (":root", "primary"),  # Armor Navy #1B2A40, the wing fill in the flat emblem
    "midnight_steel": (".dark", "card"),  # Midnight Steel #121C2B, the scarab's head
    "solar_gold": (".dark", "north-signal"),  # Solar Gold #E8B65C, every rule and the sun
}

# Looks: token, metallic, roughness, glow (emissive = colour * glow; 0 = none).
# Enamel is barely metallic so the navy reads as a filled wing, not a mirror of the room.
LOOKS = {
    "wing": ("armor_navy", 0.15, 0.42, 0.0),
    "head": ("midnight_steel", 0.15, 0.38, 0.0),
    "gold": ("solar_gold", 1.0, 0.26, 0.0),
    "sun": ("solar_gold", 1.0, 0.22, 0.0),
    "sun_face": ("solar_gold", 0.3, 0.18, 0.35),
}

# Every source part, by node name, and the look it takes. A part missing here, or named here
# and missing from the source, stops the build: the source changed and needs a look.
PAINT = {
    "01_LOGO_OUTER_WING__Obsidian_Blue_Enamel": "wing",
    "01_LOGO_OUTER_WING_GOLD_BOUNDARY__Polished_Gold": "gold",
    "02_LOGO_OUTER_RIBBED_ENGRAVING__Brushed_Antique_Gold": "gold",
    "03_LOGO_INNER_RISING_WING__Midnight_Ceramic_Armor": "wing",
    "03_LOGO_INNER_RISING_WING_GOLD_BOUNDARY__Brushed_Antique_Gold": "gold",
    "04_LOGO_INNER_GOLD_SWEEP__Light_Edge_Gold": "gold",
    "05_LOGO_FEATHER_BASE__Obsidian_Blue_Enamel": "wing",
    "05_LOGO_FEATHER_BASE_GOLD_BOUNDARY__Brushed_Antique_Gold": "gold",
    "06_LOGO_CENTRAL_INNER_SEAM__Light_Edge_Gold": "gold",
    "07_LOGO_CENTRAL_NAVY_CAP__Ink_Enamel": "head",
    "08_LOGO_CENTRAL_CAP_GOLD_TRACERY__Brushed_Antique_Gold": "gold",
    "09_LOGO_FLOATING_SUN_SPHERE__Polished_Gold": "sun",
    "10_LOGO_SUN_FACING_GLOW__Solar_Amber_Glass": "sun_face",
    "11_LOGO_SUN_SPHERE_INNER_HIGHLIGHT__Light_Edge_Gold": "sun",
    "12_LOGO_VERTICAL_SOLAR_STEM__Light_Edge_Gold": "gold",
    "13_LOGO_SUN_STEM_DOT__Solar_Emissive_Yellow": "gold",
}

GLOW_LOOK = "sun_face"  # the one look the clients pulse
SCENE = "Emblem"
FOV_DEGREES = 30
MARGIN = 1.08  # frame 8 % wider than the emblem so the tilt never clips


# ---------------------------------------------------------------- tokens


OKLCH = re.compile(r"oklch\(\s*([\d.]+)\s+([\d.]+)\s+([\d.]+)\s*\)")
VAR = re.compile(r"var\(--([\w-]+)\)")


def css_block(css, selector):
    match = re.search(r"(?m)^" + re.escape(selector) + r"\s*\{(.*?)\n\}", css, re.S)
    if not match:
        raise SystemExit(f"app.css: selector {selector!r} not found")
    body = re.sub(r"/\*.*?\*/", "", match.group(1), flags=re.S)
    return dict(re.findall(r"--([\w-]+):\s*([^;]+);", body))


def token_linear_rgb(css, selector, name):
    """Resolves --name under selector to linear sRGB (what glTF and USD colour factors take)."""
    tokens = css_block(css, selector)
    value = tokens.get(name)
    for _ in range(8):
        ref = VAR.fullmatch((value or "").strip())
        if not ref:
            break
        value = tokens.get(ref.group(1)) or css_block(css, ":root").get(ref.group(1))
    m = OKLCH.fullmatch((value or "").strip())
    if not m:
        raise SystemExit(f"app.css: {selector} --{name} is not an opaque oklch() value: {value!r}")
    l, c, h = float(m.group(1)), float(m.group(2)), math.radians(float(m.group(3)))
    a, b = c * math.cos(h), c * math.sin(h)
    # OKLab -> LMS -> XYZ-D65 (Ottosson), as scripts/sync-theme.py in north-ios does
    l_ = (l + 0.3963377774 * a + 0.2158037573 * b) ** 3
    m_ = (l - 0.1055613458 * a - 0.0638541728 * b) ** 3
    s_ = (l - 0.0894841775 * a - 1.2914855480 * b) ** 3
    x = 1.2270138511 * l_ - 0.5577999807 * m_ + 0.2812561490 * s_
    y = -0.0405801784 * l_ + 1.1122568696 * m_ - 0.0716766787 * s_
    z = -0.0763812845 * l_ - 0.4214819784 * m_ + 1.5861632204 * s_
    # XYZ-D65 -> linear sRGB
    rgb = (
        3.2409699419 * x - 1.5373831776 * y - 0.4986107603 * z,
        -0.9692436363 * x + 1.8759675015 * y + 0.0415550574 * z,
        0.0556300797 * x - 0.2039769589 * y + 1.0569715142 * z,
    )
    return tuple(round(min(max(v, 0.0), 1.0), 5) for v in rgb)


def srgb_hex(linear):
    def encode(v):
        return 12.92 * v if v <= 0.0031308 else 1.055 * v ** (1 / 2.4) - 0.055

    return "#" + "".join(f"{round(encode(v) * 255):02X}" for v in linear)


# ---------------------------------------------------------------- reading


def read_glb(path, check=None):
    """Returns {node name: (points, faces)}. Refuses anything this script does not expect.

    `check(parts)` validates the part names (default: they must match PAINT exactly)."""
    data = Path(path).read_bytes()
    if len(data) > MAX_BYTES or len(data) < 28:
        raise SystemExit(f"{path}: unexpected size {len(data)}")
    magic, version, length = struct.unpack_from("<4sII", data, 0)
    if magic != b"glTF" or version != 2 or length != len(data):
        raise SystemExit(f"{path}: not a glTF 2.0 binary")
    json_len, json_type = struct.unpack_from("<II", data, 12)
    if json_type != 0x4E4F534A or 20 + json_len + 8 > len(data):
        raise SystemExit(f"{path}: bad JSON chunk")
    doc = json.loads(data[20 : 20 + json_len])
    bin_len, bin_type = struct.unpack_from("<II", data, 20 + json_len)
    if bin_type != 0x004E4942 or 28 + json_len + bin_len > len(data):
        raise SystemExit(f"{path}: bad BIN chunk")
    blob = data[28 + json_len : 28 + json_len + bin_len]
    if any("uri" in b for b in doc.get("buffers", [])) or doc.get("images"):
        raise SystemExit(f"{path}: external buffers or images are not accepted")
    if doc.get("extensionsRequired"):
        raise SystemExit(f"{path}: required extensions {doc['extensionsRequired']} not supported")
    accessors, views = doc["accessors"], doc["bufferViews"]

    def read(index, kind):
        acc = accessors[index]
        view = views[acc["bufferView"]]
        width = {"SCALAR": 1, "VEC3": 3}[acc["type"]]
        code, size = {5126: ("f", 4), 5125: ("I", 4), 5123: ("H", 2), 5121: ("B", 1)}[acc["componentType"]]
        if (kind == "points") != (code == "f" and width == 3):
            raise SystemExit(f"{path}: accessor {index} is not the expected {kind}")
        if view.get("byteStride", width * size) != width * size:
            raise SystemExit(f"{path}: interleaved accessor {index} not supported")
        offset = view.get("byteOffset", 0) + acc.get("byteOffset", 0)
        end = offset + acc["count"] * width * size
        if end > view.get("byteOffset", 0) + view["byteLength"] or end > len(blob):
            raise SystemExit(f"{path}: accessor {index} runs past its buffer")
        flat = struct.unpack_from(f"<{acc['count'] * width}{code}", blob, offset)
        return [flat[i : i + width] for i in range(0, len(flat), width)] if width > 1 else flat

    parts = {}
    for node in doc["nodes"]:
        if any(key in node for key in ("matrix", "translation", "rotation", "scale")):
            raise SystemExit(f"{node.get('name')}: the source is expected to have no transforms")
        if "mesh" not in node:
            continue
        name = node.get("name", "")
        if name in parts:
            raise SystemExit(f"{name}: duplicate part name")
        points, faces = [], []
        for prim in doc["meshes"][node["mesh"]]["primitives"]:
            if prim.get("mode", 4) != 4 or "indices" not in prim:
                raise SystemExit(f"{name}: only indexed triangles are supported")
            base = len(points)
            new = read(prim["attributes"]["POSITION"], "points")
            if not all(math.isfinite(v) for p in new for v in p):
                raise SystemExit(f"{name}: non-finite position")
            flat = read(prim["indices"], "indices")
            if len(flat) % 3 or (flat and max(flat) >= len(new)):
                raise SystemExit(f"{name}: index out of range")
            points += [tuple(p) for p in new]
            faces += [(base + flat[i], base + flat[i + 1], base + flat[i + 2]) for i in range(0, len(flat), 3)]
        parts[name] = (points, faces)
    (check or check_paint)(parts)
    return parts


def check_paint(parts):
    unknown, missing = sorted(set(parts) - set(PAINT)), sorted(set(PAINT) - set(parts))
    if unknown or missing:
        raise SystemExit(f"source parts changed: unknown {unknown}, missing {missing}; update PAINT")


# ---------------------------------------------------------------- geometry


def with_normals(points, faces):
    """Smooth normals with a crease; points are split along creases. Returns (points, normals, faces).

    Corners are grouped by position, not index, so a source that did not weld its points still
    gets smooth shading. Zero-area faces are dropped (they draw nothing)."""
    weld = {}
    group = [weld.setdefault(tuple(round(v, 6) for v in p), len(weld)) for p in points]
    area_n, unit_n, around = [], [], defaultdict(list)
    for index, (a, b, c) in enumerate(faces):
        pa, pb, pc = points[a], points[b], points[c]
        u = (pb[0] - pa[0], pb[1] - pa[1], pb[2] - pa[2])
        v = (pc[0] - pa[0], pc[1] - pa[1], pc[2] - pa[2])
        n = (u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0])
        length = math.sqrt(n[0] ** 2 + n[1] ** 2 + n[2] ** 2)
        area_n.append(n)
        unit_n.append((n[0] / length, n[1] / length, n[2] / length) if length > 1e-14 else None)
        for corner in (a, b, c):
            around[group[corner]].append(index)
    out_points, out_normals, out_faces, seen = [], [], [], {}
    for index, face in enumerate(faces):
        mine = unit_n[index]
        if mine is None:
            continue
        corners = []
        for corner in face:
            total = [0.0, 0.0, 0.0]
            for other in around[group[corner]]:
                theirs = unit_n[other]
                if theirs and mine[0] * theirs[0] + mine[1] * theirs[1] + mine[2] * theirs[2] >= CREASE:
                    for axis in range(3):
                        total[axis] += area_n[other][axis]
            length = math.sqrt(sum(x * x for x in total)) or 1.0
            normal = tuple(round(x / length, 3) for x in total)
            key = (group[corner], normal)
            if key not in seen:
                seen[key] = len(out_points)
                out_points.append(points[corner])
                out_normals.append(normal)
            corners.append(seen[key])
        out_faces.append(tuple(corners))
    return out_points, out_normals, out_faces


def build(parts):
    """Centres on the origin, one unit tall; merges parts by look. Returns ({look: mesh}, size)."""
    every = [p for points, _ in parts.values() for p in points]
    low = [min(p[i] for p in every) for i in range(3)]
    high = [max(p[i] for p in every) for i in range(3)]
    mid = [(low[i] + high[i]) / 2 for i in range(3)]
    scale = 1.0 / (high[1] - low[1])
    merged = defaultdict(lambda: ([], []))
    for name in sorted(parts):
        points, faces = parts[name]
        out_points, out_faces = merged[PAINT[name]]
        base = len(out_points)
        out_points += [tuple(round((p[i] - mid[i]) * scale, 6) for i in range(3)) for p in points]
        out_faces += [(a + base, b + base, c + base) for a, b, c in faces]
    meshes = {look: with_normals(*merged[look]) for look in sorted(merged)}
    size = [round((high[i] - low[i]) * scale, 4) for i in range(3)]
    return meshes, size


# ---------------------------------------------------------------- writing


def write_glb(path, meshes, looks):
    blob = bytearray()
    views, accessors, gl_meshes, nodes, materials = [], [], [], [], []

    def view(payload, target):
        while len(blob) % 4:
            blob.append(0)
        views.append({"buffer": 0, "byteOffset": len(blob), "byteLength": len(payload), "target": target})
        blob.extend(payload)
        return len(views) - 1

    for look, (points, normals, faces) in meshes.items():
        lo = [min(p[i] for p in points) for i in range(3)]
        hi = [max(p[i] for p in points) for i in range(3)]
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
        prim = {"attributes": {"POSITION": a, "NORMAL": a + 1}, "indices": a + 2, "material": len(materials) - 1}
        gl_meshes.append({"name": f"{SCENE}_{look}", "primitives": [prim]})
        nodes.append({"name": f"{SCENE}_{look}", "mesh": len(gl_meshes) - 1})
    nodes.append({"name": SCENE, "children": list(range(len(nodes)))})
    doc = {
        "asset": {"version": "2.0", "generator": "north-web-app scripts/brand/emblem_3d.py"},
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


def write_usd(path, meshes, looks):
    def tuples(values, digits):
        return ", ".join("(" + ", ".join(f"{v:.{digits}g}" for v in t) + ")" for t in values)

    lines = ['#usda 1.0', '(', f'    defaultPrim = "{SCENE}"', '    metersPerUnit = 1', '    upAxis = "Y"', ')', '',
             f'def Xform "{SCENE}" (', '    kind = "component"', ')', '{', '    def Scope "Materials"', '    {']  # fmt: skip
    for look in meshes:
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
    lines += ["    }", '    def Xform "Root"', "    {"]
    for look, (points, normals, faces) in meshes.items():
        lines += [
            f'        def Mesh "{SCENE}_{look}" (', '            prepend apiSchemas = ["MaterialBindingAPI"]', '        )',
            '        {',
            f"            int[] faceVertexCounts = [{', '.join('3' for _ in faces)}]",
            f"            int[] faceVertexIndices = [{', '.join(str(i) for f in faces for i in f)}]",
            f"            point3f[] points = [{tuples(points, 6)}]",
            f'            normal3f[] normals = [{tuples(normals, 3)}] (', '                interpolation = "vertex"', '            )',
            '            uniform token subdivisionScheme = "none"',
            f"            rel material:binding = </{SCENE}/Materials/{look}>",
            '        }',
        ]  # fmt: skip
    lines += ["    }", "}"]
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


# ---------------------------------------------------------------- main


def main():
    here = Path(__file__).resolve().parents[2]
    parser = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    parser.add_argument("--emblem", required=True, type=Path, help="Khepri_V2_Emblem_3D.glb (a copy)")
    parser.add_argument("--css", type=Path, default=here / "src/lib/styles/app.css")
    parser.add_argument("--out", type=Path, default=here / "out/emblem-3d")
    args = parser.parse_args()

    css = args.css.read_text()
    colours = {key: token_linear_rgb(css, sel, name) for key, (sel, name) in TOKENS.items()}
    looks = {look: (colours[token], m, r, g) for look, (token, m, r, g) in LOOKS.items()}
    parts = read_glb(args.emblem)
    meshes, size = build(parts)

    args.out.mkdir(parents=True, exist_ok=True)
    write_glb(args.out / "emblem.glb", meshes, looks)
    usd = write_usd(args.out / "Emblem.usdz", meshes, looks)
    # Distance at which the emblem's larger side, with margin, fills the vertical field of view.
    fit = max(size[0], size[1]) * MARGIN / 2 / math.tan(math.radians(FOV_DEGREES) / 2)
    rig = {
        "version": 1,
        "source": {"file": args.emblem.name, "sha256": hashlib.sha256(args.emblem.read_bytes()).hexdigest()},
        "space": "+Y up, facing +Z, centred on the origin, 1 unit tall",
        "size": {"width": size[0], "height": size[1], "depth": size[2]},
        "looks": {
            look: {"token": f"{TOKENS[t][0]} --{TOKENS[t][1]}", "srgb": srgb_hex(colours[t]), "glow": g}
            for look, (t, _, _, g) in LOOKS.items()
            if look in meshes
        },
        "glowMaterial": GLOW_LOOK,
        "meshes": {look: f"{SCENE}_{look}" for look in meshes},
        "camera": {"fovDegrees": FOV_DEGREES, "distance": round(fit + size[2] / 2, 4)},
        "lights": {"key": ".dark --north-signal", "rim": ".dark --muted-foreground"},
    }
    (args.out / "emblem-rig.json").write_text(json.dumps(rig, indent=2) + "\n")
    for look, (points, _, faces) in meshes.items():
        print(f"{look:9} {len(points):6} points {len(faces):6} faces")
    for f in (args.out / "emblem.glb", usd, args.out / "emblem-rig.json"):
        print(f"{f.name:16} {f.stat().st_size:9,} bytes")


if __name__ == "__main__":
    main()
