<script lang="ts">
	import { enhance } from '$app/forms';
	import { pageTitle } from '#lib/brand.js';
	import { formatTime } from '#lib/components/khepri/dates.js';
	import MonoLabel from '#lib/components/khepri/MonoLabel.svelte';
	import { Button } from '#lib/components/ui/button/index.js';
	import DecisionFormCard from '#lib/features/decisions/DecisionFormCard.svelte';
	import { formFor, type DecisionForm } from '#lib/features/decisions/form.js';
	import { useI18n } from '#lib/i18n/index.js';
	import type { PageProps } from './$types';

	// Go: web/decisions/decisions.templ (ShowPage).
	let { data, form }: PageProps = $props();
	const i18n = useI18n();

	const d = $derived(data.decision);
	// A rejected save shows what was posted; the header keeps the stored title.
	const values = $derived<DecisionForm>(form ?? formFor(d));
</script>

<svelte:head><title>{pageTitle(i18n.t('decisions.title'))}</title></svelte:head>

<div class="mx-auto w-full max-w-6xl space-y-6 p-6 md:p-8">
	<header>
		<MonoLabel text={i18n.t('decisions.label')} />
		<h1 class="mt-2 text-2xl font-medium tracking-tight">{d.title}</h1>
		<p class="text-muted-foreground mt-1 text-sm">
			{formatTime(i18n.locale, d.decidedAt, '2 January 2006', data.user.timezone)}
		</p>
	</header>
	<DecisionFormCard
		action="?/update"
		heading={i18n.t('decisions.edit')}
		submit={i18n.t('decisions.form.save_changes')}
		form={values}
		withOutcome={true}
	/>
	<form method="post" action="?/delete" use:enhance>
		<Button type="submit" variant="destructive">{i18n.t('decisions.delete')}</Button>
	</form>
	<p>
		<Button href="/app/decisions" variant="ghost">{i18n.t('decisions.back')}</Button>
	</p>
</div>
