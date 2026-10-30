#!/usr/bin/env python3
"""Builds the Khepri solar brand assets from geometry and the bundled fonts.

Every file in static/assets/brand/solar/ comes out of this script, so a change
to the emblem or the palette is one edit here and one run. It needs fontTools
(with brotli, to read the woff2 fonts) and rsvg-convert for the PNGs:

    python3 -m venv /tmp/brand-venv && /tmp/brand-venv/bin/pip install fonttools brotli
    /tmp/brand-venv/bin/python scripts/brand/build.py

The emblem is a vector interpretation of the 2026-10-30 reference image
("Khepri: A Brighter Future"), drawn by hand in that image's 1020x960 crop
space. It is not an original designer source file; docs/brand/README.md says
which assets are interpretations and which are generated.
"""

from __future__ import annotations

import re
import shutil
import subprocess
from pathlib import Path

from fontTools.pens.boundsPen import BoundsPen
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / "static" / "assets" / "brand" / "solar"
BRAND = ROOT / "static" / "assets" / "brand"
FONTS = ROOT / "static" / "assets" / "fonts"

# The palette, by brand name (docs/brand/README.md).
OBSIDIAN = "#0B111C"
MIDNIGHT = "#121C2B"
ARMOR = "#1B2A40"
GOLD = "#E8B65C"
IVORY = "#F6F2EA"
SILVER = "#A6AFBD"
INK = "#0F1A2A"
SLATE = "#5A6475"
# Gold for marks on ivory: decorative, so it need not reach text contrast,
# but Solar Gold itself washes out on the light background.
GOLD_ON_LIGHT = "#B8862E"

# ---------------------------------------------------------------- emblem ----

CX = 510  # the emblem's axis of symmetry in crop space
EMBLEM_BOX = (35, 20, 950, 950)  # square viewBox around the emblem

# Left wing silhouette: tip, around the outside, to the bottom point, back up
# the inside. The right wing is its mirror.
WING = (
    "M348 122 C220 170 70 290 42 470 C20 640 150 820 330 905 "
    "C400 935 470 948 510 952 "
    "C492 870 455 760 392 668 C300 570 208 480 212 365 C216 265 268 180 348 122 Z"
)
# Feather contours inside the wing.
FEATHER_UPPER = "M112 305 C66 425 86 565 190 685 C285 790 420 872 495 935"
FEATHER_LOWER = "M128 742 C220 790 320 830 405 912"
HORIZON = "M383 705 A127 127 0 0 1 637 705"


def mirror(path: str) -> str:
    """Reflects an absolute-coordinate path (M/L/C/Z only) about x=CX."""
    out: list[str] = []
    is_x = True
    for token in re.findall(r"[A-Za-z]|-?\d*\.?\d+", path):
        if token.isalpha():
            out.append(token)
            is_x = True
            continue
        value = float(token)
        out.append(f"{(2 * CX - value) if is_x else value:g}")
        is_x = not is_x
    return " ".join(out)


def sun_gradient(gid: str, stops: tuple[str, ...] = ("#FFF1CC", "#FFE0A1", GOLD, "#C38F3E")) -> str:
    offsets = ("0", "0.35", "0.75", "1")
    body = "".join(f'<stop offset="{o}" stop-color="{c}"/>' for o, c in zip(offsets, stops))
    return f'<radialGradient id="{gid}" cx="0.42" cy="0.32" r="0.75">{body}</radialGradient>'


