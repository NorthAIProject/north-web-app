<!--
	Horizon: where training is heading. The body figure on top, the day being
	looked at directly below it, then every forecast as a range on that day.
	Scrubbing changes the figure and every bar together; nothing on the page
	is a single number once it is about the future.
-->
<script lang="ts">
	import { pageTitle } from '#lib/brand.js';
	import MonoLabel from '#lib/components/khepri/MonoLabel.svelte';
	import MuscleViewer from '#lib/components/khepri/MuscleViewer.svelte';
	import LowData from '#lib/features/horizon/LowData.svelte';
	import RangeBar from '#lib/features/horizon/RangeBar.svelte';
	import Scrubber from '#lib/features/horizon/Scrubber.svelte';
	import WhatIf from '#lib/features/horizon/WhatIf.svelte';
	import { detrained, frameMap, isPlain } from '#lib/features/horizon/view.js';
	import { useI18n } from '#lib/i18n/index.js';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
	const i18n = useI18n();

	const h = $derived(data.horizon);
	const ready = $derived(h.status === 'ready');
	let index = $state(0);
	// A what-if reloads the page's data; keep looking at the same day unless
	// the new forecast has fewer of them.
	const at = $derived(Math.min(index, Math.max(h.frames.length - 1, 0)));
	const frame = $derived(h.frames[at]);
	const offset = $derived(frame?.offsetDays ?? 0);
	const lost = $derived(detrained(frame));
	const shaped = $derived(
		frame && (frame.shape.waist || frame.shape.hips || frame.shape.chest || frame.shape.overall)
			? frame.shape
			: null
	);
</script>

<svelte:head><title>{pageTitle(i18n.t('horizon.title'))}</title></svelte:head>

<div class="mx-auto w-full max-w-5xl space-y-6 p-6 md:p-8">
	<header>
		<MonoLabel text={i18n.t('horizon.title')} />
		<h1 class="mt-2 text-2xl font-medium tracking-tight">{i18n.t('horizon.h1')}</h1>
		<p class="mt-1 max-w-prose text-sm leading-relaxed text-muted-foreground">
			{i18n.t('horizon.lede')}
		</p>
	</header>

	{#if !ready}
		<div class="grid gap-6 md:grid-cols-[minmax(0,20rem)_minmax(0,1fr)]">
			<section
				class="overflow-hidden rounded-2xl border border-hairline bg-surface p-4"
				aria-label={i18n.t('horizon.figure')}
			>
				<MuscleViewer
					id="horizon-body"
					map={frameMap(frame)}
					shape={shaped}
					ratio="portrait"
					hideLegend
				/>
			</section>
			<LowData needs={h.needs} />
		</div>
	{:else}
		<div class="grid gap-6 md:grid-cols-[minmax(0,20rem)_minmax(0,1fr)] md:items-start">
			<div class="space-y-4 md:sticky md:top-6">
				<section
					class="overflow-hidden rounded-2xl border border-hairline bg-surface p-4"
					aria-label={i18n.t('horizon.figure')}
					data-testid="horizon-stage"
				>
					<MuscleViewer
						id="horizon-body"
						map={frameMap(frame)}
						shape={shaped}
						ratio="portrait"
						hideLegend
					/>
					<p
						class="mt-2 min-h-8 text-center text-xs leading-relaxed text-muted-foreground"
						data-testid="horizon-figure-note"
					>
						{#if !h.hasPlan}
							{i18n.t('horizon.figure.noplan')}
						{:else if lost.length > 0}
							{i18n.tf(
								'horizon.figure.lost',
								lost
									.slice(0, 3)
									.map((r) => (i18n.has(`muscle.${r.id}`) ? i18n.t(`muscle.${r.id}`) : r.id))
									.join(', ')
							)}
						{:else}
							{i18n.t('horizon.figure.caption')}
						{/if}
					</p>
				</section>
				<Scrubber frames={h.frames} bind:index />
			</div>

			<div class="space-y-6">
				{#if h.summary.length > 0 && isPlain(h.scenario)}
					<section
						class="border-l-2 border-agent/40 pl-4"
						aria-label={i18n.t('horizon.summary')}
						data-testid="horizon-summary"
					>
						{#each h.summary as line (line)}
							<p class="text-sm leading-relaxed text-agent">{line}</p>
						{/each}
					</section>
				{/if}

				<section
					class="divide-y divide-hairline rounded-2xl border border-hairline bg-surface px-5 py-2"
					aria-label={i18n.t('horizon.ranges')}
				>
					{#each h.lifts as lift (lift.key)}
						<RangeBar
							label={lift.name}
							series={lift}
							offsetDays={offset}
							note={lift.status === 'ready' ? lift.plateauText : undefined}
							measure={i18n.t('insights.lifting.col.e1rm')}
						/>
					{/each}
					<RangeBar label={i18n.t('horizon.row.weight')} series={h.bodyWeight} offsetDays={offset}>
						{#if h.goalEta}
							<p
								class="mt-1.5 text-xs text-muted-foreground"
								data-testid="horizon-eta"
								data-state={h.goalEta.state}
							>
								{h.goalEta.text}
							</p>
						{/if}
					</RangeBar>
					<RangeBar label={i18n.t('horizon.row.waist')} series={h.waist} offsetDays={offset} />
				</section>

				{#if h.deload.suggested}
					<section
						class="rounded-2xl border border-hairline bg-surface p-5"
						data-testid="horizon-deload"
					>
						<h2 class="text-sm font-medium">{i18n.t('horizon.deload.title')}</h2>
						<ul class="mt-2 list-disc space-y-1 pl-4 text-sm text-muted-foreground">
							{#each h.deload.reasons as reason (reason.code)}
								<li>{reason.text}</li>
							{/each}
						</ul>
						<p class="mt-3 text-sm">
							<a href="/app/weekly" class="underline underline-offset-4"
								>{i18n.t('horizon.deload.link')}</a
							>
							<span class="text-muted-foreground">{i18n.t('horizon.deload.yours')}</span>
						</p>
					</section>
				{/if}

				<section class="rounded-2xl border border-hairline bg-surface p-5">
					<WhatIf scenario={h.scenario} hasPlan={h.hasPlan} />
				</section>

				<p class="text-xs leading-relaxed text-muted-foreground" data-testid="horizon-disclaimer">
					{h.disclaimer}
				</p>
			</div>
		</div>
	{/if}
</div>
