<script lang="ts">
	import { browser } from '$app/env';
	import { createQuery, useQueryClient } from '@tanstack/svelte-query';
	import { browserApi } from '#lib/api/client.js';
	import { pageTitle } from '#lib/brand.js';
	import { announceCheckInSaved, CHECKIN_POLL_MS, onCheckInSaved } from '#lib/components/khepri/live.js';
	import CheckInWizard from '#lib/features/checkins/CheckInWizard.svelte';
	import LiveRegion from '#lib/features/checkins/LiveRegion.svelte';
	import SavedPanel from '#lib/features/checkins/SavedPanel.svelte';
	import {
		formFor,
		instrumentsFor,
		localToday,
		runFrom,
		type CheckInForm,
		type CheckInList
	} from '#lib/features/checkins/checkins.js';
	import { useI18n } from '#lib/i18n/index.js';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();
	const i18n = useI18n();
	const timeZone = $derived(data.user.timezone || 'UTC');

	// The history, KPIs and charts refresh themselves (Go Live, hx-trigger
	// "checkin-saved from:body, every 20s"): a query seeded by the load, polled
	// every 20 s and refetched at once when a save is announced.
	const queryClient = useQueryClient();
	const live = createQuery(
		() => ({
			queryKey: ['checkins', data.user.id],
			queryFn: async (): Promise<CheckInList> => (await browserApi().GET('/check-ins')).data!,
			initialData: data.list,
			refetchInterval: CHECKIN_POLL_MS,
			enabled: browser
		})
	);
	// A fresh load (after a save) is the newest list there is.
	$effect(() => {
		queryClient.setQueryData(['checkins', data.user.id], data.list);
	});
	$effect(() => onCheckInSaved(() => void live.refetch(), 24 * 60 * 60 * 1000));

	const list = $derived(live.data ?? data.list);
	const instruments = $derived(instrumentsFor(list.recent, timeZone));

	// The panel shows the receipt after a save until the person asks to edit.
	let editing = $state(false);
	let wizardKey = $state(0);
	const saved = $derived(!editing && form && 'saved' in form ? form.saved : undefined);
	const wizardForm = $derived<CheckInForm>(
		form && 'values' in form && form.values ? form.values : formFor(data.list.today)
	);
	const errors = $derived<Record<string, string>>(form && 'errors' in form ? (form.errors ?? {}) : {});

	async function loadReply() {
		const { data: reply } = await browserApi().POST('/check-ins/today/reply');
		return reply ?? null;
	}
</script>

<svelte:head><title>{pageTitle(i18n.t('nav.check-ins'))}</title></svelte:head>

<div class="mx-auto flex w-full max-w-6xl flex-col gap-8 p-4 md:p-8">
	<header>
		<p class="text-muted-foreground font-mono text-[10px] uppercase tracking-[0.14em]">{i18n.t('checkins.mono')}</p>
		<h1 class="mt-2 text-2xl font-medium tracking-tight">{i18n.t('checkins.heading')}</h1>
		<p class="text-muted-foreground mt-1 text-sm leading-relaxed">{i18n.t('checkins.intro')}</p>
	</header>
	<div id="checkin-panel" class="space-y-8">
		{#if saved}
			<SavedPanel
				checkIn={saved}
				run={runFrom(data.list)}
				moment={saved.moment}
				reply={saved.localDate === localToday(timeZone) ? loadReply : undefined}
				onedit={() => {
					editing = true;
					wizardKey++;
				}}
			/>
		{:else}
			{#key wizardKey}
				<CheckInWizard
					form={wizardForm}
					{errors}
					activeGoals={data.activeGoals}
					first={data.list.recent.length === 0}
					action="?/save"
					onresult={(result) => {
						if (result.type === 'success') {
							editing = false;
							announceCheckInSaved();
						} else if (result.type === 'failure') {
							wizardKey++;
						}
					}}
				/>
			{/key}
		{/if}
	</div>
	<LiveRegion list={list.recent} streak={list.streak} {instruments} {timeZone} />
</div>
