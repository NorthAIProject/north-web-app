<script lang="ts">
	import { enhance } from '$app/forms';
	import { pageTitle } from '#lib/brand.js';
	import * as Alert from '#lib/components/ui/alert/index.js';
	import { Button } from '#lib/components/ui/button/index.js';
	import * as Card from '#lib/components/ui/card/index.js';
	import { Checkbox } from '#lib/components/ui/checkbox/index.js';
	import { Input } from '#lib/components/ui/input/index.js';
	import { Label } from '#lib/components/ui/label/index.js';
	import * as Select from '#lib/components/ui/select/index.js';
	import { Textarea } from '#lib/components/ui/textarea/index.js';
	import { EQUIPMENT_OPTIONS, EXPERIENCE_OPTIONS } from '#lib/features/training/intake.js';
	import { WEEKDAYS, weekdayShort } from '#lib/features/training/weekday.js';
	import DictateField from '#lib/features/voice/DictateField.svelte';
	import { useI18n } from '#lib/i18n/index.js';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();
	const i18n = useI18n();

	// A refused intake keeps what was typed (Go: re-rendered IntakeForm).
	const f = $derived(form?.values ?? data.intake);
	const errors = $derived<Record<string, string>>(form?.errors ?? {});
	const hasWeekday = (wd: string) => (f.weekdays ?? []).some((d) => d.toLowerCase() === wd.toLowerCase());
	const num = (n: number) => (n === 0 ? '' : String(n));
	const experienceItems = $derived(EXPERIENCE_OPTIONS.map((o) => ({ value: o.value, label: i18n.t(o.key) })));
	let submitting = $state(false);
</script>

<svelte:head><title>{pageTitle(i18n.t('workouts.intake.page'))}</title></svelte:head>

{#snippet fieldMessage(name: string)}
	{#if errors[name]}
		<p class="text-destructive text-[0.8rem] font-medium">{errors[name]}</p>
	{/if}
{/snippet}

<div class="mx-auto w-full max-w-2xl p-6 md:p-8">
	<header class="mb-6">
		<h1 class="text-2xl font-semibold tracking-tight">{i18n.t('workouts.intake.title')}</h1>
		<p class="text-muted-foreground mt-1 text-sm">{i18n.t('workouts.intake.lede')}</p>
		<p class="text-muted-foreground mt-2 text-sm">
			{i18n.t('workouts.intake.import.q')}
			<Button variant="link" href="/app/training/import" class="h-auto p-0">{i18n.t('workouts.intake.import.link')}</Button>
		</p>
	</header>
	{#if form?.error}
		<Alert.Root variant="destructive" class="mb-4">
			<Alert.Description>{form.error}</Alert.Description>
		</Alert.Root>
	{/if}
	<Card.Root>
		<Card.Content>
			<form
				method="post"
				class="space-y-5 pt-6"
				use:enhance={() => {
					submitting = true;
					return async ({ update }) => {
						await update({ reset: false });
						submitting = false;
					};
				}}
			>
				<div class="space-y-2">
					<Label for="goal" error={errors.goal}>{i18n.t('workouts.intake.goal')}</Label>
					<DictateField target="goal">
						<Textarea
							id="goal"
							name="goal"
							value={f.goal}
							placeholder={i18n.t('workouts.intake.goal.ph')}
							rows={3}
							aria-invalid={errors.goal ? true : undefined}
						/>
					</DictateField>
					{@render fieldMessage('goal')}
				</div>
				<div class="space-y-2">
					<Label for="experience" error={errors.experience}>{i18n.t('workouts.intake.experience')}</Label>
					<Select.Root type="single" name="experience" value={f.experience} items={experienceItems}>
						<Select.Trigger id="experience" aria-invalid={errors.experience ? true : undefined}>
							<Select.Value placeholder={i18n.t('workouts.intake.experience.ph')} />
						</Select.Trigger>
						<Select.Content>
							{#each experienceItems as o (o.value)}
								<Select.Item value={o.value} label={o.label}>{o.label}</Select.Item>
							{/each}
						</Select.Content>
					</Select.Root>
					{@render fieldMessage('experience')}
				</div>
				<div class="grid gap-5 sm:grid-cols-2">
					<div class="space-y-2">
						<Label for="days_per_week" error={errors.days_per_week}>{i18n.t('workouts.intake.days')}</Label>
						<Input
							id="days_per_week"
							name="days_per_week"
							type="number"
							value={num(f.daysPerWeek)}
							required
							min="1"
							max="7"
							aria-invalid={errors.days_per_week ? true : undefined}
						/>
						{@render fieldMessage('days_per_week')}
					</div>
					<div class="space-y-2">
						<Label for="session_minutes" error={errors.session_minutes}>{i18n.t('workouts.intake.minutes')}</Label>
						<Input
							id="session_minutes"
							name="session_minutes"
							type="number"
							value={num(f.sessionMinutes)}
							required
							min="10"
							max="240"
							step="5"
							aria-invalid={errors.session_minutes ? true : undefined}
						/>
						{@render fieldMessage('session_minutes')}
					</div>
				</div>
				<div class="space-y-2">
					<Label error={errors.weekdays}>{i18n.t('workouts.intake.weekdays')}</Label>
					<p class="text-muted-foreground text-sm">{i18n.t('workouts.intake.weekdays.desc')}</p>
					<div class="flex flex-wrap gap-x-4 gap-y-2 pt-1">
						{#each WEEKDAYS as wd (wd)}
							<div class="flex items-center gap-2">
								<Checkbox id="intake-{wd}" name="weekdays" value={wd} checked={hasWeekday(wd)} />
								<Label for="intake-{wd}" class="font-normal">{weekdayShort(i18n, wd)}</Label>
							</div>
						{/each}
					</div>
					{@render fieldMessage('weekdays')}
				</div>
				<div class="space-y-2">
					<Label>{i18n.t('workouts.intake.equipment')}</Label>
					<p class="text-muted-foreground text-sm">{i18n.t('workouts.intake.equipment.desc')}</p>
					<div class="grid gap-3 pt-1 sm:grid-cols-2">
						{#each EQUIPMENT_OPTIONS as option (option.value)}
							<div class="flex items-center gap-2">
								<Checkbox
									id="equipment-{option.value}"
									name="equipment"
									value={option.value}
									checked={f.equipment.includes(option.value)}
								/>
								<Label for="equipment-{option.value}" class="font-normal">{i18n.t(option.key)}</Label>
							</div>
						{/each}
					</div>
				</div>
				<div class="space-y-2">
					<Label for="limitations" error={errors.limitations}>{i18n.t('workouts.intake.limitations')}</Label>
					<DictateField target="limitations">
						<Textarea
							id="limitations"
							name="limitations"
							value={f.limitations}
							placeholder={i18n.t('workouts.intake.limitations.ph')}
							rows={2}
							aria-invalid={errors.limitations ? true : undefined}
						/>
					</DictateField>
					{@render fieldMessage('limitations')}
				</div>
				<Button type="submit" class="w-full" disabled={submitting}>{i18n.t('workouts.intake.submit')}</Button>
				<p class="text-muted-foreground text-center text-xs">{i18n.t('workouts.intake.wait')}</p>
			</form>
		</Card.Content>
	</Card.Root>
</div>
