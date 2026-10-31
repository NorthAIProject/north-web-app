<!--
	north-client web/recaps/recaps.templ Panels: everything below the header,
	the toggle included. Go swapped it whole from /app/recap/panels; here the
	toggle (RangeTabs) re-runs the page load client-side, so the selection,
	totals and chart never disagree.
-->
<script lang="ts">
	import { enhance } from '$app/forms';
	import LockIcon from '@lucide/svelte/icons/lock';
	import ShareIcon from '@lucide/svelte/icons/share';
	import UsersIcon from '@lucide/svelte/icons/users';
	import { formatTime } from '#lib/components/khepri/dates.js';
	import KpiCell from '#lib/components/khepri/KpiCell.svelte';
	import KpiStrip from '#lib/components/khepri/KpiStrip.svelte';
	import RangeTabs from '#lib/components/khepri/RangeTabs.svelte';
	import { Alert, AlertDescription, AlertTitle } from '#lib/components/ui/alert/index.js';
	import { Button } from '#lib/components/ui/button/index.js';
	import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '#lib/components/ui/card/index.js';
	import { SpecChart } from '#lib/components/ui/chart/index.js';
	import { useI18n } from '#lib/i18n/index.js';
	import DeltaChip from '#lib/features/insights/DeltaChip.svelte';
	import { formatCountChange } from '#lib/features/insights/format.js';
	import type { Notice, RecapPageView } from './view.js';

	let { view, notice, timeZone }: { view: RecapPageView; notice: Notice; timeZone?: string } = $props();

	const i18n = useI18n();
	let copied = $state(false);
	let posting = $state(false);

	// navigator.share is missing on most desktop browsers, so the same button
	// copies the text and link there instead (Go x-on:click).
	function share() {
		const t = view.shareText;
		const u = view.shareUrl;
		if (navigator.share) {
			navigator.share({ text: t, url: u }).catch(() => {});
		} else {
			void navigator.clipboard.writeText(u ? `${t} ${u}` : t).then(() => {
				copied = true;
				setTimeout(() => (copied = false), 2000);
			});
		}
	}

	const submitting = () => {
		posting = true;
		return async ({ update }: { update: () => Promise<void> }) => {
			await update();
			posting = false;
		};
	};
</script>

<div class="space-y-5" data-testid="recap-panels">
	<div class="flex flex-wrap items-center justify-between gap-3">
		<p class="text-muted-foreground flex items-center gap-1.5 text-sm">
			<LockIcon class="size-3.5" />
			{view.period} · {i18n.t('recap.private')}
		</p>
		<RangeTabs
			label={i18n.t('dash.range')}
			value={view.key}
			options={view.options}
			hrefFor={(key) => `/app/recap?range=${key}`}
		/>
	</div>

	{#if notice === 'posted'}
		<Alert>
			<AlertTitle>{i18n.t('recap.posted')}</AlertTitle>
			<AlertDescription>
				<a href="/app/friends" class="text-signal hover:underline">{i18n.t('recap.posted.feed')}</a>
			</AlertDescription>
		</Alert>
	{:else if notice === 'hidden'}
		<Alert>
			<AlertTitle>{i18n.t('recap.hidden')}</AlertTitle>
			<AlertDescription>
				<p>{i18n.t('recap.hidden.desc')}</p>
				<form method="post" action="?/share" class="mt-2" use:enhance={submitting}>
					<input type="hidden" name="range" value={view.key} />
					<input type="hidden" name="share_training" value="1" />
					<Button type="submit" size="sm" disabled={posting}>{i18n.t('recap.hidden.fix')}</Button>
				</form>
			</AlertDescription>
		</Alert>
	{/if}

	<section aria-label={i18n.t('recap.totals')}>
		<KpiStrip>
			{#each view.tiles as t (t.label)}
				<KpiCell label={t.label} value={String(t.value)}>
					<DeltaChip change={formatCountChange(t.delta, t.hasPrior)} />
				</KpiCell>
			{/each}
		</KpiStrip>
	</section>

	<Card class="border-hairline bg-surface">
		<CardHeader>
			<CardTitle>{i18n.t('recap.daily')}</CardTitle>
			<CardDescription>{i18n.t('recap.daily.desc')}</CardDescription>
		</CardHeader>
		<CardContent>
			{#if view.hasActivity}
				<SpecChart {...view.chart} />
			{:else}
				<p class="text-muted-foreground text-sm">{i18n.t('recap.empty')}</p>
			{/if}
		</CardContent>
	</Card>

	{#if view.highlights.length > 0}
		<Card class="border-hairline bg-surface">
			<CardHeader>
				<CardTitle>{i18n.t('recap.highlights')}</CardTitle>
			</CardHeader>
			<CardContent>
				<ul class="divide-hairline divide-y">
					{#each view.highlights as h, i (i)}
						<li class="py-2.5">
							<p class="text-sm">{h.title}</p>
							<p class="text-muted-foreground text-xs">
								{formatTime(i18n.locale, h.occurredAt, 'Mon 2 Jan', timeZone)}
								{#if h.detail}
									· {h.detail}
								{/if}
							</p>
						</li>
					{/each}
				</ul>
			</CardContent>
		</Card>
	{/if}

	<div class="flex flex-wrap gap-2">
		<form method="post" action="?/share" use:enhance={submitting}>
			<input type="hidden" name="range" value={view.key} />
			<Button type="submit" disabled={posting}>
				<UsersIcon class="size-4" />
				{i18n.t('recap.post')}
			</Button>
		</form>
		<Button type="button" variant="outline" onclick={share} data-share-text={view.shareText} data-share-url={view.shareUrl}>
			<ShareIcon class="size-4" />
			{#if copied}
				<span>{i18n.t('recap.copied')}</span>
			{:else}
				<span>{i18n.t('recap.share')}</span>
			{/if}
		</Button>
	</div>
</div>
