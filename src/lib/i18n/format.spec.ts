import { describe, expect, it } from 'vitest';
import { formatDecimal, formatThousands, sprintf } from './format';

describe('sprintf', () => {
	it('formats positional and indexed verbs', () => {
		expect(sprintf('en', '%s has %d', ['Ana', 3])).toBe('Ana has 3');
		expect(sprintf('en', '%[2]s then %[1]s', ['a', 'b'])).toBe('b then a');
	});

	it('takes the index before the verb, as Go allows', () => {
		expect(sprintf('en', '%.0[1]f kcal burned today', [412.6])).toBe('413 kcal burned today');
		expect(sprintf('en', '%.1[2]f of %[1]s', ['goal', 2.25])).toBe('2.2 of goal');
	});

	it('uses the decimal comma for floats only', () => {
		expect(sprintf('pt-PT', '%.1f kg, %d sets', [72.5, 4])).toBe('72,5 kg, 4 sets');
	});

	it('marks missing arguments and escapes %%', () => {
		expect(sprintf('en', '%d%% of %s', [50])).toBe('50% of %!s(MISSING)');
	});
});

describe('toFixedGo', () => {
	it('rounds exact halves to even, like Go', () => {
		expect(sprintf('en', '%.0f kcal', [2712.5])).toBe('2712 kcal');
		expect(sprintf('en', '%.0f', [2713.5])).toBe('2714');
		expect(sprintf('en', '%.1f', [0.25])).toBe('0.2');
		expect(sprintf('en', '%.0f', [-2.5])).toBe('-2');
	});

	it('leaves non-ties alone', () => {
		expect(sprintf('en', '%.1f', [72.46])).toBe('72.5');
		expect(sprintf('en', '%.2f', [1.005])).toBe('1.00');
	});
});

describe('number helpers', () => {
	it('localises decimals and thousands', () => {
		expect(formatDecimal('es', 1.25, 1)).toBe('1,2');
		expect(formatThousands('en', 1234567)).toBe('1,234,567');
		expect(formatThousands('pt-BR', -12000)).toBe('-12.000');
	});
});