def emblem(style: str = "detail", gold: str = GOLD, wing: str = ARMOR, horizon: str = "#162236",
           sun: str | None = None, stroke: float = 11) -> str:
    """The emblem's elements in crop space, without an <svg> wrapper.

    detail: navy wings with gold contours, for 48 px and up.
    silhouette: solid wings and a heavier stem, for 32 px and below and for
    one-colour use, where hairline contours would vanish.
    """
    sun = sun or gold
    parts = [f'<circle cx="510" cy="462" r="146" fill="{sun}"/>']
    if style == "detail":
        # The horizon fills from the arc down to the point; its sides run
        # under the wings. Only the arc carries the gold rim.
        parts.append(f'<path d="{HORIZON} L660 705 L510 952 L360 705 Z" fill="{horizon}"/>')
        parts.append(f'<path d="{HORIZON}" fill="none" stroke="{gold}" stroke-width="{stroke * 0.8:g}"/>')
        for d in (WING, mirror(WING)):
            parts.append(f'<path d="{d}" fill="{wing}" stroke="{gold}" stroke-width="{stroke:g}" stroke-linejoin="round"/>')
        for d in (FEATHER_UPPER, mirror(FEATHER_UPPER), FEATHER_LOWER, mirror(FEATHER_LOWER)):
            parts.append(f'<path d="{d}" fill="none" stroke="{gold}" stroke-width="{stroke * 0.8:g}" stroke-linecap="round"/>')
        parts.append(f'<path d="M510 30 L510 165" stroke="{gold}" stroke-width="{stroke * 1.1:g}"/>')
        parts.append(f'<circle cx="510" cy="215" r="17" fill="{gold}"/>')
    else:
        for d in (WING, mirror(WING)):
            parts.append(f'<path d="{d}" fill="{gold}"/>')
        parts.append(f'<path d="M510 40 L510 150" stroke="{gold}" stroke-width="34"/>')
        parts.append(f'<circle cx="510" cy="215" r="34" fill="{gold}"/>')
    return "".join(parts)


def place_emblem(content: str, x: float, y: float, size: float) -> str:
    """Puts emblem content into a size x size square at (x, y)."""
    bx, by, bw, _ = EMBLEM_BOX
    s = size / bw
    return f'<g transform="translate({x:g} {y:g}) scale({s:.5f}) translate({-bx} {-by})">{content}</g>'


# ------------------------------------------------------------- wordmark ----


class Face:
    """A font's outlines as SVG path data, in font units with y pointing down."""

    def __init__(self, font: TTFont):
        self.font = font
        self.glyphs = font.getGlyphSet()
        self.cmap = font.getBestCmap()
        self.hmtx = font["hmtx"]
        self.upem = font["head"].unitsPerEm
        self.cap = font["OS/2"].sCapHeight

    def run(self, text: str, tracking: float = 0, glyph_names: dict[int, str] | None = None) -> tuple[str, float, list[float]]:
        """Returns path data, advance width and each glyph's x for a line of text."""
        glyph_names = glyph_names or {}
        x = 0.0
        paths: list[str] = []
        xs: list[float] = []
        for i, ch in enumerate(text):
            name = glyph_names.get(i) or self.cmap[ord(ch)]
            pen = SVGPathPen(self.glyphs)
            self.glyphs[name].draw(TransformPen(pen, (1, 0, 0, -1, x, 0)))
            paths.append(pen.getCommands())
            xs.append(x)
            x += self.hmtx[name][0] + tracking
        return " ".join(p for p in paths if p), x - tracking, xs

    def bounds(self, name: str) -> tuple[float, float, float, float]:
        pen = BoundsPen(self.glyphs)
        self.glyphs[name].draw(pen)
        return pen.bounds


def load_faces() -> tuple[Face, Face]:
    marcellus = Face(TTFont(FONTS / "marcellus" / "marcellus-regular.woff2"))
    geist = TTFont(FONTS / "geist" / "geist-variable.woff2")
    geist = instantiateVariableFont(geist, {"wght": 400})
    return marcellus, Face(geist)


