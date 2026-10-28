<!-- The category picker in the add and edit forms (Go: memories.categoryField). -->
<script lang="ts">
	import { Label } from '#lib/components/ui/label/index.js';
	import * as Select from '#lib/components/ui/select/index.js';
	import { useI18n } from '#lib/i18n/index.js';
	import { categories, categoryLabel, CATEGORY_GENERAL } from './view.js';

	let { id, selected = '', error = '' }: { id: string; selected?: string; error?: string } = $props();

	const i18n = useI18n();
	const items = $derived(categories.map((c) => ({ value: c, label: categoryLabel(i18n, c) })));
	// An empty value picks General, as the Go selectbox did.
	let value = $derived(selected || CATEGORY_GENERAL);
</script>

<div class="space-y-2">
	<Label>{i18n.t('memories.category')}</Label>
	<Select.Root type="single" name="category" bind:value {items}>
		<Select.Trigger {id} aria-invalid={error ? true : undefined}>
			<Select.Value placeholder={i18n.t('memories.choose_one')} />
		</Select.Trigger>
		<Select.Content>
			{#each categories as c (c)}
				<Select.Item value={c} label={categoryLabel(i18n, c)}>{categoryLabel(i18n, c)}</Select.Item>
			{/each}
		</Select.Content>
	</Select.Root>
	{#if error}
		<p class="text-[0.8rem] font-medium text-red-500">{error}</p>
	{/if}
</div>
