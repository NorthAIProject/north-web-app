# Marcellus

The brand serif: the wordmark and editorial headlines only (`font-display`
utility). Product text stays Geist. Chosen 2026-10-30 because its flared,
Trajan-like letters match the reference wordmark (docs/brand/README.md).

- Source: google/fonts `ofl/marcellus/Marcellus-Regular.ttf`, SIL Open Font
  License 1.1 (`OFL.txt`). One weight exists; there is no bold.
- Subset with `pyftsubset` to Latin-1 plus general punctuation, € and ™
  (features kern, liga), flavour woff2.
- The iOS app bundles the same subset as a TTF in
  `NorthKit/Sources/NorthKit/Resources/Fonts/Marcellus-Regular.ttf`.
