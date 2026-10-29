<!-- One select of the browse filter form, submitted as a plain GET field (Go: selectbox in filterForm). -->
<script lang="ts">
	import SearchSelect from '#lib/components/khepri/SearchSelect.svelte';

	let {
		id,
		name,
		placeholder,
		value = '',
		options
	}: { id: string; name: string; placeholder: string; value?: string; options: { value: string; label: string }[] } =
		$props();

	// svelte-ignore state_referenced_locally
	let selected = $state(value);
	$effect.pre(() => {
		selected = value;
	});
</script>

<SearchSelect {id} {name} bind:value={selected} items={options} {placeholder} aria-label={placeholder} />