def wordmark(face: Face, ink: str, dot: str) -> tuple[str, float, float]:
    """'Khepri' in Marcellus with a dotless i and a gold sun for its dot.

    Returns the elements (baseline at y=0), the width and the cap height,
    all in font units.
    """
    text = "Khepri"
    tracking = 0.02 * face.upem
    path, width, xs = face.run(text, tracking, glyph_names={5: "dotlessi"})
    i_x0, _, i_x1, _ = face.bounds("dotlessi")
    r = 0.075 * face.upem
    # As in the reference, the sun sits at cap height, just right of the stem.
    cx = xs[5] + (i_x0 + i_x1) / 2 + 0.035 * face.upem
    cy = -face.cap + r
    right = max(width, cx + r)
    return (f'<path d="{path}" fill="{ink}"/><circle cx="{cx:.1f}" cy="{cy:.1f}" r="{r:.1f}" fill="{dot}"/>',
            right, face.cap)


def tagline(face: Face, ink: str) -> tuple[str, float, float]:
    """'A BRIGHTER YOU' in Geist, tracked wide as in the reference."""
    path, width, _ = face.run("A BRIGHTER YOU", tracking=0.32 * face.upem)
    return f'<path d="{path}" fill="{ink}"/>', width, face.cap


# --------------------------------------------------------------- output ----


def svg(view_w: float, view_h: float, body: str, label: str = "Khepri", defs: str = "",
        size: tuple[int, int] | None = None) -> str:
    dims = f' width="{size[0]}" height="{size[1]}"' if size else ""
    d = f"<defs>{defs}</defs>" if defs else ""
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {view_w:g} {view_h:g}"{dims} '
            f'role="img" aria-label="{label}">{d}{body}</svg>\n')


def write(name: str, content: str, folder: Path = OUT) -> Path:
    path = folder / name
    path.write_text(content)
    return path


def png(svg_path: Path, out: Path, width: int, height: int | None = None) -> None:
    args = ["rsvg-convert", "-w", str(width)]
    if height:
        args += ["-h", str(height)]
    subprocess.run([*args, str(svg_path), "-o", str(out)], check=True)


def lockups(marcellus: Face, geist: Face) -> None:
    for tone, ink, dot, sub, horizon in (
        ("dark", IVORY, GOLD, SILVER, "#162236"),
        ("light", INK, GOLD_ON_LIGHT, SLATE, MIDNIGHT),
    ):
        mark = emblem("detail", horizon=horizon, sun=f"url(#sun-{tone})")
        defs = sun_gradient(f"sun-{tone}")
        word, word_w, cap = wordmark(marcellus, ink, dot)

        # Horizontal: emblem 1000 tall, wordmark cap height 42% of it,
        # centred on the emblem, a gap of 20%, and room for the sun dot.
        e = 1000
        s = 0.42 * e / cap
        gap = 0.2 * e
        width = e + gap + word_w * s + 0.03 * e
        baseline = e / 2 + 0.42 * e / 2
        body = (place_emblem(mark, 0, 0, e)
                + f'<g transform="translate({e + gap:g} {baseline:g}) scale({s:.5f})">{word}</g>')
        write(f"khepri-lockup-horizontal-{tone}.svg", svg(width, e, body, defs=defs))

        # Vertical: emblem, wordmark, tagline — the reference composition.
        tag, tag_w, tag_cap = tagline(geist, sub)
        word_cap = 0.3 * e
        ws = word_cap / cap
        ts = 0.065 * e / tag_cap
        width = max(e, word_w * ws, tag_w * ts) + 0.08 * e
        word_base = e + 0.16 * e + word_cap
        tag_base = word_base + 0.17 * e + 0.065 * e
        height = tag_base + 0.05 * e
        body = (place_emblem(mark, (width - e) / 2, 0, e)
                + f'<g transform="translate({(width - word_w * ws) / 2:g} {word_base:g}) scale({ws:.5f})">{word}</g>'
                + f'<g transform="translate({(width - tag_w * ts) / 2:g} {tag_base:g}) scale({ts:.5f})">{tag}</g>')
        write(f"khepri-lockup-vertical-{tone}.svg", svg(width, height, body, label="Khepri — A brighter you", defs=defs))

        # Wordmark alone.
        top = cap * 1.04
        write(f"khepri-wordmark-{tone}.svg", svg(word_w, top + 40, f'<g transform="translate(0 {top:g})">{word}</g>'))

    # One colour: the silhouette emblem and the wordmark in currentColor.
    word, word_w, cap = wordmark(marcellus, "currentColor", "currentColor")
    e = 1000
    s = 0.42 * e / cap
    gap = 0.2 * e
    body = (place_emblem(emblem("silhouette", gold="currentColor"), 0, 0, e)
            + f'<g transform="translate({e + gap:g} {e / 2 + 0.21 * e:g}) scale({s:.5f})">{word}</g>')
    write("khepri-lockup-horizontal-mono.svg", svg(e + gap + word_w * s + 0.03 * e, e, body))
    write("khepri-wordmark-mono.svg", svg(word_w, cap * 1.04 + 40, f'<g transform="translate(0 {cap * 1.04:g})">{word}</g>'))


