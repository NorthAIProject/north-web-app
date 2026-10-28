<!--
	The lighter-day offer (web/lighterday lighterday.templ Fragment). Go loaded
	it into the dashboard with hx-get and swapped it after an answer; here it
	reads GET /today/lighter itself and redraws from the PUT's answer. It
	renders nothing when there is nothing to offer or say, when the read
	fails (the dashboard must not lose its training panel over an offer), and
	on days the coach's own message already covers (covered).

	Undo is choosing to keep the plan: the same answer, so the same endpoint.
	Without JavaScript the forms post to /app/today/lighter, which saves and
	lands back on My Day.
-->
<script lang="ts" module>
	/** The offer's query key; one card per page, shared with whatever else reads it. */
	export const LIGHTER_KEY = ['today', 'lighter'];
</script>

<script lang="ts">
	import { createQuery, useQueryClient } from '@tanstack/svelte-query';
	import { toast } from 'svelte-sonner';
	import { Button } from '#lib/components/ui/button/index.js';
	import { browserApi } from '#lib/api/client.js';
	import type { components } from '#lib/api/generated/schema.js';
	import { useI18n } from '#lib/i18n/index.js';

	type LighterDay = components['schemas']['LighterDay'];

	let { initial }: { initial?: LighterDay | null } = $props();
	const i18n = useI18n();
	const client = useQueryClient();

	const query = createQuery(() => ({
		queryKey: LIGHTER_KEY,
		queryFn: async ({ signal }): Promise<LighterDay | null> => {
			try {
				return (await browserApi().GET('/today/lighter', { signal })).data ?? null;
			} catch {
				return null;
			}
		},
		...(initial !== undefined ? { initialData: initial } : {})
	}));

	const card = $derived(query.data && !query.data.covered ? query.data : null);
	let busy = $state(false);

	async function choose(e: SubmitEvent) {
		e.preventDefault();
		const submitter = e.submitter as HTMLButtonElement | null;
		const choice = submitter?.value === 'lighter' ? 'lighter' : 'keep';
		busy = true;
		try {
			const { data } = await browserApi().PUT('/today/lighter', { body: { choice } });
			if (data) client.setQueryData(LIGHTER_KEY, data);
		} catch {
			toast.error(i18n.t('day.log.invalid'));
		} finally {
			busy = false;
		}
	}
</script>

<div id="lighter-day">
	{#if card?.offered}
		<div class="border-hairline bg-surface mb-3 space-y-2 rounded-lg border p-3" data-testid="lighter-offer">
			<p class="text-sm font-medium">{i18n.t('lighterday.title')}</p>
			<p class="text-muted-foreground text-xs">
				{i18n.t('lighterday.body')}
				{card.readiness.reason ?? ''}
				{i18n.tf('lighterday.offer', card.session ?? '')}
			</p>
			<form method="post" action="/app/today/lighter" onsubmit={choose} class="flex gap-2">
				<Button type="submit" size="sm" name="choice" value="lighter" disabled={busy}>
					{i18n.t('lighterday.lighter')}
				</Button>
				<Button type="submit" size="sm" variant="outline" name="choice" value="keep" disabled={busy}>
					{i18n.t('lighterday.keep')}
				</Button>
			</form>
		</div>
	{:else if card?.choice === 'lighter'}
		<form
			method="post"
			action="/app/today/lighter"
			onsubmit={choose}
			class="mb-3 flex items-center justify-between gap-2"
		>
			<p class="text-muted-foreground text-xs" data-testid="lighter-chosen">
				{card.source === 'coach' ? i18n.t('lighterday.chosen.coach') : i18n.t('lighterday.chosen')}
			</p>
			<Button
				type="submit"
				size="sm"
				variant="outline"
				name="choice"
				value="keep"
				disabled={busy}
				data-testid="lighter-undo"
			>
				{i18n.t('lighterday.undo')}
			</Button>
		</form>
	{/if}
</div>
