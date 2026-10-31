<!--
	north-client web/insights/shell.templ deltaChip: the change against the
	previous window, beside the number it qualifies. Nothing without a previous
	window. The sign carries the direction as well as the colour.

	Every delta shown today is a "more is better" count (water, sleep, energy
	burned, volume, sessions, check-ins), so up reads as success and down as
	destructive. A metric where less is better should not use this as is.
-->
<script lang="ts">
	import { useI18n } from '#lib/i18n/index.js';
	import type { DeltaText } from './format.js';

	let { change }: { change: DeltaText | null } = $props();
	const i18n = useI18n();
</script>

{#if change}
	<span
		class={[
			'text-xs font-medium whitespace-nowrap tabular-nums',
			change.direction > 0 ? 'text-success' : 'text-destructive'
		]}
		title={i18n.t('recap.delta')}
	>
		{change.text}<span class="sr-only"> {i18n.t('recap.delta')}</span>
	</span>
{/if}
