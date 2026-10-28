<!--
	north-client web/insights/timeline.templ TimelineBody: the kind filter and
	the feed. Each chip is a real link (?range=&kind=); SvelteKit navigates
	client-side and the load refetches, as htmx swapped the panel in Go.
-->
<script lang="ts">
	import type { Component } from 'svelte';
	import ActivityIcon from '@lucide/svelte/icons/activity';
	import CircleCheckIcon from '@lucide/svelte/icons/circle-check';
	import CircleIcon from '@lucide/svelte/icons/circle';
	import CoffeeIcon from '@lucide/svelte/icons/coffee';
	import DropletIcon from '@lucide/svelte/icons/droplet';
	import FlagIcon from '@lucide/svelte/icons/flag';
	import MoonIcon from '@lucide/svelte/icons/moon';
	import NotebookPenIcon from '@lucide/svelte/icons/notebook-pen';
	import PillIcon from '@lucide/svelte/icons/pill';
	import SmileIcon from '@lucide/svelte/icons/smile';
	import TargetIcon from '@lucide/svelte/icons/target';
	import TimerIcon from '@lucide/svelte/icons/timer';
	import TimerOffIcon from '@lucide/svelte/icons/timer-off';
	import UtensilsIcon from '@lucide/svelte/icons/utensils';
	import { Card, CardContent } from '#lib/components/ui/card/index.js';
	import { useI18n } from '#lib/i18n/index.js';
	import PanelEmpty from '../PanelEmpty.svelte';
	import { relativeTime } from '../format.js';
	import { chipHref, formatCount, type TimelineView } from '../domains.js';

	let { view, now, timeZone }: { view: TimelineView; now: Date; timeZone?: string } = $props();

	const i18n = useI18n();

	// The icon names the dashboard feed gives its entries (Go icon.Icon).
	const icons: Record<string, Component> = {
		activity: ActivityIcon,
		'circle-check': CircleCheckIcon,
		coffee: CoffeeIcon,
		droplet: DropletIcon,
		flag: FlagIcon,
		moon: MoonIcon,
		'notebook-pen': NotebookPenIcon,
		pill: PillIcon,
		smile: SmileIcon,
		target: TargetIcon,
		timer: TimerIcon,
		'timer-off': TimerOffIcon,
		utensils: UtensilsIcon
	};
</script>

<div class="space-y-4">
	<nav aria-label={i18n.t('insights.timeline.filter')} class="-mx-1 flex flex-wrap gap-1">
		{#each view.filters as chip (chip.key)}
			<a
				href={chipHref('/app/insights/timeline', view.range.key, chip.key)}
				data-sveltekit-reset="false"
				aria-current={chip.selected ? 'true' : undefined}
				class={chip.selected
					? 'bg-signal text-background flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium whitespace-nowrap'
					: 'border-hairline text-muted-foreground hover:text-foreground flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-medium whitespace-nowrap transition-colors'}
			>
				{chip.label}
				<span class="font-mono text-[10px] tabular-nums opacity-70">{formatCount(chip.count)}</span>
			</a>
		{/each}
	</nav>
	<Card class="border-hairline bg-surface">
		<CardContent>
			{#if view.entries.length === 0}
				<PanelEmpty
					message={i18n.t('insights.timeline.empty')}
					cta={i18n.t('insights.timeline.cta')}
					href="/app/check-ins"
				/>
			{:else}
				<ul class="divide-border -my-3 divide-y" data-testid="insights-timeline-entries">
					{#each view.entries as e, i (i)}
						{@const Icon = icons[e.icon ?? ''] ?? CircleIcon}
						<li class="py-3">
							<a href={e.href || undefined} class="group flex items-start gap-3">
								<span
									class="border-hairline text-muted-foreground group-hover:text-signal mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-md border transition-colors"
								>
									<Icon class="size-3.5" />
								</span>
								<span class="min-w-0 flex-1">
									<span class="block text-sm font-medium">{e.title}</span>
									{#if e.detail}
										<span class="text-muted-foreground block truncate text-xs">{e.detail}</span>
									{/if}
								</span>
								<span class="shrink-0 text-right">
									<span class="text-muted-foreground block font-mono text-[10px] whitespace-nowrap tabular-nums">
										{relativeTime(i18n, new Date(e.at), now, timeZone)}
									</span>
									<span class="text-muted-foreground block font-mono text-[10px] whitespace-nowrap opacity-60">
										{e.label}
									</span>
								</span>
							</a>
						</li>
					{/each}
				</ul>
				{#if view.overflow}
					<p class="text-muted-foreground border-border mt-4 border-t pt-4 text-xs">
						{i18n.t('insights.timeline.overflow')}
					</p>
				{/if}
			{/if}
		</CardContent>
	</Card>
</div>
