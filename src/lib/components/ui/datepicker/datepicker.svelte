<script lang="ts">
	import { Popover as PopoverPrimitive } from "bits-ui";
	import CalendarIcon from "@lucide/svelte/icons/calendar";
	import { Button } from "#lib/components/ui/button/index.js";
	import { cn } from "#lib/utils.js";
	import Calendar from "./calendar.svelte";
	import { formatDate, parseISODate, type DateFormat } from "./date-utils.js";

	type Props = {
		id?: string;
		class?: string;
		/** Hidden input name (defaults to the id). */
		name?: string;
		/** Selected (or range start) date as yyyy-mm-dd. */
		value?: string;
		/** Range end as yyyy-mm-dd. */
		endValue?: string;
		/** Hidden input name for endValue (default `${name}-end`). */
		endName?: string;
		form?: string;
		format?: DateFormat;
		locale?: string;
		startOfWeek?: number;
		placeholder?: string;
		endPlaceholder?: string;
		disabled?: boolean;
		hasError?: boolean;
		mode?: "single" | "range";
		open?: boolean;
		onValueChange?: (detail: { start: string; end: string }) => void;
	};

	const uid = $props.id();

	let {
		id = uid,
		class: className,
		name,
		value = $bindable(""),
		endValue = $bindable(""),
		endName,
		form,
		format = "locale-medium",
		locale = "en-US",
		startOfWeek = 1,
		placeholder = "Select a date",
		endPlaceholder = "End date",
		disabled = false,
		hasError = false,
		mode = "single",
		open = $bindable(false),
		onValueChange,
	}: Props = $props();

	const inputName = $derived(name || id);
	const start = $derived(parseISODate(value));
	const display = $derived.by(() => {
		const s = start ? formatDate(start, format, locale) : placeholder;
		if (mode !== "range") return s;
		const e = parseISODate(endValue);
		return `${s} – ${e ? formatDate(e, format, locale) : endPlaceholder}`;
	});
</script>

<div class="relative inline-block w-full" data-slot="date-picker">
	<input type="hidden" name={inputName} value={value ?? ""} {form} />
	{#if mode === "range"}
		<input type="hidden" name={endName || `${inputName}-end`} value={endValue ?? ""} {form} />
	{/if}
	<PopoverPrimitive.Root bind:open>
		<PopoverPrimitive.Trigger {disabled}>
			{#snippet child({ props })}
				<Button
					{...props}
					{id}
					variant="outline"
					{disabled}
					aria-invalid={hasError ? "true" : undefined}
					class={cn(
						"w-full h-9 px-3 py-1 text-base md:text-sm",
						"flex items-center justify-between",
						"rounded-md border border-input bg-transparent shadow-xs transition-[color,box-shadow] outline-none",
						"dark:bg-input/30",
						"selection:bg-primary selection:text-primary-foreground",
						"focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
						"aria-invalid:ring-destructive/20 aria-invalid:border-destructive dark:aria-invalid:ring-destructive/40",
						hasError && "border-destructive ring-destructive/20 dark:ring-destructive/40",
						className,
					)}
				>
					<span class={cn("text-left grow", !start && "text-muted-foreground")}>{display}</span>
					<span class="text-muted-foreground flex items-center ml-2">
						<CalendarIcon class="size-4" />
					</span>
				</Button>
			{/snippet}
		</PopoverPrimitive.Trigger>
		<PopoverPrimitive.Portal>
			<PopoverPrimitive.Content
				side="bottom"
				align="start"
				sideOffset={4}
				class="bg-popover rounded-lg border text-popover-foreground text-sm shadow-lg pointer-events-auto z-50 m-0 max-w-[min(24rem,calc(100vw-2rem))] overflow-visible outline-none p-0"
			>
				<div class="w-full overflow-hidden">
					<div class="w-full rounded-lg bg-card text-card-foreground">
						<div class="p-3">
							<Calendar
								bind:value
								bind:endValue
								{mode}
								{locale}
								{startOfWeek}
								onSelect={(d) => {
									onValueChange?.({ start: d.start, end: d.end });
									if (d.mode === "single" || d.end) open = false;
								}}
							/>
						</div>
					</div>
				</div>
			</PopoverPrimitive.Content>
		</PopoverPrimitive.Portal>
	</PopoverPrimitive.Root>
</div>
