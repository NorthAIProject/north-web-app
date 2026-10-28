<script lang="ts">
	import { Popover as PopoverPrimitive } from "bits-ui";
	import { Badge } from "#lib/components/ui/badge/index.js";
	import { cn, type WithElementRef } from "#lib/utils.js";
	import type { HTMLAttributes } from "svelte/elements";

	type Props = WithElementRef<Omit<HTMLAttributes<HTMLDivElement>, "id">> & {
		/** ID of the text input; the container gets `${id}-container`. */
		id?: string;
		value?: string[];
		name?: string;
		form?: string;
		placeholder?: string;
		hasError?: boolean;
		disabled?: boolean;
		readonly?: boolean;
		suggestions?: string[];
		onValueChange?: (value: string[]) => void;
	};

	const uid = $props.id();

	let {
		ref = $bindable(null),
		class: className,
		id = uid,
		value = $bindable([]),
		name,
		form,
		placeholder,
		hasError = false,
		disabled = false,
		readonly = false,
		suggestions = [],
		onValueChange,
		...restProps
	}: Props = $props();

	let inputEl = $state<HTMLInputElement | null>(null);
	let anchorEl = $state<HTMLDivElement | null>(null);
	let query = $state("");
	let focused = $state(false);
	let highlighted = $state(0);
	let dismissed = $state(false);

	const selectedLower = $derived(value.map((v) => v.toLowerCase()));
	const visible = $derived.by(() => {
		const q = query.toLowerCase().trim();
		return suggestions.filter((s) => {
			const v = s.toLowerCase();
			return !selectedLower.includes(v) && v.includes(q);
		});
	});
	const open = $derived(focused && !dismissed && !disabled && visible.length > 0);

	function setValue(next: string[]) {
		value = next;
		onValueChange?.(next);
	}

	function addTag(raw: string) {
		const val = raw.trim();
		if (!val || disabled || readonly) return;
		if (!selectedLower.includes(val.toLowerCase())) setValue([...value, val]);
		query = "";
		highlighted = 0;
		dismissed = false;
	}

	function removeAt(index: number) {
		if (disabled) return;
		setValue(value.filter((_, i) => i !== index));
	}

	function onkeydown(e: KeyboardEvent) {
		if (e.key === "ArrowDown" && open) {
			e.preventDefault();
			highlighted = (highlighted + 1) % visible.length;
		} else if (e.key === "ArrowUp" && open) {
			e.preventDefault();
			highlighted = (highlighted - 1 + visible.length) % visible.length;
		} else if (e.key === "Enter") {
			e.preventDefault();
			addTag(open && visible[highlighted] ? visible[highlighted] : query);
		} else if (e.key === ",") {
			e.preventDefault();
			addTag(query);
		} else if (e.key === "Escape" && open) {
			e.preventDefault();
			dismissed = true;
		} else if (e.key === "Backspace" && query === "" && value.length > 0) {
			removeAt(value.length - 1);
		}
	}

	$effect(() => {
		// Keep the highlight on the first match when the filtered list changes.
		void visible;
		highlighted = 0;
	});
</script>

<!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
<div
	bind:this={ref}
	id={`${id}-container`}
	data-slot="tags-input"
	class={cn(
		"flex flex-col gap-2 p-2 rounded-md border border-input bg-transparent shadow-xs transition-[color,box-shadow] outline-none",
		"dark:bg-input/30",
		"focus-within:border-ring focus-within:ring-ring/50 focus-within:ring-[3px]",
		disabled && "opacity-50 cursor-not-allowed",
		"w-full",
		hasError && "border-destructive ring-destructive/20 dark:ring-destructive/40",
		className,
	)}
	onclick={(e) => {
		if (!(e.target as HTMLElement).closest("input, button")) inputEl?.focus();
	}}
	{...restProps}
>
	{#if value.length > 0}
		<div class="flex flex-wrap gap-2" data-slot="tags-input-chips">
			{#each value as tag, i (tag)}
				<Badge data-slot="tags-input-chip">
					<span>{tag}</span>
					<button
						type="button"
						class="ml-1 text-current hover:text-destructive disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
						aria-label={`Remove ${tag}`}
						{disabled}
						onclick={() => removeAt(i)}
					>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							class="h-3 w-3 pointer-events-none"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
							stroke-width="2"
						>
							<path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"></path>
						</svg>
					</button>
				</Badge>
			{/each}
		</div>
	{/if}

	<div class="relative w-full" bind:this={anchorEl}>
		<input
			bind:this={inputEl}
			bind:value={query}
			{id}
			type="text"
			{placeholder}
			{disabled}
			{readonly}
			autocomplete="off"
			role={suggestions.length > 0 ? "combobox" : undefined}
			aria-expanded={suggestions.length > 0 ? open : undefined}
			aria-autocomplete={suggestions.length > 0 ? "list" : undefined}
			aria-invalid={hasError || undefined}
			class="flex w-full min-w-0 border-0 bg-transparent px-0 py-0 h-auto min-h-0 rounded-none text-base shadow-none outline-none transition-[color,box-shadow] md:text-sm placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-100 focus-visible:ring-0 dark:bg-transparent"
			onfocus={() => {
				focused = true;
				dismissed = false;
			}}
			onblur={() => (focused = false)}
			oninput={() => (dismissed = false)}
			onclick={() => (dismissed = false)}
			{onkeydown}
		/>
	</div>

	{#if suggestions.length > 0}
		<PopoverPrimitive.Root {open}>
			<PopoverPrimitive.Portal>
				<PopoverPrimitive.Content
					customAnchor={anchorEl}
					side="bottom"
					align="start"
					sideOffset={4}
					trapFocus={false}
					onOpenAutoFocus={(e) => e.preventDefault()}
					onCloseAutoFocus={(e) => e.preventDefault()}
					interactOutsideBehavior="ignore"
					data-slot="tags-input-suggestions"
					class="bg-popover rounded-lg border text-popover-foreground text-sm shadow-lg z-50 outline-none p-1 max-h-[200px] overflow-y-auto min-w-(--bits-popover-anchor-width) w-(--bits-popover-anchor-width)"
				>
					{#each visible as suggestion, i (suggestion)}
						<!-- svelte-ignore a11y_click_events_have_key_events -->
						<div
							role="option"
							tabindex="-1"
							aria-selected={i === highlighted}
							class={cn(
								"relative flex w-full cursor-pointer select-none items-center rounded-sm py-1.5 px-2 text-sm outline-none hover:bg-accent hover:text-accent-foreground",
								i === highlighted && "bg-accent",
							)}
							onmousedown={(e) => {
								e.preventDefault();
								addTag(suggestion);
							}}
						>
							{suggestion}
						</div>
					{/each}
				</PopoverPrimitive.Content>
			</PopoverPrimitive.Portal>
		</PopoverPrimitive.Root>
	{/if}

	{#if name}
		<div class="hidden">
			{#each value as tag (tag)}
				<input type="hidden" {name} {form} value={tag} />
			{/each}
		</div>
	{/if}
</div>
