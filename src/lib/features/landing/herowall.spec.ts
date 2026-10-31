import { describe, expect, it } from 'vitest';
import { backSlots, frontSlots, phoneSlots, wallDeck } from './herowall.js';

const deck = wallDeck((key) => key);
const x = (style: string) => Number(/--x:([\d.]+)%/.exec(style)?.[1]);

describe('hero wall', () => {
	it('keeps the desktop rows at 15 front and 14 back cards', () => {
		expect(frontSlots(deck)).toHaveLength(15);
		expect(backSlots(deck)).toHaveLength(14);
	});

	it('gives a phone two whole cards that do not overlap at 320 px', () => {
		const phone = phoneSlots(deck);
		expect(phone.map((s) => s.card.kind)).toEqual(['quote', 'goal']);
		// Card height is clamp(11rem, 26vh, 18rem) at 2:3; on a 320×800 phone
		// that is 208 px tall, 139 px wide.
		const width = (0.26 * 800 * 2) / 3;
		const gap = ((x(phone[1].style) - x(phone[0].style)) / 100) * 320 - width;
		expect(gap).toBeGreaterThan(8);
		// And neither runs off the edge before it is tipped.
		expect((x(phone[0].style) / 100) * 320 - width / 2).toBeGreaterThan(0);
	});
});
