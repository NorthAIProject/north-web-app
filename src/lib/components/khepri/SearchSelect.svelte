<!--
	templUI selectbox with its search box and clear button (web/shared/ui/selectbox):
	a trigger styled like the Select trigger, a popover with a sticky search
	input over a filtered list, and a ⊗ that empties the value once something
	is picked. Posts with its form through a hidden input, as the Select does.

	search={false} is the Go selectbox's NoSearch: the list without the search
	input. The ⊗ shows either way, as templUI's trigger always had it.

	Naming: the trigger is a <button>, so <Label for={id}> names it; pass
	aria-labelledby (or aria-label) where there is no label element. The ⊗ is
	its own button beside the trigger (a button cannot sit inside a button),
	drawn over the trigger's right edge and next in the tab order.
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
		search = true,
		clearable = true,
		disabled = false,
		invalid = false,
		class: className,
		'aria-label': ariaLabel,
		'aria-labelledby': ariaLabelledby,
		'aria-describedby': ariaDescribedby,
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
		/** false: no search input over the list (Go's NoSearch). */
		search?: boolean;
		clearable?: boolean;
		disabled?: boolean;
		invalid?: boolean;
		class?: string;
		'aria-label'?: string;
		'aria-labelledby'?: string;
		'aria-describedby'?: string;
		onValueChange?: (value: string) => void;
	} = $props();

	const i18n = useI18n();
	let open = $state(false);
	let trigger = $state<HTMLButtonElement | null>(null);

	const sections = $derived(groups ?? [{ items }]);
	const label = $derived(
		sections.flatMap((s) => s.items).find((i) => i.value === value)?.label ?? ''
	);

	function pick(next: string) {
		value = next;
		open = false;
		onValueChange?.(next);
	}

	const showClear = $derived(clearable && Boolean(value) && !disabled);

	function clear() {
		pick('');
		// The ⊗ goes away with the value; focus stays on the field, not the body.
		trigger?.focus();
	}
</script>

{#if name}
	<input type="hidden" {name} {value} />
{/if}
<!-- The trigger keeps its own width class; the ⊗ follows its right edge with
     negative margins that net to zero, so the wrapper is as wide as before. -->
<div class="flex w-full min-w-0 items-center">
	<Popover.Root bind:open>
		<Popover.Trigger
			bind:ref={trigger}
			{id}
			{disabled}
			aria-invalid={invalid ? true : undefined}
			aria-label={ariaLabel}
			aria-labelledby={ariaLabelledby}
			aria-describedby={ariaDescribedby}
			role="combobox"
			aria-expanded={open}
			class={cn(
				// The Select trigger's classes (select-trigger.svelte), so both read as one control.
				'flex h-9 w-full cursor-pointer items-center justify-between gap-2 rounded-md border border-input bg-transparent px-3 py-1 text-base font-medium whitespace-nowrap shadow-xs transition-[color,box-shadow] outline-none select-none hover:bg-accent hover:text-accent-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 md:text-sm dark:border-input dark:bg-input/30 dark:hover:bg-input/50 dark:aria-invalid:ring-destructive/40',
				className
			)}
		>
			<span class={cn('min-w-0 truncate', !label && 'text-muted-foreground')}
				>{label || placeholder}</span
			>
			<span class="flex items-center">
				{#if showClear}
					<!-- Room for the ⊗ button drawn over this spot. -->
					<span class="w-6" aria-hidden="true"></span>
				{/if}
				<ChevronDownIcon class="pointer-events-none ml-1 size-4 text-muted-foreground" />
			</span>
		</Popover.Trigger>
		<Popover.Content class="w-(--bits-popover-anchor-width) min-w-48 p-0" align="start">
			<!-- Matches the label as typed, as templUI's search did; never the value,
			     which is often an id. -->
			<Command.Root
				filter={(_, search, keywords) =>
					(keywords?.[0] ?? '').toLowerCase().includes(search.trim().toLowerCase()) ? 1 : 0}
			>
				{#if search}
					<Command.Input placeholder={searchPlaceholder || i18n.t('layout.search')} />
				{/if}
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
	{#if showClear}
		<button
			type="button"
			class="relative z-10 mr-8 -ml-14 inline-flex size-6 shrink-0 cursor-pointer items-center justify-center rounded-sm text-muted-foreground outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
			aria-label={i18n.t('layout.select.clear')}
			onclick={clear}
		>
			<CircleXIcon class="size-3.5" />
		</button>
	{/if}
</div>
