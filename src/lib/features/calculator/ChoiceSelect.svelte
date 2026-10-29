<!-- One of the plan form's selects (Go: calculator.planCard's selectbox), each
     option reading "Label — what it means". -->
<script lang="ts">
	import SearchSelect from '#lib/components/khepri/SearchSelect.svelte';

	let {
		id,
		name,
		placeholder,
		items,
		selected = ''
	}: { id: string; name: string; placeholder: string; items: { value: string; label: string }[]; selected?: string } =
		$props();

	let value = $derived(selected);
</script>

<SearchSelect {id} {name} bind:value {items} {placeholder} />
