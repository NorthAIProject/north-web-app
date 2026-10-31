// The templUI chart's props (north-client web/shared/ui/chart/chart.templ
// chart.Props), drawn by spec-chart.svelte with LayerChart. Go's viz builders
// (internal/shared/viz/chartjs.go, ported in #lib/features/viz/chartjs.ts)
// produce this shape, so a page hands a builder's result straight over.

export type ChartSpecVariant = 'bar' | 'line';

/**
 * One series. Colours are CSS colours and may name tokens ("var(--north-signal)",
 * also inside color-mix()): LayerChart draws SVG, so they follow the theme.
 */
export type ChartSpecDataset = {
	label: string;
	/** null leaves a gap (Go viz.nullableSeries). */
	data: (number | null)[];
	borderWidth?: number;
	borderColor?: string;
	backgroundColor?: string;
	/** > 0 draws a smoothed line. */
	tension?: number;
	/** Fills under a line (Go viz.AreaLine). */
	fill?: boolean;
	/** Dot radius on a line; 0 (the Go default) shows dots only on hover. */
	pointRadius?: number;
};

/**
 * Every show* flag defaults to false, exactly like the Go struct's zero value
 * (Go always serialised them, and chart.js read `!== false`), so an axis
 * appears only when asked for. beginAtZero defaults to true.
 */
export type ChartSpec = {
	id?: string;
	variant: ChartSpecVariant;
	data: { labels: string[]; datasets: ChartSpecDataset[] };
	showLegend?: boolean;
	showXAxis?: boolean;
	showYAxis?: boolean;
	showXLabels?: boolean;
	showYLabels?: boolean;
	showXGrid?: boolean;
	showYGrid?: boolean;
	horizontal?: boolean;
	stacked?: boolean;
	yMin?: number;
	yMax?: number;
	beginAtZero?: boolean;
	/** The chart's title for screen readers; the series summary follows it. */
	label?: string;
	class?: string;
};
