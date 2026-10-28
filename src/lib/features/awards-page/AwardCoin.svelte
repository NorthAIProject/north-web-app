<script lang="ts">
	// Any award as a coin: a monthly medal as the gold month coin, a badge as
	// its glyph coin; locked greys it out (Go: web/awards Coin).
	import Medal from '#lib/components/khepri/Medal.svelte';
	import MonthlyMedal from '#lib/components/khepri/MonthlyMedal.svelte';
	import { useI18n } from '#lib/i18n/index.js';
	import { coinMonth, type AwardView } from './awards.js';

	let { award, size, locked = false }: { award: AwardView; size: number; locked?: boolean } = $props();
	const i18n = useI18n();
</script>

{#if award.monthly}
	<MonthlyMedal
		month={coinMonth(i18n.locale, award.monthly.month)}
		target={award.monthly.target}
		{size}
		{locked}
		label={award.name}
	/>
{:else}
	<Medal badgeId={award.id} area={award.area} {size} {locked} label={award.name} />
{/if}
