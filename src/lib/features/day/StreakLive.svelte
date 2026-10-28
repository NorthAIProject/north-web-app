<!--
	The streak tile's face (web/day cards.templ StreakLive). It refreshes
	itself: at once after a check-in is saved in this tab, and every 20 s for
	saves made elsewhere. GET /day/checkin answers 204 while the version the
	tile holds is current, so each poll is one small query.
-->
<script lang="ts">
	import { createQuery, useQueryClient } from '@tanstack/svelte-query';
	import FlameIcon from '@lucide/svelte/icons/flame';
	import { browserApi } from '#lib/api/client.js';
	import { useI18n } from '#lib/i18n/index.js';
	import { CHECKIN_POLL_MS, CHECKIN_SAVED } from '#lib/components/khepri/live.js';
	import { formatTime } from '#lib/components/khepri/dates.js';
	import { streakTile, type StreakTile } from './view.js';

	let { tile, timeZone }: { tile: StreakTile; timeZone: string } = $props();
	const i18n = useI18n();
	const client = useQueryClient();

	/** The streak tile's query key. */
	const key = ['day', 'checkin'];
	const held = () => client.getQueryData<StreakTile>(key) ?? tile;

	const query = createQuery(
		() => ({
			queryKey: key,
			queryFn: async ({ signal }): Promise<StreakTile> => {
				const was = held();
				const { data, response } = await browserApi().GET('/day/checkin', {
					params: { query: { v: was.version } },
					signal
				});
				if (response.status === 204 || !data) return was;
				return streakTile(data, (t) => formatTime(i18n.locale, t, '15:04', timeZone));
			},
			refetchInterval: CHECKIN_POLL_MS,
			staleTime: CHECKIN_POLL_MS,
			initialData: tile,
			initialDataUpdatedAt: () => Date.now()
		})
	);
	const current = $derived(query.data ?? tile);

	// A newer server render (after a save on this page) replaces what the poll held.
	$effect(() => {
		client.setQueryData(key, tile);
	});

	$effect(() => {
		const refresh = () => client.invalidateQueries({ queryKey: key });
		document.addEventListener(CHECKIN_SAVED, refresh);
		return () => document.removeEventListener(CHECKIN_SAVED, refresh);
	});
</script>

<span id="day-streak-live" class="flex flex-col gap-1">
	<span class="flex items-center gap-2">
		<FlameIcon class="text-ember size-8" />
		<span class="text-ember text-4xl font-semibold tabular-nums">{current.streak}</span>
	</span>
	<span class="text-muted-foreground text-xs tabular-nums" data-streak-today>
		{#if current.today}
			{i18n.tf('day.streak.today', current.today.mood, current.today.energy, current.today.at)}
		{:else}
			{i18n.t('day.streak.notyet')}
		{/if}
	</span>
</span>
