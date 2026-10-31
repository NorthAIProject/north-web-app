// The ECharts build this app ships: echarts/core plus exactly the series and
// components the option builders use (viz/echarts.ts, memories/view.ts,
// training/plan.ts, fitness/activities.ts). The whole `echarts` package is
// ~325 KB gz; this is a fraction of it.
//
// A series type or component missing here is not an error in production: the
// key is silently ignored and the chart draws without it (dev logs
// "Component X is used but not imported"). A builder that adds one — a
// `markLine`, `dataZoom`, `calendar`, `type: 'scatter'` — must register it here.

import { use, init } from 'echarts/core';
import { BarChart, GaugeChart, HeatmapChart, LineChart, PieChart } from 'echarts/charts';
import {
	AriaComponent,
	GridComponent,
	LegendComponent,
	TitleComponent,
	TooltipComponent,
	VisualMapContinuousComponent
} from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';

use([
	BarChart,
	GaugeChart,
	HeatmapChart,
	LineChart,
	PieChart,
	// Cartesian axes for bar/line/heatmap.
	GridComponent,
	// Plain and `type: 'scroll'` legends; tooltip brings its axisPointer.
	LegendComponent,
	TooltipComponent,
	// The mood heatmap's colour ramp (calculable: false → continuous).
	VisualMapContinuousComponent,
	// `title: { show: false }` in the heatmap; also read by aria.
	TitleComponent,
	// aria-label on the host (mountChart sets a localised description).
	AriaComponent,
	CanvasRenderer
]);

export { init };
