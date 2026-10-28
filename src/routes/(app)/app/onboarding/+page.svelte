<script lang="ts">
	import { enhance } from '$app/forms';
	import AuthShell from '#lib/components/layout/AuthShell.svelte';
	import Mascot from '#lib/components/khepri/Mascot.svelte';
	import * as Alert from '#lib/components/ui/alert/index.js';
	import { Button } from '#lib/components/ui/button/index.js';
	import * as Card from '#lib/components/ui/card/index.js';
	import { Checkbox } from '#lib/components/ui/checkbox/index.js';
	import { Input } from '#lib/components/ui/input/index.js';
	import { Label } from '#lib/components/ui/label/index.js';
	import * as RadioGroup from '#lib/components/ui/radio-group/index.js';
	import { Textarea } from '#lib/components/ui/textarea/index.js';
	import DictateField from '#lib/features/voice/DictateField.svelte';
	import { useI18n } from '#lib/i18n/index.js';
	import type { PageProps } from './$types';

	// Go: web/onboarding/onboarding.templ FormPage, in the wide auth card.
	let { data, form }: PageProps = $props();
	const i18n = useI18n();

	const values = $derived(form?.values);
	const errors = $derived<Record<string, string>>(form?.errors ?? {});
	const hasFieldError = $derived(Boolean(errors.focus_areas || errors.coaching_style || errors.goal_title));

	// svelte-ignore state_referenced_locally
	let preset = $state(form?.values?.coaching_style_preset || 'direct');
	// svelte-ignore state_referenced_locally
	let firstWeek = $state(form?.values?.first_week_template || 'custom');
	let submitting = $state(false);

	function focusChecked(area: string): boolean {
		return values?.focus_areas?.includes(area) ?? false;
	}

	const styleKeys: Record<string, string> = {
		direct: 'onboarding.style.direct',
		supportive: 'onboarding.style.supportive',
		socratic: 'onboarding.style.socratic',
		custom: 'onboarding.style.custom'
	};
	// Only the presets this client has copy for; the API lists them as open strings.
	const styles = $derived(data.choices.coachingStyles.filter((s) => s in styleKeys));
</script>

<AuthShell title={i18n.t('onboarding.page')} wide>
	<Card.Root>
		<Card.Header>
			<div class="flex justify-center pb-2">
				<Mascot size="md" state="listening" />
			</div>
			<Card.Title>{i18n.t('onboarding.title')}</Card.Title>
			<Card.Description>{i18n.t('onboarding.desc')}</Card.Description>
		</Card.Header>
		<Card.Content>
			{#if hasFieldError}
				<Alert.Root variant="destructive" class="mb-4">
					<Alert.Description>{i18n.t('onboarding.fix')}</Alert.Description>
				</Alert.Root>
			{:else if form?.error}
				<Alert.Root variant="destructive" class="mb-4">
					<Alert.Description>{form.error}</Alert.Description>
				</Alert.Root>
			{/if}
			<form
				method="post"
				action="?/complete"
				class="space-y-8"
				use:enhance={() => {
					submitting = true;
					return async ({ update }) => {
						await update({ reset: false });
						submitting = false;
					};
				}}
			>
				<section class="space-y-3">
					<Label for="focus-{data.choices.focusAreas[0]}">{i18n.t('onboarding.focus.label')}</Label>
					<p class="text-sm text-muted-foreground">{i18n.t('onboarding.focus.hint')}</p>
					<div class="grid grid-cols-2 gap-3">
						{#each data.choices.focusAreas as area (area)}
							<label class="flex items-center gap-2 text-sm">
								<Checkbox id="focus-{area}" name="focus_areas" value={area} checked={focusChecked(area)} />
								{i18n.t(`lifedomain.${area}`)}
							</label>
						{/each}
					</div>
					{#if errors.focus_areas}
						<p class="text-sm text-destructive">{errors.focus_areas}</p>
					{/if}
				</section>

				<section class="space-y-3">
					<Label for="style-direct">{i18n.t('onboarding.style.label')}</Label>
					<RadioGroup.Root name="coaching_style_preset" bind:value={preset} class="space-y-2 gap-0">
						{#each styles as style (style)}
							<label
								class="flex cursor-pointer items-start gap-3 rounded-md border border-border p-3 has-[[data-state=checked]]:border-signal/50 has-[[data-state=checked]]:bg-signal/5"
							>
								<RadioGroup.Item id="style-{style}" value={style} class="mt-0.5" />
								<span class="space-y-0.5">
									<span class="block text-sm font-medium">{i18n.t(styleKeys[style])}</span>
									<span class="block text-sm text-muted-foreground">{i18n.t(`${styleKeys[style]}.desc`)}</span>
								</span>
							</label>
						{/each}
					</RadioGroup.Root>
					{#if preset === 'custom'}
						<div class="space-y-2">
							<DictateField target="coaching_style_custom">
								<Textarea
									id="coaching_style_custom"
									name="coaching_style_custom"
									rows={3}
									placeholder={i18n.t('onboarding.style.placeholder')}
									value={values?.coaching_style_custom ?? ''}
								/>
							</DictateField>
						</div>
					{/if}
					{#if errors.coaching_style}
						<p class="text-sm text-destructive">{errors.coaching_style}</p>
					{/if}
				</section>

				{#if data.choices.firstWeek}
					<fieldset class="space-y-3">
						<legend class="text-sm font-medium">{i18n.t('onboarding.firstweek.label')}</legend>
						<p class="text-sm text-muted-foreground">{i18n.t('onboarding.firstweek.hint')}</p>
						<RadioGroup.Root name="first_week_template" bind:value={firstWeek} class="grid gap-2 sm:grid-cols-2">
							{#each data.choices.firstWeekTemplates as template (template)}
								<label
									class="flex cursor-pointer items-center gap-3 rounded-md border border-border p-3 has-[[data-state=checked]]:border-signal/50 has-[[data-state=checked]]:bg-signal/5"
								>
									<RadioGroup.Item id="first_week_{template}" value={template} />
									<span class="text-sm font-medium">{i18n.t(`firstweek.${template}.label`)}</span>
								</label>
							{/each}
						</RadioGroup.Root>
					</fieldset>
				{/if}

				<section class="space-y-2">
					<Label for="goal_title">{i18n.t('onboarding.goal.label')}</Label>
					<Input
						id="goal_title"
						name="goal_title"
						value={values?.goal_title ?? ''}
						placeholder={i18n.t('onboarding.goal.placeholder')}
						aria-invalid={errors.goal_title ? true : undefined}
					/>
					{#if errors.goal_title}
						<p class="text-sm text-destructive">{errors.goal_title}</p>
					{/if}
				</section>

				<Button type="submit" class="w-full bg-signal text-background hover:bg-signal/90" disabled={submitting}>
					{i18n.t('onboarding.submit')}
				</Button>
			</form>
		</Card.Content>
	</Card.Root>
	<!-- Its own form, outside the card: skipping ignores every field above it. -->
	<form method="post" action="?/skip" class="mt-4 flex justify-center">
		<Button type="submit" variant="ghost" class="text-muted-foreground">{i18n.t('onboarding.skip')}</Button>
	</form>
</AuthShell>
