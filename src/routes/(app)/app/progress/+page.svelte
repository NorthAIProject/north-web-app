<!-- Go: web/progress/progress.templ Page. -->
<script lang="ts">
	import MonoLabel from '#lib/components/khepri/MonoLabel.svelte';
	import * as Alert from '#lib/components/ui/alert/index.js';
	import { pageTitle } from '#lib/brand.js';
	import { useI18n } from '#lib/i18n/index.js';
	import Comparison from '#lib/features/progress/Comparison.svelte';
	import History from '#lib/features/progress/History.svelte';
	import NewCheck from '#lib/features/progress/NewCheck.svelte';
	import Reminder from '#lib/features/progress/Reminder.svelte';
	import { dateOnly, lastPhotos, localToday, pageCheck, type FormValues } from '#lib/features/progress/view.js';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();
	const i18n = useI18n();

	const today = $derived(localToday(data.user.timezone));
	const schedule = $derived(data.checks.schedule);
	const checks = $derived(data.checks.checks.map((c, i, all) => pageCheck(i18n, c, all[i + 1])));
	const last = $derived(lastPhotos(checks));
	const assist = $derived({
		available: data.assist.available,
		label: data.assist.providerLabel ?? '',
		own: data.assist.ownProvider
	});
	const nextDueOn = $derived(schedule.cadence && schedule.nextDueOn ? dateOnly(i18n.locale, schedule.nextDueOn, 'Mon 2 Jan') : '');

	const formErrors = $derived(form && 'errors' in form ? (form.errors as Record<string, string>) : {});
	const formValues = $derived(form && 'values' in form ? ((form.values as FormValues | null) ?? null) : null);
	const compareError = $derived(form && 'compareError' in form ? String(form.compareError) : '');
</script>

<svelte:head><title>{pageTitle(i18n.t('progress.title'))}</title></svelte:head>

<div class="mx-auto w-full max-w-3xl space-y-6 p-6 md:p-8" data-testid="progress-page">
	<header>
		<MonoLabel text={i18n.t('progress.label')} />
		<h1 class="mt-2 text-2xl font-medium tracking-tight">{i18n.t('progress.title')}</h1>
		<p class="text-muted-foreground mt-1 text-sm">{i18n.t('progress.intro')}</p>
	</header>
	{#if schedule.due}
		<Alert.Root data-testid="progress-due">
			<Alert.Description>{i18n.t('progress.due')}</Alert.Description>
		</Alert.Root>
	{/if}
	<NewCheck {today} {assist} {last} initial={formValues} errors={formErrors} />
	<Reminder cadence={schedule.cadence ?? ''} {nextDueOn} />
	{#if data.checks.comparison || data.checks.canCompare}
		<Comparison comparison={data.checks.comparison} canCompare={data.checks.canCompare} {assist} error={compareError} />
	{/if}
	<History {checks} />
</div>
