<script lang="ts">
	import { pageTitle } from '#lib/brand.js';
	import MonoLabel from '#lib/components/khepri/MonoLabel.svelte';
	import { Button } from '#lib/components/ui/button/index.js';
	import * as Card from '#lib/components/ui/card/index.js';
	import CareInstruments from '#lib/features/care/CareInstruments.svelte';
	import HabitsCard from '#lib/features/care/HabitsCard.svelte';
	import MedicationsCard from '#lib/features/care/MedicationsCard.svelte';
	import RemindersCards from '#lib/features/care/RemindersCards.svelte';
	import SleepCard from '#lib/features/care/SleepCard.svelte';
	import WaterCard from '#lib/features/care/WaterCard.svelte';
	import { failureFor } from '#lib/features/care/forms.js';
	import { useI18n } from '#lib/i18n/index.js';
	import type { PageProps } from './$types';

	// Go: web/care/care.templ Page/Panel.
	let { data, form }: PageProps = $props();
	const i18n = useI18n();

	const care = $derived(data.care);
	const timezone = $derived(data.user.timezone || 'UTC');
</script>

<svelte:head><title>{pageTitle(i18n.t('care.mono'))}</title></svelte:head>

<div id="care-panel" class="mx-auto w-full max-w-6xl space-y-6 p-6 md:p-8">
	<header>
		<MonoLabel text={i18n.t('care.mono')} />
		<h1 class="mt-2 text-2xl font-medium tracking-tight">{i18n.t('care.heading')}</h1>
		<p class="text-muted-foreground mt-1 text-sm leading-relaxed">{i18n.t('care.intro')}</p>
	</header>
	<CareInstruments {care} />
	<Card.Root class="border-hairline bg-surface">
		<Card.Header>
			<Card.Title>{i18n.t('care.checkin.title')}</Card.Title>
			<Card.Description>
				{i18n.t(care.checkedInToday ? 'care.checkin.done' : 'care.checkin.pending')}
			</Card.Description>
		</Card.Header>
		{#if !care.checkedInToday}
			<Card.Content>
				<Button href="/app/check-ins" class="bg-signal text-background hover:bg-signal/90">
					{i18n.t('care.kpi.checkcta')}
				</Button>
			</Card.Content>
		{/if}
	</Card.Root>
	<WaterCard water={care.water} failure={failureFor(form, 'water')} {timezone} />
	<SleepCard last={care.lastNight} failure={failureFor(form, 'sleep')} />
	<HabitsCard habits={care.habits} failure={failureFor(form, 'habit')} />
	<MedicationsCard medications={data.medications} failure={failureFor(form, 'medication')} {timezone} />
	<RemindersCards reminders={care.reminders} failure={failureFor(form, 'reminder')} />
</div>
