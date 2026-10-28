<script lang="ts">
	import { cn } from '#lib/utils.js';
	import type { SleepBar } from './view.js';

	let { bars, class: className = '' }: { bars: SleepBar[]; class?: string } = $props();
</script>

<svg viewBox="0 0 100 40" preserveAspectRatio="none" class={cn('mt-2 w-full', className)} aria-hidden="true">
	{#each bars as b, i (i)}
		<rect x={b.x} y={b.y} width={b.w} height="8" rx="1.5" fill={b.color}></rect>
	{/each}
</svg>
