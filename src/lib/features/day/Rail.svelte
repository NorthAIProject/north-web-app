<!--
	The day as a vertical timeline, latest at the top (web/day rail.templ).
	Positions come from buildRail; this only places them, and scrolls the now
	line into view once mounted.
-->
<script lang="ts">
	import { useI18n } from '#lib/i18n/index.js';
	import { cn } from '#lib/utils.js';
	import { railIcon } from './icons.js';
	import type { Rail, RailBand } from './view.js';

	let { rail }: { rail: Rail } = $props();
	const i18n = useI18n();
	let section: HTMLElement | undefined = $state();

	const bandColor = (kind: string) => (kind === 'sleep' ? 'var(--color-day-sleep)' : 'var(--color-day-fat)');
	const bandStyle = (b: RailBand) => `top:${b.topPx + 12}px;height:${b.heightPx}px;--band:${bandColor(b.kind)}`;

	$effect(() => {
		const el = section;
		if (!el) return;
		const n = el.querySelector<HTMLElement>('[data-now]');
		if (n) el.scrollTop = n.offsetTop - el.clientHeight / 2;
	});
</script>

<section
	bind:this={section}
	class="border-hairline bg-surface relative max-h-[40rem] overflow-y-auto rounded-2xl border lg:max-h-[calc(100vh-10rem)]"
	aria-label={i18n.t('day.timeline')}
	data-testid="day-rail"
>
	<div class="relative mr-3 ml-14" style:height="{rail.heightPx + 24}px">
		{#each rail.hours as h (h.topPx)}
			<div class="absolute -left-14 flex w-[calc(100%+3.5rem)] items-center" style:top="{h.topPx + 12}px" aria-hidden="true">
				<span class="text-muted-foreground w-11 -translate-y-1/2 text-right text-[11px] tabular-nums">{h.label}</span>
				<span class="border-hairline ml-3 flex-1 -translate-y-1/2 border-t"></span>
			</div>
		{/each}
		{#each rail.bands as b, i (i)}
			<div
				class="absolute inset-x-0 rounded-xl bg-[color-mix(in_oklch,var(--band)_9%,transparent)]"
				style={bandStyle(b)}
				data-testid="band-{b.kind}"
			>
				<span class={cn('absolute inset-y-1 -left-2 border-l-2 border-dashed border-[var(--band)]', b.open && 'opacity-60')}></span>
				<span class="absolute -top-1 -left-[13px] size-2.5 rounded-full bg-[var(--band)] ring-2 ring-[var(--color-surface)]"></span>
				<span class="absolute -bottom-1 -left-[13px] size-2.5 rounded-full bg-[var(--band)] ring-2 ring-[var(--color-surface)]"></span>
				{#if b.heightPx >= 30}
					<span class="absolute top-1.5 right-2 text-[10px] font-medium text-[var(--band)]">{b.label}</span>
				{/if}
			</div>
		{/each}
		{#each rail.markers as m, i (i)}
			<div
				class={cn('absolute inset-x-0 flex -translate-y-1/2 items-center justify-end gap-2 text-[11px]', m.passed && 'opacity-50')}
				style:top="{m.topPx + 12}px"
				data-testid="marker-{m.kind}"
			>
				<span class="border-hairline flex-1 border-t border-dashed"></span>
				<span class="text-muted-foreground bg-surface rounded-full px-1.5">{i18n.t(`day.rule.${m.kind}`)} {m.time}</span>
			</div>
		{/each}
		{#each rail.items as it, i (i)}
			{@const Icon = railIcon(it.icon)}
			<a
				href={it.href}
				class={cn(
					'absolute right-0 left-2 flex -translate-y-1/2 items-center gap-2.5 rounded-xl border border-[color-mix(in_oklch,var(--card)_22%,transparent)] bg-[color-mix(in_oklch,var(--card)_11%,var(--color-surface))] px-3 py-1.5 transition-colors hover:bg-[color-mix(in_oklch,var(--card)_18%,var(--color-surface))]',
					it.faded && 'opacity-55'
				)}
				style="top:{it.topPx + 12}px;--card:{it.color}"
				data-testid="rail-card"
			>
				<span class="shrink-0 text-[var(--card)]"><Icon class="size-4" /></span>
				<span class="min-w-0 flex-1 leading-tight">
					<span class="block truncate text-sm font-medium">{it.title}</span>
					<span class="text-muted-foreground block truncate text-[11px] tabular-nums">
						{it.time}{#if it.detail}{' '}· {it.detail}{/if}
					</span>
				</span>
			</a>
		{/each}
		{#if rail.showNow}
			<div class="pointer-events-none absolute right-0 -left-14 flex -translate-y-1/2 items-center" style:top="{rail.nowTopPx + 12}px" data-now>
				<span class="text-day-now w-11 text-right text-[11px] font-semibold tabular-nums">{rail.nowLabel}</span>
				<span class="bg-day-now ml-2 size-2 rounded-full"></span>
				<span class="bg-day-now h-px flex-1"></span>
			</div>
		{/if}
	</div>
	{#if rail.items.length === 0}
		<p class="text-muted-foreground bg-surface/90 sticky bottom-0 px-4 py-3 text-center text-sm">{i18n.t('day.timeline.empty')}</p>
	{/if}
</section>
