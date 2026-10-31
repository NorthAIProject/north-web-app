import { describe, expect, it } from 'vitest';
import { announcement, latest } from './transcript';

describe('latest', () => {
	it('keeps everything when the transcript fits', () => {
		expect(latest([1, 2, 3], 50)).toEqual({ shown: [1, 2, 3], hidden: 0 });
		expect(latest([], 50)).toEqual({ shown: [], hidden: 0 });
	});

	it('draws the newest turns and counts the rest', () => {
		const turns = Array.from({ length: 120 }, (_, i) => i);
		const { shown, hidden } = latest(turns, 50);
		expect(hidden).toBe(70);
		expect(shown).toHaveLength(50);
		expect(shown[0]).toBe(70);
		expect(shown.at(-1)).toBe(119);
	});

	it('reveals more as the limit grows, never past the start', () => {
		const turns = Array.from({ length: 120 }, (_, i) => i);
		expect(latest(turns, 100).hidden).toBe(20);
		expect(latest(turns, 150)).toEqual({ shown: turns, hidden: 0 });
	});
});

describe('announcement', () => {
	it('reads markdown as plain words', () => {
		expect(announcement('**Great** job.\n\n- Sleep _8h_\n- Eat `protein`\n\n## Next\nSee [the plan](/app/plan).')).toBe(
			'Great job. Sleep 8h Eat protein Next See the plan.'
		);
	});

	it('cuts a long reply at a word with an ellipsis', () => {
		const long = 'word '.repeat(200);
		const out = announcement(long, 40);
		expect(out.length).toBeLessThanOrEqual(41);
		expect(out.endsWith('word…')).toBe(true);
	});

	it('is empty for an empty reply', () => {
		expect(announcement('  \n ')).toBe('');
	});
});
