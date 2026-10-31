<!-- One of the plan form's selects (Go: calculator.planCard's selectbox), each
     option reading "Label — what it means". Named by a <Label for={id}> beside
     it, or by aria-labelledby. -->
<script lang="ts">
	import SearchSelect from '#lib/components/khepri/SearchSelect.svelte';

	let {
		id,
		name,
		placeholder,
		items,
		selected = '',
		invalid = false,
		'aria-labelledby': ariaLabelledby,
		'aria-describedby': ariaDescribedby
	}: {
		id: string;
		name: string;
		placeholder: string;
		items: { value: string; label: string }[];
		selected?: string;
		invalid?: boolean;
		'aria-labelledby'?: string;
		'aria-describedby'?: string;
	} = $props();

	let value = $derived(selected);
</script>

<SearchSelect
	{id}
	{name}
	bind:value
	{items}
	{placeholder}
	{invalid}
	aria-labelledby={ariaLabelledby}
	aria-describedby={ariaDescribedby}
/>
