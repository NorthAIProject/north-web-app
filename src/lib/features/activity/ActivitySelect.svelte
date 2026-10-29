<!--
	The activity picker both forms use (templUI selectbox: Trigger with ID and
	Name, Value with the "Choose one" placeholder, one item per MET entry).
-->
<script lang="ts">
	import SearchSelect from '#lib/components/khepri/SearchSelect.svelte';

	let {
		id,
		name,
		placeholder,
		options
	}: {
		id: string;
		name: string;
		placeholder: string;
		options: { value: string; label: string }[];
	} = $props();

	let value = $state('');
</script>

<SearchSelect {id} {name} bind:value items={options} {placeholder} />