def emblems() -> None:
    box = " ".join(str(v) for v in EMBLEM_BOX)

    def square(content: str, defs: str = "") -> str:
        d = f"<defs>{defs}</defs>" if defs else ""
        return f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{box}" role="img" aria-label="Khepri">{d}{content}</svg>\n'

    write("khepri-emblem-dark.svg", square(emblem("detail", sun="url(#sun)"), sun_gradient("sun")))
    write("khepri-emblem-light.svg", square(emblem("detail", horizon=MIDNIGHT, sun="url(#sun)"), sun_gradient("sun")))
    write("khepri-emblem-small.svg", square(emblem("silhouette", sun="url(#sun)"), sun_gradient("sun")))
    # Solar Gold wings wash out on ivory, so the small light mark keeps the
    # gold for the sun and draws the wings in navy.
    write("khepri-emblem-small-light.svg", square(emblem("silhouette", gold=ARMOR, sun="url(#sun)"), sun_gradient("sun")))
    write("khepri-emblem-mono.svg", square(emblem("silhouette", gold="currentColor")))


def plate_icon(size: int, pad: float, detail: bool, plate: str = "flat") -> str:
    """The emblem on an opaque navy square: app and PWA icons, whose hosts
    turn transparency black or crop it."""
    inner = size * (1 - 2 * pad)
    defs = sun_gradient("sun")
    if plate == "flat":
        bg = f'<rect width="{size}" height="{size}" fill="{OBSIDIAN}"/>'
    else:
        # A low sunrise behind the sphere: the reference's warm light, kept
        # to a faint lift of the navy.
        top, bottom = ("#1D2B47", "#0B1222") if plate == "light" else ("#141E31", "#05080F")
        defs += (f'<radialGradient id="plate" cx="50%" cy="40%" r="75%"><stop offset="0" stop-color="{top}"/>'
                 f'<stop offset="1" stop-color="{bottom}"/></radialGradient>'
                 '<radialGradient id="halo" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#FFE0A1" stop-opacity="0.28"/>'
                 '<stop offset="1" stop-color="#FFE0A1" stop-opacity="0"/></radialGradient>')
        bg = f'<rect width="{size}" height="{size}" fill="url(#plate)"/>'
        # halo centred on the sphere (crop 510,462 inside the emblem box)
        s = inner / EMBLEM_BOX[2]
        hx = size * pad + (510 - EMBLEM_BOX[0]) * s
        hy = size * pad + (462 - EMBLEM_BOX[1]) * s
        bg += f'<circle cx="{hx:.1f}" cy="{hy:.1f}" r="{390 * s:.1f}" fill="url(#halo)"/>'
    content = emblem("detail" if detail else "silhouette", sun="url(#sun)",
                     stroke=11 if size >= 256 else 18)
    return (f'<svg xmlns="http://www.w3.org/2000/svg" width="{size}" height="{size}" viewBox="0 0 {size} {size}">'
            f'<defs>{defs}</defs>{bg}{place_emblem(content, size * pad, size * pad, inner)}</svg>\n')


