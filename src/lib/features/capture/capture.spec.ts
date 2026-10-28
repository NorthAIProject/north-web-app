import { describe, expect, it } from 'vitest';
import { isCaptureFormError, itemsFromForm } from './capture';

// north-client internal/capture handler_test.go itemsFromForm, carried over.
function refused(fields: Record<string, string>): string {
	try {
		itemsFromForm(form(fields));
	} catch (err) {
		if (isCaptureFormError(err)) return err.message;
		throw err;
	}
	throw new Error('accepted');
}

function form(fields: Record<string, string>) {
	const f = new FormData();
	for (const [k, v] of Object.entries(fields)) f.set(k, v);
	return f;
}

describe('capture form', () => {
	it('keeps only ticked rows, with their edited values', () => {
		const items = itemsFromForm(
			form({
				'items[0].kind': 'water',
				'items[0].include': 'on',
				'items[0].source': '500ml water',
				'items[0].amount_ml': '450',
				'items[1].kind': 'weight',
				'items[1].kg': '80'
			})
		);
		expect(items).toEqual([{ kind: 'water', source: '500ml water', water: { amount_ml: 450 } }]);
	});

	it('refuses an unreadable sleep date and an unknown kind', () => {
		expect(refused({ 'items[0].kind': 'sleep', 'items[0].include': 'on', 'items[0].minutes': '420', 'items[0].date': '28/10' })).toBe(
			'Unreadable date "28/10".'
		);
		expect(refused({ 'items[0].kind': 'mystery', 'items[0].include': 'on' })).toBe('Unknown capture kind "mystery".');
	});

	it('says so when nothing was ticked', () => {
		expect(refused({ 'items[0].kind': 'water', 'items[0].amount_ml': '250' })).toBe('Nothing was ticked, so nothing was logged.');
	});
});
