<!-- Shared by create and edit, so the two cannot drift apart (Go goalFields). -->
<script lang="ts">
	import type { Snippet } from 'svelte';
	import { Input } from '#lib/components/ui/input/index.js';
	import { Label } from '#lib/components/ui/label/index.js';
	import SearchSelect from '#lib/components/khepri/SearchSelect.svelte';
	import { Textarea } from '#lib/components/ui/textarea/index.js';
	import DictateField from '#lib/features/checkins/DictateField.svelte';
	import { useI18n } from '#lib/i18n/index.js';
	import { CATEGORIES, categoryLabel, type GoalForm } from './goals.js';

	let {
		form,
		errors = {},
		mic
	}: {
		form: GoalForm;
		errors?: Record<string, string>;
		/** The dictation mic, see DictateField. */
		mic?: Snippet<[target: string]>;
	} = $props();

	const i18n = useI18n();
	// svelte-ignore state_referenced_locally
	let category = $state(form.category);
	const items = $derived(CATEGORIES.map((c) => ({ value: c, label: categoryLabel(i18n, c) })));
</script>

{#snippet message(msg: string | undefined)}
	{#if msg}
		<p class="text-[0.8rem] font-medium text-red-500">{msg}</p>
	{/if}
{/snippet}

<div class="space-y-2">
	<Label for="title" error={errors.title}>{i18n.t('goals.f.title')}</Label>
	<Input
		id="title"
		name="title"
		value={form.title}
		placeholder={i18n.t('goals.f.title.ph')}
		required
		aria-invalid={errors.title ? 'true' : undefined}
	/>
	{@render message(errors.title)}
</div>
<div class="space-y-2">
	<Label for="motivation" error={errors.motivation}>{i18n.t('goals.f.motivation')}</Label>
	<DictateField target="motivation" {mic}>
		<Textarea
			id="motivation"
			name="motivation"
			value={form.motivation}
			placeholder={i18n.t('goals.f.motivation.ph')}
			rows={2}
			aria-invalid={errors.motivation ? 'true' : undefined}
		/>
	</DictateField>
	{@render message(errors.motivation)}
</div>
<div class="space-y-2">
	<Label for="success" error={errors.success}>{i18n.t('goals.f.success')}</Label>
	<DictateField target="success" {mic}>
		<Textarea
			id="success"
			name="success"
			value={form.success}
			placeholder={i18n.t('goals.f.success.ph')}
			rows={2}
			aria-invalid={errors.success ? 'true' : undefined}
		/>
	</DictateField>
	{@render message(errors.success)}
</div>
<div class="grid gap-4 sm:grid-cols-2">
	<div class="space-y-2">
		<Label for="category" error={errors.category}>{i18n.t('goals.f.category')}</Label>
		<SearchSelect
			id="category"
			name="category"
			bind:value={category}
			{items}
			placeholder={i18n.t('goals.f.category.ph')}
			invalid={Boolean(errors.category)}
		/>
		{@render message(errors.category)}
	</div>
	<div class="space-y-2">
		<Label for="target_date" error={errors.target_date}>{i18n.t('goals.f.date')}</Label>
		<Input
			id="target_date"
			name="target_date"
			type="date"
			value={form.targetDate}
			aria-invalid={errors.target_date ? 'true' : undefined}
		/>
		{#if errors.target_date}
			{@render message(errors.target_date)}
		{:else}
			<p class="text-muted-foreground text-sm">{i18n.t('goals.f.date.desc')}</p>
		{/if}
	</div>
</div>
