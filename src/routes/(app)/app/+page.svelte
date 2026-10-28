<!--
	My Day (north-client web/day day.templ Page): a timeline of the date down
	the left, a strip of vitals, a grid of cards, and the body.
-->
<script lang="ts">
	import { pageTitle } from '#lib/brand.js';
	import { useI18n } from '#lib/i18n/index.js';
	import BodyPanel from '#lib/features/day/BodyPanel.svelte';
	import CardGrid from '#lib/features/day/CardGrid.svelte';
	import DayHeader from '#lib/features/day/DayHeader.svelte';
	import Rail from '#lib/features/day/Rail.svelte';
	import TabBar from '#lib/features/day/TabBar.svelte';
	import VitalsStrip from '#lib/features/day/VitalsStrip.svelte';
	import { buildDayView } from '#lib/features/day/view.js';
	import OutreachCard from '#lib/features/outreach/OutreachCard.svelte';
	import RecapStrip from '#lib/features/recaps/RecapStrip.svelte';
	import FirstWeekCard from '#lib/features/firstweek/FirstWeekCard.svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
	const i18n = useI18n();
	const timeZone = $derived(data.user.timezone || 'UTC');
	const view = $derived(
		buildDayView(i18n, data.day, data.rules, { map: data.map, morph: data.morph, progress: data.progress }, timeZone)
	);
</script>

<svelte:head><title>{pageTitle(i18n.t('nav.my-day'))}</title></svelte:head>

<div class="mx-auto w-full max-w-7xl space-y-5 p-4 pb-28 md:p-6 md:pb-28">
	<DayHeader data={view} />
	{#if view.isToday}
		<!-- The "your week" recap line, loaded after the page. -->
		<RecapStrip />
		<!-- The first week's day card, while a new person's week runs. -->
		<FirstWeekCard week={data.firstWeek} />
		<!-- The coach's message on a day it chose to speak first. -->
		<OutreachCard />
	{/if}
	<div class="grid gap-5 lg:grid-cols-[18rem_minmax(0,1fr)] xl:grid-cols-[18rem_minmax(0,1fr)_17rem]">
		<div class="order-2 lg:order-1 lg:row-span-2">
			<Rail rail={view.rail} />
		</div>
		<div class="order-1 min-w-0 space-y-5 lg:order-2">
			<VitalsStrip vitals={view.vitals} />
			<CardGrid data={view} {timeZone} />
		</div>
		<div class="order-3 lg:col-start-2 xl:col-start-3 xl:row-start-1">
			<BodyPanel data={view} />
		</div>
	</div>
</div>
<TabBar data={view} />
