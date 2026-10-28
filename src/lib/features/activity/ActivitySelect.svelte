<!--
	The activity picker both forms use (templUI selectbox: Trigger with ID and
	Name, Value with the "Choose one" placeholder, one item per MET entry).
-->
<script lang="ts">
	import * as Select from '#lib/components/ui/select/index.js';

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

<Select.Root type="single" {name} bind:value items={options}>
	<Select.Trigger {id}>
		<Select.Value {placeholder} />
	</Select.Trigger>
	<Select.Content>
		{#each options as o (o.value)}
			<Select.Item value={o.value} label={o.label}>{o.label}</Select.Item>
		{/each}
	</Select.Content>
</Select.Root>
