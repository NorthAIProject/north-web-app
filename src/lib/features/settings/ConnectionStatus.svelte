<!--
	"Waiting for first use", polled until an agent authenticates with the key
	(Go: settings.ConnectionStatus + GET .../status?tries=n, hx-trigger "load
	delay:5s"). Gives up after pollLimit tries; a revoked key answers 404,
	which also stops it.
-->
<script lang="ts">
	import { createQuery } from '@tanstack/svelte-query';
	import { browserApi } from '#lib/api/client.js';
	import { formatTime } from '#lib/components/khepri/dates.js';
	import { useI18n } from '#lib/i18n/index.js';

	/** About two minutes at one try every five seconds. */
	const pollLimit = 24;

	let {
		id,
		lastUsedAt,
		timezone
	}: { id: string; lastUsedAt?: string; timezone: string } = $props();

	const i18n = useI18n();

	let tries = $state(0);

	const query = createQuery(() => ({
		queryKey: ['settings', 'connection', id],
		queryFn: async () => {
			tries++;
			const { data } = await browserApi().GET('/settings/connections/{connectionID}', {
				params: { path: { connectionID: id } }
			});
			return data!;
		},
		enabled: !lastUsedAt,
		retry: false,
		refetchInterval: (q) =>
			q.state.data?.lastUsedAt || q.state.error || tries >= pollLimit ? false : 5000
	}));

	const used = $derived(lastUsedAt ?? query.data?.lastUsedAt);
	const gaveUp = $derived(tries >= pollLimit);
</script>

{#if used}
	<span id="connection-status-{id}" class="text-signal">
		{i18n.tf('settings.conn.status.used', formatTime(i18n.locale, used, '2 Jan, 15:04', timezone))}
	</span>
{:else if gaveUp}
	<span id="connection-status-{id}">{i18n.t('settings.conn.status.unused')}</span>
{:else}
	<span id="connection-status-{id}">{i18n.t('conn.list.waiting')}</span>
{/if}
