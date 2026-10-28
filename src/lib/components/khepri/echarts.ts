// ECharts mounting, as north-client web/assets/js/shared/echarts-init.js does
// it: options name colours as "var(--token)", resolved to rgba() at init
// (ECharts renders to a canvas, where var() and oklch() mean nothing), the
// chart resizes with the window, and is rebuilt whenever <html>'s class or
// data-theme changes, so it never stays painted for the theme it was born in.
//
// Browser-only. echarts is imported lazily, so it never loads during SSR or on
// a page with no chart.

import { resolveColors } from './css-color.js';

/** An ECharts option object, as viz.*JSON builds it on the Go side. */
export type EChartsOption = Record<string, unknown>;

export type MountedChart = {
	/** Replaces the option (colours resolved again). */
	update(option: EChartsOption): void;
	destroy(): void;
};

/**
 * Mounts a chart on el. Resolves once echarts has loaded; the returned
 * handle's destroy() is safe to call at any point after.
 */
export async function mountChart(el: HTMLElement, option: EChartsOption): Promise<MountedChart> {
	const echarts = await import('echarts');
	let current = option;
	let chart: ReturnType<typeof echarts.init> | null = null;
	let destroyed = false;

	function init() {
		if (destroyed) return;
		chart?.dispose();
		chart = echarts.init(el, null, { renderer: 'canvas' });
		chart.setOption(resolveColors(current));
		el.dataset.echartsReady = 'true';
	}

	const onResize = () => chart?.resize();
	window.addEventListener('resize', onResize, { passive: true });

	const observer = new MutationObserver(init);
	observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class', 'data-theme'] });

	init();

	return {
		update(next) {
			current = next;
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
