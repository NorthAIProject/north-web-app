import { describe, expect, it } from 'vitest';
import { donutOption, gaugeOption, heatmapOption, trainingTrendOption } from '#lib/features/viz/echarts.js';
import { describeOption, prepareOption } from './echarts.js';

describe('prepareOption', () => {
	it('themes a tooltip the builder asked for, keeping what it set', () => {
		const out = prepareOption({ tooltip: { trigger: 'axis', textStyle: { fontSize: 10 } } });
		expect(out.tooltip).toEqual({
			trigger: 'axis',
			backgroundColor: 'var(--popover)',
			borderColor: 'var(--border)',
			textStyle: { fontSize: 10, color: 'var(--popover-foreground)' }
		});
	});

	it('leaves a builder colour alone', () => {
		const out = prepareOption({ tooltip: { backgroundColor: 'red' } });
		expect((out.tooltip as Record<string, unknown>).backgroundColor).toBe('red');
	});

	it('adds no tooltip where the builder had none', () => {
		expect(prepareOption({ series: [] }).tooltip).toBeUndefined();
	});

	it('drops the empty go-echarts toolbox and keeps a configured one', () => {
		expect(prepareOption(heatmapOption('Mood', [])).toolbox).toBeUndefined();
		expect(prepareOption({ toolbox: { feature: {} } }).toolbox).toEqual({ feature: {} });
	});

	it('turns aria on with the description', () => {
		expect(prepareOption({}, 'Chart. x').aria).toEqual({ enabled: true, label: { description: 'Chart. x' } });
		expect(prepareOption({}).aria).toBeUndefined();
	});

	it('does not mutate the option it was given', () => {
		const option = { tooltip: { trigger: 'item' }, toolbox: {} };
		prepareOption(option, 'd');
		expect(option).toEqual({ tooltip: { trigger: 'item' }, toolbox: {} });
	});
});

describe('describeOption', () => {
	it('reads a gauge as its percentage', () => {
		expect(describeOption(gaugeOption('Adherence', 80), 'en')).toBe('Adherence: 80%');
	});

	it('reads donut segments, skipping empty ones, in the locale', () => {
		const option = donutOption([
			{ label: 'Fuerza', value: 2.5 },
			{ label: 'Cardio', value: 0 },
			{ label: 'Movilidad', value: 1 }
		]);
		expect(describeOption(option, 'es')).toBe('Fuerza: 2,5; Movilidad: 1');
	});

	it('reads a heatmap by its day labels', () => {
		const option = heatmapOption('Mood', [
			{ label: 'Mon', value: 4 },
			{ label: 'Tue', value: 0 },
			{ label: 'Wed', value: 2 }
		]);
		expect(describeOption(option, 'en')).toBe('Mon: 4, Wed: 2');
	});

	it('reads bar and line series against the category axis', () => {
		const option = trainingTrendOption(['Mon', 'Tue'], [{ label: 'Run', color: 'var(--x)', values: [30, 0] }], 'Normal', [20, 25]);
		expect(describeOption(option, 'en')).toBe('Run — Mon: 30, Tue: 0; Normal — Mon: 20, Tue: 25');
	});

	it('is empty without data', () => {
		expect(describeOption(donutOption([]), 'en')).toBe('');
		expect(describeOption({}, 'en')).toBe('');
	});
});