def tinted_icon(size: int = 1024, pad: float = 0.15) -> str:
    """iOS tinted icons: a greyscale mark on black that the system tints."""
    inner = size * (1 - 2 * pad)
    stops = ("#FFFFFF", "#F2F2F2", "#D6D6D6", "#B0B0B0")
    content = emblem("detail", gold="#E6E6E6", wing="#2B2B2B", horizon="#1C1C1C", sun="url(#sun)")
    return (f'<svg xmlns="http://www.w3.org/2000/svg" width="{size}" height="{size}" viewBox="0 0 {size} {size}">'
            f'<defs>{sun_gradient("sun", stops)}</defs><rect width="{size}" height="{size}" fill="#000"/>'
            f'{place_emblem(content, size * pad, size * pad, inner)}</svg>\n')


def icons() -> None:
    # iOS app icons (copied into north-ios-app Design/AppIcon by hand).
    write("app-icon-light.svg", plate_icon(1024, 0.15, True, plate="light"))
    write("app-icon-dark.svg", plate_icon(1024, 0.15, True, plate="dark"))
    write("app-icon-tinted.svg", tinted_icon())

    # Favicon: the silhouette on a rounded navy tile, legible on light and
    # dark tab strips alike.
    fav = (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><defs>{sun_gradient("sun")}</defs>'
           f'<rect width="64" height="64" rx="14" fill="{OBSIDIAN}"/>'
           f'{place_emblem(emblem("silhouette", sun="url(#sun)"), 7, 6, 50)}</svg>\n')
    write("favicon.svg", fav, BRAND)

    # PWA plates, padded so rounded and adaptive masks keep the stem.
    tmp = OUT / "_tmp"
    tmp.mkdir(exist_ok=True)
    for name, size, pad in (("pwa-180.png", 180, 0.12), ("pwa-192.png", 192, 0.12),
                            ("pwa-512.png", 512, 0.12), ("pwa-512-maskable.png", 512, 0.22)):
        src = write(f"{name}.svg", plate_icon(size, pad, size >= 256), tmp)
        png(src, BRAND / name, size)
    shutil.rmtree(tmp)


def og_card(marcellus: Face, geist: Face) -> None:
    """1200x630 share card: the vertical lockup on obsidian, a faint horizon."""
    w, h = 1200, 630
    word, word_w, cap = wordmark(marcellus, IVORY, GOLD)
    tag, tag_w, tag_cap = tagline(geist, SILVER)
    e = 250
    ws = 88 / cap
    ts = 17 / tag_cap
    top = 92
    word_base = top + e + 40 + 88
    tag_base = word_base + 46 + 17
    defs = sun_gradient("sun") + (
        '<radialGradient id="dawn" cx="50%" cy="100%" r="70%"><stop offset="0" stop-color="#E8B65C" stop-opacity="0.16"/>'
        '<stop offset="1" stop-color="#E8B65C" stop-opacity="0"/></radialGradient>')
    body = (f'<rect width="{w}" height="{h}" fill="{OBSIDIAN}"/><rect width="{w}" height="{h}" fill="url(#dawn)"/>'
            + place_emblem(emblem("detail", sun="url(#sun)"), (w - e) / 2, top, e)
            + f'<g transform="translate({(w - word_w * ws) / 2:g} {word_base:g}) scale({ws:.5f})">{word}</g>'
            + f'<g transform="translate({(w - tag_w * ts) / 2:g} {tag_base:g}) scale({ts:.5f})">{tag}</g>')
    src = write("og-card.svg", svg(w, h, body, label="Khepri — A brighter you", defs=defs, size=(w, h)))
    png(src, BRAND / "og-card.png", w, h)


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    marcellus, geist = load_faces()
    emblems()
    lockups(marcellus, geist)
    icons()
    og_card(marcellus, geist)
    print(f"wrote {len(list(OUT.glob('*.svg')))} SVGs to {OUT.relative_to(ROOT)} and PNGs to {BRAND.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
