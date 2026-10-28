<!--
	north-client web/recaps/recaps.templ Panels: everything below the header,
	the toggle included. Go swapped it whole from /app/recap/panels; here the
	toggle links re-run the page load client-side, so the selection, tiles and
	chart never disagree.
-->
<script lang="ts">
	import { enhance } from '$app/forms';
	import LockIcon from '@lucide/svelte/icons/lock';
	import ShareIcon from '@lucide/svelte/icons/share';
	import TrendingDownIcon from '@lucide/svelte/icons/trending-down';
	import TrendingUpIcon from '@lucide/svelte/icons/trending-up';
	import UsersIcon from '@lucide/svelte/icons/users';
	import { formatTime } from '#lib/components/khepri/dates.js';
	import { Alert, AlertDescription, AlertTitle } from '#lib/components/ui/alert/index.js';
	import { Button } from '#lib/components/ui/button/index.js';
	import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '#lib/components/ui/card/index.js';
	import { SpecChart } from '#lib/components/ui/chart/index.js';
	import { useI18n } from '#lib/i18n/index.js';
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
		<nav aria-label={i18n.t('dash.range')} class="border-hairline bg-surface/60 flex shrink-0 gap-1 rounded-lg border p-1">
			{#each view.options as opt (opt.key)}
				{#if opt.selected}
					<a
						href="/app/recap?range={opt.key}"
						data-sveltekit-reset="false"
						aria-current="true"
						class="bg-signal text-background rounded-md px-3 py-1.5 text-xs font-medium whitespace-nowrap"
					>
						{opt.label}
					</a>
				{:else}
					<a
						href="/app/recap?range={opt.key}"
						data-sveltekit-reset="false"
						class="text-muted-foreground hover:bg-accent/60 hover:text-foreground rounded-md px-3 py-1.5 text-xs font-medium whitespace-nowrap transition-colors"
					>
						{opt.label}
					</a>
				{/if}
			{/each}
		</nav>
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

	<section
		class="border-hairline bg-surface/60 grid grid-cols-2 gap-4 rounded-lg border p-4 sm:grid-cols-3"
		aria-label={i18n.t('recap.totals')}
	>
		{#each view.tiles as t (t.label)}
			<div class="space-y-1">
				<p class="text-muted-foreground font-mono text-[10px] uppercase tracking-[0.14em]">{t.label}</p>
				<div class="flex items-baseline gap-2">
					<p class="text-2xl font-medium tabular-nums">{t.value}</p>
					{#if t.hasPrior && t.delta !== 0}
						<span
							class={[
								'inline-flex items-center gap-0.5 font-mono text-[10px] tabular-nums',
								t.delta > 0 && 'text-signal',
								t.delta < 0 && 'text-muted-foreground'
							]}
							title={i18n.t('recap.delta')}
						>
							{#if t.delta > 0}
								<TrendingUpIcon class="size-3" />
								+{t.delta}
							{:else}
								<TrendingDownIcon class="size-3" />
								{t.delta}
							{/if}
						</span>
					{/if}
				</div>
			</div>
		{/each}
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
