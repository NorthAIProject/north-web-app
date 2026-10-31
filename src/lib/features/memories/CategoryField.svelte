<!-- The category picker in the add and edit forms (Go: memories.categoryField). -->
<script lang="ts">
	import { FieldMessage, describe, describedBy } from '#lib/components/ui/field-message/index.js';
	import { Label } from '#lib/components/ui/label/index.js';
	import SearchSelect from '#lib/components/khepri/SearchSelect.svelte';
	import { useI18n } from '#lib/i18n/index.js';
	import { categories, categoryLabel, CATEGORY_GENERAL } from './view.js';

	let { id, selected = '', error = '' }: { id: string; selected?: string; error?: string } = $props();

	const i18n = useI18n();
	const items = $derived(categories.map((c) => ({ value: c, label: categoryLabel(i18n, c) })));
	// An empty value picks General, as the Go selectbox did.
	let value = $derived(selected || CATEGORY_GENERAL);
</script>

<div class="space-y-2" {@attach describe(id, describedBy(id, error))}>
	<Label for={id} {error}>{i18n.t('memories.category')}</Label>
	<SearchSelect
		{id}
		name="category"
		bind:value
		{items}
		placeholder={i18n.t('memories.choose_one')}
		invalid={Boolean(error)}
	/>
	<FieldMessage {id} {error} />
</div>
