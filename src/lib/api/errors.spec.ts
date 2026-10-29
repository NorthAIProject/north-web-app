import { describe, expect, it } from 'vitest';
import { apiErrorFrom } from './errors.js';

describe('apiErrorFrom', () => {
	it('keeps the reply, for a refusal that carries more than the envelope', async () => {
		const reply = {
			error: { message: 'The import stopped part way.', code: 'import_partial' },
			imported: { workouts: 3, duplicates: 0, sets: 24, skipped: 0, unmatched: [] }
		};
		const err = await apiErrorFrom(new Response(JSON.stringify(reply), { status: 500 }));
		expect(err.code).toBe('import_partial');
		expect(err.message).toBe('The import stopped part way.');
		expect(err.body).toEqual(reply);
	});

	it('survives a body that is not JSON', async () => {
		const err = await apiErrorFrom(new Response('Bad Gateway', { status: 502, statusText: 'Bad Gateway' }));
		expect(err.kind).toBe('unavailable');
		expect(err.message).toBe('Bad Gateway');
		expect(err.body).toBeUndefined();
	});
});
