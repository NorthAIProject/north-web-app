import { describe, expect, it } from 'vitest';
import en from './catalogs/en.json';
import es from './catalogs/es.json';
import ptBR from './catalogs/pt-BR.json';
import ptPT from './catalogs/pt-PT.json';

// loadMessages ships one catalogue per page with no English behind it, so a
// key missing from es or pt would render as the bare key. Every catalogue
// carries every key, with a value.
const catalogs: Record<string, Record<string, string>> = { es, 'pt-PT': ptPT, 'pt-BR': ptBR };

describe('catalogue parity', () => {
	for (const [locale, messages] of Object.entries(catalogs)) {
		it(`${locale} has every English key, none empty`, () => {
			const missing = Object.keys(en).filter((key) => !messages[key]);
			expect(missing).toEqual([]);
		});

		it(`${locale} has no key English lacks`, () => {
			const extra = Object.keys(messages).filter((key) => !(key in en));
			expect(extra).toEqual([]);
		});
	}
});
