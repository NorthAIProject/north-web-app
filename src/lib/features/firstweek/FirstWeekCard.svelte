<!--
	The first week's day card on My Day (web/firstweek card.templ Fragment).
	Done marks today's action and redraws the card from the answer; a
	conflict (the week ended, or the day is over) redraws what is true now.
-->
<script lang="ts">
	import CheckIcon from '@lucide/svelte/icons/check';
	import Moment from '#lib/components/khepri/Moment.svelte';
	import { Button } from '#lib/components/ui/button/index.js';
	import { Card, CardContent } from '#lib/components/ui/card/index.js';
	import { browserApi } from '#lib/api/client.js';
	import { isApiError } from '#lib/api/errors.js';
	import { useI18n } from '#lib/i18n/index.js';
	import { toast } from 'svelte-sonner';
	import Dots from './Dots.svelte';
	import { REVIEW_PATH, cardOf, type FirstWeek } from './firstweek.js';

	let { week }: { week: FirstWeek | null } = $props();
	const i18n = useI18n();

	let latest = $state<FirstWeek | null | undefined>(undefined);
	const c = $derived(cardOf(i18n, latest === undefined ? week : latest));
	let busy = $state(false);

	async function markDone(e: SubmitEvent) {
		e.preventDefault();
		busy = true;
		const api = browserApi();
		try {
			latest = (await api.POST('/first-week/done')).data ?? null;
		} catch (err) {
			if (isApiError(err) && (err.status === 409 || err.status === 404)) {
				latest = (await api.GET('/first-week').catch(() => ({ data: null }))).data ?? null;
			} else {
				toast.error(i18n.t('outreach.error'));
			}
		} finally {
			busy = false;
		}
	}
</script>

<div id="first-week-card" class="space-y-3">
	{#if c.show}
		{#if c.moment}<Moment moment={c.moment} />{/if}
		<Card class="border-signal/40" data-testid="first-week-card">
			<CardContent class="space-y-3 pt-5">
				<div class="flex items-center justify-between gap-3">
					<p class="text-signal text-xs font-medium tracking-wide uppercase">
						{#if c.over}
							{i18n.t('firstweek.card.over')}
						{:else if c.day === 0}
							{i18n.t('firstweek.card.start')}
						{:else}
							{i18n.tf('firstweek.card.title', c.day)}
						{/if}
					</p>
					{#if c.day > 0}<Dots days={c.days} today={c.day} />{/if}
				</div>
				{#if !c.over}
					<p class="text-sm leading-relaxed" data-testid="first-week-action">{c.action}</p>
				{/if}
				{#if c.day === 7}
					<p class="text-muted-foreground text-xs">{i18n.t('firstweek.card.last')}</p>
				{/if}
				{#if c.reviewReady}
					<Button href={REVIEW_PATH} variant="outline" size="sm" data-testid="first-week-open-review">{i18n.t('firstweek.card.review')}</Button>
				{/if}
				{#if c.day > 0 && !c.over}
					{#if c.done}
						<p class="text-muted-foreground flex items-center gap-1.5 text-xs" data-testid="first-week-done">
							<CheckIcon class="size-3.5" />
							{i18n.t('firstweek.card.done')}
						</p>
					{:else}
						<form method="post" action="/app/first-week?/done" onsubmit={markDone}>
							<Button type="submit" size="sm" disabled={busy} data-testid="first-week-mark-done">{i18n.t('firstweek.card.button')}</Button>
						</form>
					{/if}
				{/if}
			</CardContent>
		</Card>
	{/if}
</div>
