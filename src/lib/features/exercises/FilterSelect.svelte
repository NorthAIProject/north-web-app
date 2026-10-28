<!-- One select of the browse filter form, submitted as a plain GET field (Go: selectbox in filterForm). -->
<script lang="ts">
	import * as Select from '#lib/components/ui/select/index.js';

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

<Select.Root type="single" {name} bind:value={selected} items={options}>
	<Select.Trigger {id} aria-label={placeholder}>
		<Select.Value {placeholder} />
	</Select.Trigger>
	<Select.Content>
		{#each options as option (option.value)}
			<Select.Item value={option.value} label={option.label} />
		{/each}
	</Select.Content>
</Select.Root>
