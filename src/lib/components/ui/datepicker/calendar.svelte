<script lang="ts">
	import ChevronLeftIcon from "@lucide/svelte/icons/chevron-left";
	import ChevronRightIcon from "@lucide/svelte/icons/chevron-right";
	import ChevronDownIcon from "@lucide/svelte/icons/chevron-down";
	import { cn, type WithElementRef } from "#lib/utils.js";
	import type { HTMLAttributes } from "svelte/elements";
	import { dayNames, monthNames, parseISODate, toISODate } from "./date-utils.js";

	type Props = WithElementRef<HTMLAttributes<HTMLDivElement>> & {
		/** Selected (or range start) date as yyyy-mm-dd. */
		value?: string;
		/** Range end date as yyyy-mm-dd (range mode only). */
		endValue?: string;
		mode?: "single" | "range";
		/** BCP 47 locale for month/weekday names. */
		locale?: string;
		/** 0-6, Sunday-Saturday (default 1, Monday). */
		startOfWeek?: number;
		/** Hidden input names; omit to render no hidden inputs. */
		name?: string;
		endName?: string;
		onSelect?: (detail: { mode: "single" | "range"; start: string; end: string }) => void;
	};

	let {
		ref = $bindable(null),
		class: className,
		value = $bindable(""),
		endValue = $bindable(""),
		mode = "single",
		locale = "en-US",
		startOfWeek = 1,
		name,
		endName,
		onSelect,
		...restProps
	}: Props = $props();

	const initial = parseISODate(value) ?? new Date();
	let viewMonth = $state(parseISODate(value) ? initial.getUTCMonth() : initial.getMonth());
	let viewYear = $state(parseISODate(value) ? initial.getUTCFullYear() : initial.getFullYear());
	let hoverEnd = $state<string | null>(null);

	const months = $derived(monthNames(locale));
	const weekdays = $derived(dayNames(locale, startOfWeek));
	const years = Array.from({ length: 201 }, (_, i) => 2100 - i);

	const start = $derived(parseISODate(value));
	const end = $derived(mode === "range" ? parseISODate(endValue) : null);

	const visual = $derived.by(() => {
		let s = start;
		let e = end;
		const h = parseISODate(hoverEnd);
		if (mode === "range" && s && !e && h) {
			if (h.getTime() < s.getTime()) [s, e] = [h, s];
			else e = h;
		}
		return { s: s?.getTime() ?? null, e: e?.getTime() ?? null };
	});

	const offset = $derived(
		(((new Date(Date.UTC(viewYear, viewMonth, 1)).getUTCDay() - startOfWeek) % 7) + 7) % 7,
	);
	const daysInMonth = $derived(new Date(Date.UTC(viewYear, viewMonth + 1, 0)).getUTCDate());

	function todayUTC() {
		const t = new Date();
		return Date.UTC(t.getFullYear(), t.getMonth(), t.getDate());
	}

	function shiftMonth(delta: number) {
		let m = viewMonth + delta;
		let y = viewYear;
		if (m < 0) {
			m = 11;
			y--;
		} else if (m > 11) {
			m = 0;
			y++;
		}
		viewMonth = m;
		viewYear = y;
	}

	function select(day: number) {
		const clicked = new Date(Date.UTC(viewYear, viewMonth, day));
		if (mode === "range") {
			if (start && !end) {
				if (clicked.getTime() < start.getTime()) {
					value = toISODate(clicked);
					endValue = toISODate(start);
				} else {
					endValue = toISODate(clicked);
				}
			} else {
				value = toISODate(clicked);
				endValue = "";
			}
		} else {
			value = toISODate(clicked);
		}
		hoverEnd = null;
		onSelect?.({ mode, start: value, end: mode === "range" ? endValue : "" });
	}

	function dayClass(day: number) {
		const t = Date.UTC(viewYear, viewMonth, day);
		const isEdge = t === visual.s || (mode === "range" && t === visual.e);
		const inRange = mode === "range" && visual.s !== null && visual.e !== null && t > visual.s && t < visual.e;
		return cn(
			"inline-flex h-[var(--cell-size)] w-[var(--cell-size)] items-center justify-center rounded-md text-sm font-medium focus:outline-none focus:ring-1 focus:ring-ring",
			isEdge
				? "bg-primary text-primary-foreground hover:bg-primary/90"
				: inRange
					? "bg-primary/20 text-foreground hover:bg-primary/30"
					: t === todayUTC()
						? "bg-accent text-accent-foreground"
						: "hover:bg-accent hover:text-accent-foreground",
		);
	}

	const navButton =
		"inline-flex items-center justify-center rounded-md text-sm font-medium h-7 w-7 hover:bg-accent hover:text-accent-foreground focus:outline-none disabled:opacity-50 shrink-0";
	const selectBox =
		"relative flex-1 has-[:focus]:border-ring border border-input shadow-xs has-[:focus]:ring-ring/50 has-[:focus]:ring-[3px] rounded-md";
	const selectLabel =
		"select-none font-medium rounded-md px-2 flex items-center justify-center gap-1 text-sm h-7 pointer-events-none";
