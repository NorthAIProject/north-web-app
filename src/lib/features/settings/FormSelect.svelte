<!--
	A named select that posts with its form (templUI selectbox as the settings
	templates use it: Trigger with ID/Name/HasError, Value with a placeholder,
	optional groups with a label). search={false} is NoSearch.
-->
<script lang="ts">
	import SearchSelect from '#lib/components/khepri/SearchSelect.svelte';
	import { describe } from '#lib/components/ui/field-message/index.js';

	export type Option = { value: string; label: string };
	export type OptionGroup = { label?: string; options: Option[] };

	let {
		id,
		name,
		value = '',
		placeholder = '',
		groups,
		error = false,
		search = true,
		searchPlaceholder,
		describedby,
		onchange
	}: {
		id: string;
		name: string;
		value?: string;
		placeholder?: string;
		groups: OptionGroup[];
		error?: boolean;
		/** templUI's search box; false is NoSearch. */
		search?: boolean;
		searchPlaceholder?: string;
		/** The FieldMessage id the trigger is described by (describedBy()). */
		describedby?: string;
		onchange?: (value: string) => void;
	} = $props();

	// Seeded from the server; the person's pick lives here until the next load.
	let selected = $derived(value);
</script>

<div class="contents" {@attach describe(id, describedby)}>
	<SearchSelect
		{id}
		{name}
		bind:value={selected}
		groups={groups.map((g) => ({ label: g.label, items: g.options }))}
		{placeholder}
		{search}
		{searchPlaceholder}
		invalid={error}
		onValueChange={(v) => onchange?.(v)}
	/>
</div>
