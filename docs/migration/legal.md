# Legal pages

| Go | Svelte | API |
| --- | --- | --- |
| `GET /privacy` → `web/legal/privacy.templ` | `src/routes/(public)/(site)/privacy/+page.svelte` | none |
| `GET /terms` → `web/legal/terms.templ` | `src/routes/(public)/(site)/terms/+page.svelte` | none |
| `GET /facebook-data` → `web/legal/facebook.templ` | `src/routes/(public)/(site)/facebook-data/+page.svelte` | none |
| `document` / `section` shells, `legal.go` constants | `src/lib/features/legal/{LegalDocument,LegalSection}.svelte`, `legal.ts` | — |

Text converted mechanically from the templ files; English in every locale with the translated `legal.english` note for non-English readers, as in Go.

## Deliberate differences
- The operator placeholders (`OPERATOR_LEGAL_NAME_UNSET`, …) are duplicated in `legal.ts`; they must be filled in both repos until Go's web/ is deleted. Go's "ready to publish" test (skips while placeholders remain) is not ported.

## Library candidates
None.
