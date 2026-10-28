<script lang="ts">
	import ChevronLeftIcon from '@lucide/svelte/icons/chevron-left';
	import ChevronRightIcon from '@lucide/svelte/icons/chevron-right';
	import MonoLabel from '#lib/components/khepri/MonoLabel.svelte';
	import { Button } from '#lib/components/ui/button/index.js';
	import { useI18n } from '#lib/i18n/index.js';
	import RulesDialog from './RulesDialog.svelte';
	import type { DayView } from './view.js';

	let { data }: { data: DayView } = $props();
	const i18n = useI18n();
</script>

<header class="flex flex-wrap items-end justify-between gap-3">
	<div>
		<MonoLabel text={i18n.t('nav.my-day')} />
		<h1 class="mt-2 text-2xl font-medium tracking-tight">{data.isToday ? i18n.t('day.today') : data.dateLabel}</h1>
		{#if data.isToday}
			<p class="text-muted-foreground mt-1 text-sm">{data.dateLabel}</p>
		{/if}
	</div>
	<nav class="flex items-center gap-2" aria-label={i18n.t('day.nav')}>
		<Button href={data.prevHref} variant="outline" size="icon" aria-label={i18n.t('day.prev')}><ChevronLeftIcon class="size-4" /></Button>
		{#if !data.isToday}
			<Button href={data.todayHref} variant="outline" size="sm">{i18n.t('day.today')}</Button>
		{/if}
		<Button href={data.nextHref} variant="outline" size="icon" aria-label={i18n.t('day.next')}><ChevronRightIcon class="size-4" /></Button>
		<RulesDialog {data} />
	</nav>
</header>
