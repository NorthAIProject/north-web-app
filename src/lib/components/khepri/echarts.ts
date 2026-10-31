// ECharts mounting, as north-client web/assets/js/shared/echarts-init.js does
// it: options name colours as "var(--token)", resolved to rgba() at init
// (ECharts renders to a canvas, where var() and oklch() mean nothing), the
// chart resizes with the window, and is rebuilt whenever <html>'s class or
// data-theme changes, so it never stays painted for the theme it was born in.
//
// Browser-only. ECharts (the trimmed build in echarts-core.ts) is imported
// lazily, so it never loads during SSR or on a page with no chart.

import { resolveColors } from './css-color.js';

/** An ECharts option object, as viz.*JSON builds it on the Go side. */
export type EChartsOption = Record<string, unknown>;

export type MountedChart = {
	/** Replaces the option (colours resolved again). */
	update(option: EChartsOption, description?: string): void;
	destroy(): void;
};

type Obj = Record<string, unknown>;

const isObj = (v: unknown): v is Obj => !!v && typeof v === 'object' && !Array.isArray(v);

/** Fills what `base` leaves unset from `defaults`, recursing into objects. */
function withDefaults(base: Obj, defaults: Obj): Obj {
	const out: Obj = { ...base };
	for (const [key, value] of Object.entries(defaults)) {
		if (out[key] === undefined) out[key] = value;
		else if (isObj(out[key]) && isObj(value)) out[key] = withDefaults(out[key] as Obj, value);
	}
	return out;
}

// ECharts' tooltip is a white box with grey text unless told otherwise, which
// stays white in dark mode. These name the popover tokens, so they resolve
// with the rest of the option and follow the theme on every rebuild.
const tooltipDefaults: Obj = {
	backgroundColor: 'var(--popover)',
	borderColor: 'var(--border)',
	textStyle: { color: 'var(--popover-foreground)' }
};

/**
 * The option as handed to setOption: themed tooltip defaults under whatever
 * the builder set, aria on with the given description, and an empty
 * `toolbox: {}` (go-echarts emits one; it has no features, so draws nothing)
 * dropped rather than shipping the toolbox component for it.
 */
export function prepareOption(option: EChartsOption, description?: string): EChartsOption {
	const out: Obj = { ...option };
	if (isObj(out.toolbox) && Object.keys(out.toolbox).length === 0) delete out.toolbox;
	// Only a chart that asked for a tooltip gets one: adding the key would
	// switch tooltips on where the builder left them out.
	if (Array.isArray(out.tooltip)) out.tooltip = out.tooltip.map((t) => (isObj(t) ? withDefaults(t, tooltipDefaults) : t));
	else if (isObj(out.tooltip)) out.tooltip = withDefaults(out.tooltip, tooltipDefaults);
	if (description) {
		const aria = isObj(out.aria) ? out.aria : {};
		out.aria = { ...aria, enabled: true, label: { ...(isObj(aria.label) ? aria.label : {}), description } };
	}
	return out;
}

const MAX_POINTS = 31;

function categories(axis: unknown): string[] {
	const first = Array.isArray(axis) ? axis[0] : axis;
	return isObj(first) && Array.isArray(first.data) ? first.data.map(String) : [];
}

function pointValue(point: unknown): unknown {
	return isObj(point) ? point.value : point;
}

/**
 * The chart's data as one line of text for its aria-label: "Adherence: 80%",
 * "Strength: 3; Cardio: 2", "Mon: 4, Tue: 3". Labels come from the option
 * (already localised by its builder); numbers in the reader's locale. Empty
 * when the option carries no data.
 */
export function describeOption(option: EChartsOption, locale: string): string {
	const number = new Intl.NumberFormat(locale, { maximumFractionDigits: 1 });
	const fmt = (v: unknown) => (typeof v === 'number' ? number.format(v) : v == null ? '' : String(v));
	const x = categories(option.xAxis);
	const series = (Array.isArray(option.series) ? option.series : option.series ? [option.series] : []).filter(isObj);
	const parts: string[] = [];
	for (const s of series) {
		const data = Array.isArray(s.data) ? s.data : [];
		if (!data.length) continue;
		let items: string[];
		if (s.type === 'pie' || s.type === 'gauge') {
			const unit = isObj(s.detail) && typeof s.detail.formatter === 'string' && s.detail.formatter.includes('%') ? '%' : '';
			items = data.map((d) => `${isObj(d) && d.name != null ? `${d.name}: ` : ''}${fmt(pointValue(d))}${unit}`);
			parts.push(items.slice(0, MAX_POINTS).join('; ') + (items.length > MAX_POINTS ? '…' : ''));
			continue;
		}
		if (s.type === 'heatmap') {
			items = data.map((d) => {
				const v = pointValue(d);
				return Array.isArray(v) ? `${x[Number(v[0])] ?? v[0]}: ${fmt(v[2])}` : fmt(v);
			});
		} else {
			items = data.map((d, i) => `${x[i] !== undefined ? `${x[i]}: ` : ''}${fmt(pointValue(d))}`);
		}
		const head = typeof s.name === 'string' && s.type !== 'heatmap' ? `${s.name} — ` : '';
		parts.push(head + items.slice(0, MAX_POINTS).join(', ') + (items.length > MAX_POINTS ? '…' : ''));
	}
	return parts.join('; ');
}

/**
 * Mounts a chart on el. Resolves once echarts has loaded; the returned
 * handle's destroy() is safe to call at any point after. `description` becomes
 * the host's aria-label (ECharts' aria component).
 */
export async function mountChart(el: HTMLElement, option: EChartsOption, description?: string): Promise<MountedChart> {
	const echarts = await import('./echarts-core.js');
	let current = option;
	let label = description;
	let chart: ReturnType<typeof echarts.init> | null = null;
	let destroyed = false;

	function init() {
		if (destroyed) return;
		chart?.dispose();
		chart = echarts.init(el, null, { renderer: 'canvas' });
		chart.setOption(resolveColors(prepareOption(current, label)));
		el.dataset.echartsReady = 'true';
	}

	const onResize = () => chart?.resize();
	window.addEventListener('resize', onResize, { passive: true });

	const observer = new MutationObserver(init);
	observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class', 'data-theme'] });

	init();

	return {
		update(next, nextDescription) {
			current = next;
			if (nextDescription !== undefined) label = nextDescription;
			init();
		},
		destroy() {
			destroyed = true;
			observer.disconnect();
			window.removeEventListener('resize', onResize);
			chart?.dispose();
			chart = null;
		}
	};
}
