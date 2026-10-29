<!--
	A named select that posts with its form (templUI selectbox as the settings
	templates use it: Trigger with ID/Name/HasError, Value with a placeholder,
	optional groups with a label). With search (templUI's default) it is the
	searchable selectbox; search={false} is NoSearch.
-->
<script lang="ts">
	import SearchSelect from '#lib/components/khepri/SearchSelect.svelte';
	import * as Select from '#lib/components/ui/select/index.js';

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
		onchange?: (value: string) => void;
	} = $props();

	const items = $derived(groups.flatMap((g) => g.options));
	// Seeded from the server; the person's pick lives here until the next load.
	let selected = $derived(value);
</script>

{#if search}
	<SearchSelect
		{id}
		{name}
		bind:value={selected}
		groups={groups.map((g) => ({ label: g.label, items: g.options }))}
		{placeholder}
		{searchPlaceholder}
		invalid={error}
		onValueChange={(v) => onchange?.(v)}
	/>
{:else}
<Select.Root type="single" {name} bind:value={selected} {items} onValueChange={(v) => onchange?.(v)}>
	<Select.Trigger {id} aria-invalid={error ? true : undefined}>
		<Select.Value {placeholder} />
	</Select.Trigger>
	<Select.Content>
		{#each groups as group, gi (gi)}
			{#if group.label}
				<Select.Group>
					<Select.GroupHeading>{group.label}</Select.GroupHeading>
					{#each group.options as o (o.value)}
						<Select.Item value={o.value} label={o.label}>{o.label}</Select.Item>
					{/each}
				</Select.Group>
			{:else}
				{#each group.options as o (o.value)}
					<Select.Item value={o.value} label={o.label}>{o.label}</Select.Item>
				{/each}
			{/if}
		{/each}
	</Select.Content>
</Select.Root>
{/if}
