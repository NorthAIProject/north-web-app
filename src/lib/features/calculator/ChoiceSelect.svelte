<!-- One of the plan form's selects (Go: calculator.planCard's selectbox), each
     option reading "Label — what it means". -->
<script lang="ts">
	import * as Select from '#lib/components/ui/select/index.js';

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

<Select.Root type="single" {name} bind:value {items}>
	<Select.Trigger {id}>
		<Select.Value {placeholder} />
	</Select.Trigger>
	<Select.Content>
		{#each items as item (item.value)}
			<Select.Item value={item.value} label={item.label}>{item.label}</Select.Item>
		{/each}
	</Select.Content>
</Select.Root>
