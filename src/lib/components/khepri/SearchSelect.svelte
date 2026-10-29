<!--
	templUI selectbox with its search box and clear button (web/shared/ui/selectbox):
	a trigger styled like the Select trigger, a popover with a sticky search
	input over a filtered list, and a ⊗ that empties the value once something
	is picked. Posts with its form through a hidden input, as the Select does.

	Use it where the Go selectbox had search (no NoSearch); a short fixed list
	stays a plain Select.
-->
<script lang="ts">
	import ChevronDownIcon from '@lucide/svelte/icons/chevron-down';
	import CircleXIcon from '@lucide/svelte/icons/circle-x';
	import * as Command from '#lib/components/ui/command/index.js';
	import * as Popover from '#lib/components/ui/popover/index.js';
	import { useI18n } from '#lib/i18n/index.js';
	import { cn } from '#lib/utils.js';

	export type SearchSelectItem = { value: string; label: string };
	export type SearchSelectGroup = { label?: string; items: SearchSelectItem[] };

	let {
		id,
		name,
		value = $bindable(''),
		items = [],
		groups,
		placeholder = '',
		searchPlaceholder,
		clearable = true,
		disabled = false,
		invalid = false,
		class: className,
		'aria-label': ariaLabel,
		onValueChange
	}: {
		id?: string;
		name?: string;
		value?: string;
		items?: SearchSelectItem[];
		/** Grouped options, with an optional heading each; takes the place of items. */
		groups?: SearchSelectGroup[];
		placeholder?: string;
		searchPlaceholder?: string;
		clearable?: boolean;
		disabled?: boolean;
		invalid?: boolean;
		class?: string;
		'aria-label'?: string;
		onValueChange?: (value: string) => void;
	} = $props();

	const i18n = useI18n();
	let open = $state(false);

	const sections = $derived(groups ?? [{ items }]);
	const label = $derived(sections.flatMap((s) => s.items).find((i) => i.value === value)?.label ?? '');

	function pick(next: string) {
		value = next;
		open = false;
		onValueChange?.(next);
	}
</script>

{#if name}
	<input type="hidden" {name} {value} />
{/if}
<Popover.Root bind:open>
	<Popover.Trigger
		{id}
		{disabled}
		aria-invalid={invalid ? true : undefined}
		aria-label={ariaLabel}
		role="combobox"
		aria-expanded={open}
		class={cn(
			// The Select trigger's classes (select-trigger.svelte), so both read as one control.
			'flex h-9 w-full cursor-pointer items-center justify-between gap-2 whitespace-nowrap rounded-md border border-input bg-transparent px-3 py-1 text-base font-medium shadow-xs transition-[color,box-shadow] outline-none select-none md:text-sm hover:bg-accent hover:text-accent-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50 focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 aria-invalid:border-destructive dark:aria-invalid:ring-destructive/40 disabled:pointer-events-none disabled:opacity-50',
			className
		)}
	>
		<span class={cn('min-w-0 truncate', !label && 'text-muted-foreground')}>{label || placeholder}</span>
		<span class="flex items-center">
			{#if clearable && value && !disabled}
				<!-- A span, as in templUI: a button cannot sit inside the trigger button. -->
				<span
					class="text-muted-foreground hover:text-foreground ml-1 cursor-pointer"
					role="button"
					tabindex="-1"
					aria-label="Clear selection"
					onclick={(e) => {
						e.stopPropagation();
						pick('');
					}}
					onkeydown={() => {}}
				>
					<CircleXIcon class="size-3.5" />
				</span>
			{/if}
			<ChevronDownIcon class="text-muted-foreground pointer-events-none ml-1 size-4" />
		</span>
	</Popover.Trigger>
	<Popover.Content class="w-(--bits-popover-anchor-width) min-w-48 p-0" align="start">
		<!-- Matches the label as typed, as templUI's search did; never the value,
		     which is often an id. -->
		<Command.Root filter={(_, search, keywords) => (keywords?.[0] ?? '').toLowerCase().includes(search.trim().toLowerCase()) ? 1 : 0}>
			<Command.Input placeholder={searchPlaceholder || i18n.t('layout.search')} />
			<Command.List class="max-h-[300px] overflow-y-auto">
				{#each sections as section, si (si)}
					<Command.Group heading={section.label}>
						{#each section.items as item (item.value)}
							<Command.Item
								value={item.value}
								keywords={[item.label]}
								data-checked={item.value === value}
								onSelect={() => pick(item.value)}
							>
								{item.label}
							</Command.Item>
						{/each}
					</Command.Group>
				{/each}
			</Command.List>
		</Command.Root>
	</Popover.Content>
</Popover.Root>