</script>

<div
	bind:this={ref}
	data-slot="calendar"
	class={cn("inline-flex flex-col [--cell-size:2rem]", className)}
	{...restProps}
>
	{#if name}
		<input type="hidden" {name} value={value ?? ""} />
		{#if mode === "range"}
			<input type="hidden" name={endName ?? `${name}-end`} value={endValue ?? ""} />
		{/if}
	{/if}
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div class="inline-flex flex-col" onmouseleave={() => (hoverEnd = null)}>
		<div class="flex w-full items-center gap-2 mb-4">
			<button type="button" class={navButton} aria-label="Previous month" onclick={() => shiftMonth(-1)}>
				<ChevronLeftIcon />
			</button>
			<div class="flex gap-2 flex-1 min-w-0">
				<div class={selectBox}>
					<select
						class="absolute inset-0 opacity-0 cursor-pointer w-full bg-card"
						aria-label="Choose the Month"
						value={viewMonth}
						onchange={(e) => (viewMonth = parseInt(e.currentTarget.value, 10))}
					>
						{#each months as m, i (i)}
							<option value={i}>{m}</option>
						{/each}
					</select>
					<span class={selectLabel} aria-hidden="true">
						<span>{months[viewMonth]}</span>
						<ChevronDownIcon class="size-3.5 text-muted-foreground" />
					</span>
				</div>
				<div class={selectBox}>
					<select
						class="absolute inset-0 opacity-0 cursor-pointer w-full bg-card"
						aria-label="Choose the Year"
						value={viewYear}
						onchange={(e) => (viewYear = parseInt(e.currentTarget.value, 10))}
					>
						{#each years as y (y)}
							<option value={y}>{y}</option>
						{/each}
					</select>
					<span class={selectLabel} aria-hidden="true">
						<span>{viewYear}</span>
						<ChevronDownIcon class="size-3.5 text-muted-foreground" />
					</span>
				</div>
			</div>
			<button type="button" class={navButton} aria-label="Next month" onclick={() => shiftMonth(1)}>
				<ChevronRightIcon />
			</button>
		</div>
		<div class="inline-grid grid-cols-[repeat(7,var(--cell-size))] gap-1 mb-1 place-items-center">
			{#each weekdays as d, i (i)}
				<div class="text-center text-xs text-muted-foreground font-medium">{d}</div>
			{/each}
		</div>
		<div class="inline-grid grid-cols-[repeat(7,var(--cell-size))] gap-1 place-items-center">
			{#each { length: offset }, i (i)}
				<div class="h-[var(--cell-size)] w-[var(--cell-size)]"></div>
			{/each}
			{#each { length: daysInMonth }, i (i)}
				{@const day = i + 1}
				{@const iso = toISODate(new Date(Date.UTC(viewYear, viewMonth, day)))}
				<button
					type="button"
					class={dayClass(day)}
					data-day={iso}
					aria-pressed={iso === value || (mode === "range" && iso === endValue)}
					onclick={() => select(day)}
					onmouseover={() => {
						if (mode === "range" && start && !end) hoverEnd = iso;
					}}
					onfocus={() => {
						if (mode === "range" && start && !end) hoverEnd = iso;
					}}
				>
					{day}
				</button>
			{/each}
		</div>
	</div>
</div>
