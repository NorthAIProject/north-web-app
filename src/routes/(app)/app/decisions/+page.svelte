<script lang="ts">
	import { pageTitle } from '#lib/brand.js';
	import MonoLabel from '#lib/components/khepri/MonoLabel.svelte';
	import DecisionCard from '#lib/features/decisions/DecisionCard.svelte';
	import DecisionFormCard from '#lib/features/decisions/DecisionFormCard.svelte';
	import type { DecisionForm } from '#lib/features/decisions/form.js';
	import { useI18n } from '#lib/i18n/index.js';
	import type { PageProps } from './$types';

	// Go: web/decisions/decisions.templ (IndexPage).
	let { data, form }: PageProps = $props();
	const i18n = useI18n();

	const blank: DecisionForm = { title: '', options: '', rationale: '', outcome: '', held: '' };
	const values = $derived<DecisionForm>(form ?? blank);
</script>

<svelte:head><title>{pageTitle(i18n.t('decisions.title'))}</title></svelte:head>

<div class="mx-auto w-full max-w-6xl space-y-6 p-6 md:p-8">
	<header>
		<MonoLabel text={i18n.t('decisions.label')} />
		<h1 class="mt-2 text-2xl font-medium tracking-tight">{i18n.t('decisions.title')}</h1>
		<p class="text-muted-foreground mt-1 text-sm leading-relaxed">{i18n.t('decisions.intro')}</p>
	</header>
	<DecisionFormCard
		action="/app/decisions"
		heading={i18n.t('decisions.form.new')}
		submit={i18n.t('decisions.form.save')}
		form={values}
		withOutcome={false}
	/>
	{#if data.decisions.length === 0}
		<p class="text-muted-foreground text-sm">{i18n.t('decisions.empty')}</p>
	{:else}
		<section class="space-y-3">
			<h2 class="text-sm font-medium">{i18n.t('decisions.recent')}</h2>
			{#each data.decisions as d (d.id)}
				<DecisionCard decision={d} timeZone={data.user.timezone} />
			{/each}
		</section>
	{/if}
</div>
