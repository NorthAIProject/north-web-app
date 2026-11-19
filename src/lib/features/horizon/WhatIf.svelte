<!--
	The what-ifs, as links: each one is the same page at another address, so
	they work without scripts, can be shared, and the back button undoes one.
	They move readiness, detraining and timing. Nothing here claims that
	training more makes anyone stronger, and the copy says so.
-->
<script lang="ts">
	import { useI18n } from '#lib/i18n/index.js';
	import { cn } from '#lib/utils.js';
	import { MAX_SKIP_WEEKS, isPlain, scenarioHref, type Scenario } from './view.js';

	let { scenario, hasPlan }: { scenario: Scenario; hasPlan: boolean } = $props();
	const i18n = useI18n();

	const chip = (on: boolean) =>
		cn(
			'rounded-full border px-3 py-1.5 text-xs font-medium transition-colors',
			on
				? 'border-foreground bg-foreground text-background'
				: 'border-hairline text-muted-foreground hover:text-foreground hover:border-foreground/40'
		);
	const skips = Array.from({ length: MAX_SKIP_WEEKS }, (_, i) => i + 1);
</script>

<section aria-labelledby="horizon-whatif" data-testid="horizon-whatif">
	<div class="flex items-baseline justify-between gap-3">
		<h2 id="horizon-whatif" class="text-sm font-medium">{i18n.t('horizon.whatif.title')}</h2>
		{#if !isPlain(scenario)}
			<a
				href={scenarioHref({ skipWeeks: 0, extraSessions: 0, deloadNow: false })}
				class="text-xs text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
				data-sveltekit-noscroll
			>
				{i18n.t('horizon.whatif.clear')}
			</a>
		{/if}
	</div>

	<div class="mt-3 space-y-3">
		<div>
			<p class="mb-1.5 text-xs text-muted-foreground">{i18n.t('horizon.whatif.skip')}</p>
			<div class="flex flex-wrap gap-1.5">
				{#each skips as weeks (weeks)}
					{@const on = scenario.skipWeeks === weeks}
					<a
						href={scenarioHref({ ...scenario, skipWeeks: on ? 0 : weeks })}
						class={chip(on)}
						aria-current={on ? 'true' : undefined}
						data-sveltekit-noscroll>{i18n.tf('horizon.whatif.weeks', weeks)}</a
					>
				{/each}
			</div>
		</div>
		{#if hasPlan}
			<div class="flex flex-wrap gap-1.5">
				<a
					href={scenarioHref({ ...scenario, deloadNow: !scenario.deloadNow })}
					class={chip(scenario.deloadNow)}
					aria-current={scenario.deloadNow ? 'true' : undefined}
					data-sveltekit-noscroll>{i18n.t('horizon.whatif.deload')}</a
				>
				<a
					href={scenarioHref({ ...scenario, extraSessions: scenario.extraSessions ? 0 : 1 })}
					class={chip(scenario.extraSessions > 0)}
					aria-current={scenario.extraSessions > 0 ? 'true' : undefined}
					data-sveltekit-noscroll>{i18n.t('horizon.whatif.extra')}</a
				>
			</div>
		{/if}
	</div>
	<p class="mt-3 text-xs leading-relaxed text-muted-foreground">
		{scenario.extraSessions > 0
			? i18n.t('horizon.whatif.extra.note')
			: i18n.t('horizon.whatif.note')}
	</p>
</section>
