<script lang="ts">
	import { Popover as PopoverPrimitive } from "bits-ui";
	import ClockIcon from "@lucide/svelte/icons/clock";
	import { Button } from "#lib/components/ui/button/index.js";
	import { cn } from "#lib/utils.js";

	type Props = {
		id?: string;
		class?: string;
		/** Hidden input name (defaults to the id). */
		name?: string;
		form?: string;
		/** 24-hour "HH:MM"; empty until both hour and minute are chosen. */
		value?: string;
		/** "HH:MM" bounds, inclusive. */
		minTime?: string;
		maxTime?: string;
		/** Minute step (default 1). */
		step?: number;
		use12Hours?: boolean;
		amLabel?: string;
		pmLabel?: string;
		placeholder?: string;
		doneLabel?: string;
		hourLabel?: string;
		minuteLabel?: string;
		disabled?: boolean;
		hasError?: boolean;
		open?: boolean;
		onValueChange?: (value: string) => void;
	};

	const uid = $props.id();

	let {
		id = uid,
		class: className,
		name,
		form,
		value = $bindable(""),
		minTime,
		maxTime,
		step = 1,
		use12Hours = false,
		amLabel = "AM",
		pmLabel = "PM",
		placeholder = "Select time",
		doneLabel = "Done",
		hourLabel = "Hour",
		minuteLabel = "Minute",
		disabled = false,
		hasError = false,
		open = $bindable(false),
		onValueChange,
	}: Props = $props();

	type HM = { hour: number; minute: number };

	function parseTime(str: string | undefined | null): HM | null {
		const m = str?.match(/^(\d{1,2}):(\d{2})$/);
		if (!m) return null;
		const hour = Number(m[1]);
		const minute = Number(m[2]);
		return hour >= 0 && hour <= 23 && minute >= 0 && minute <= 59 ? { hour, minute } : null;
	}

	const pad = (n: number) => n.toString().padStart(2, "0");

	let hour = $state<number | null>(null);
	let minute = $state<number | null>(null);

	// Pull external value changes into the picker state.
	$effect.pre(() => {
		const parsed = parseTime(value);
		const current = hour !== null && minute !== null ? `${pad(hour)}:${pad(minute)}` : "";
		if ((value ?? "") === current) return;
		hour = parsed?.hour ?? null;
		minute = parsed?.minute ?? null;
	});

	const min = $derived(parseTime(minTime));
	const max = $derived(parseTime(maxTime));
	const stepSize = $derived(step > 0 ? step : 1);

	function isValid(h: number, m: number | null) {
		if (!min && !max) return true;
		const t = h * 60 + (m ?? 0);
		if (min && t < min.hour * 60 + min.minute) return false;
		if (max && t > max.hour * 60 + max.minute) return false;
		return true;
	}

	function hourHasValidMinute(h: number) {
		for (let m = 0; m < 60; m++) if (isValid(h, m)) return true;
		return false;
	}

	function commit(h: number | null, m: number | null) {
		hour = h;
		minute = m;
		const next = h !== null && m !== null ? `${pad(h)}:${pad(m)}` : "";
		if (next !== value) {
			value = next;
			onValueChange?.(next);
		}
	}

	function setHourKeepingValid(h: number) {
		if (isValid(h, minute)) return commit(h, minute);
		for (let m = 0; m < 60; m += stepSize) if (isValid(h, m)) return commit(h, m);
	}

	function pickHour(listHour: number) {
		let h = listHour;
		if (use12Hours) {
			const isPM = hour !== null && hour >= 12;
			h = listHour === 0 ? (isPM ? 12 : 0) : isPM ? listHour + 12 : listHour;
		}
		setHourKeepingValid(h);
	}

	function pickPeriod(period: "AM" | "PM") {
		if (hour === null) return;
		let h = hour;
		if (period === "AM" && hour >= 12) h = hour === 12 ? 0 : hour - 12;
		else if (period === "PM" && hour < 12) h = hour === 0 ? 12 : hour + 12;
		if (h !== hour) setHourKeepingValid(h);
	}

	function isHourSelected(listHour: number) {
		if (hour === null) return false;
		if (!use12Hours) return listHour === hour;
		return listHour === hour || (listHour === 0 && hour === 12) || (hour > 12 && listHour === hour - 12);
	}

	const hours = $derived(use12Hours ? Array.from({ length: 12 }, (_, i) => i) : Array.from({ length: 24 }, (_, i) => i));
	const minutes = $derived.by(() => {
		const out: number[] = [];
		for (let m = 0; m < 60; m += stepSize) out.push(m);
		return out;
	});

	const display = $derived.by(() => {
		if (hour === null || minute === null) return null;
		if (use12Hours) {
			const h = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
			return `${pad(h)}:${pad(minute)} ${hour >= 12 ? pmLabel : amLabel}`;
		}
		return `${pad(hour)}:${pad(minute)}`;
	});

	const isAM = $derived(hour === null || hour < 12);

	const itemClass =
		"w-full px-2 py-1 text-sm rounded transition-colors text-left hover:bg-accent hover:text-accent-foreground data-[selected=true]:bg-primary data-[selected=true]:text-primary-foreground data-[selected=true]:hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed";
	const periodClass =
		"px-3 py-1 text-sm rounded-md border transition-colors hover:bg-accent hover:text-accent-foreground data-[active=true]:bg-primary data-[active=true]:text-primary-foreground data-[active=true]:hover:bg-primary/90";
</script>

<div class="relative inline-block w-full" data-slot="time-picker">
	<input type="hidden" name={name || id} value={value ?? ""} {form} />
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
					<span class={cn("text-left grow", !display && "text-muted-foreground")}>
						{display ?? placeholder}
					</span>
					<span class="text-muted-foreground flex items-center ml-2">
						<ClockIcon class="size-4" />
					</span>
				</Button>
			{/snippet}
		</PopoverPrimitive.Trigger>
		<PopoverPrimitive.Portal>
			<PopoverPrimitive.Content
				side="bottom"
				align="start"
				sideOffset={4}
				class="bg-popover rounded-lg border text-popover-foreground text-sm shadow-lg pointer-events-auto z-50 m-0 max-w-[min(24rem,calc(100vw-2rem))] overflow-visible outline-none p-0 w-80"
			>
				<div class="w-full overflow-hidden">
					<div class="w-full rounded-lg bg-card text-card-foreground">
						<div class="p-4">
							<div class="grid grid-cols-2 gap-3 mb-4">
								<div class="space-y-2">
									<span class="text-sm font-medium">{hourLabel}</span>
									<div class="max-h-32 overflow-y-auto border rounded-md bg-background">
										<div class="p-1 space-y-0.5" role="listbox" aria-label={hourLabel}>
											{#each hours as h (h)}
												<button
													type="button"
													role="option"
													aria-selected={isHourSelected(h)}
													data-selected={isHourSelected(h)}
													disabled={!hourHasValidMinute(h)}
													class={itemClass}
													onclick={() => pickHour(h)}
												>
													{use12Hours && h === 0 ? "12" : pad(h)}
												</button>
											{/each}
										</div>
									</div>
								</div>
								<div class="space-y-2">
									<span class="text-sm font-medium">{minuteLabel}</span>
									<div class="max-h-32 overflow-y-auto border rounded-md bg-background">
										<div class="p-1 space-y-0.5" role="listbox" aria-label={minuteLabel}>
											{#each minutes as m (m)}
												<button
													type="button"
													role="option"
													aria-selected={m === minute}
													data-selected={m === minute}
													disabled={hour !== null && !isValid(hour, m)}
													class={itemClass}
													onclick={() => commit(hour, m)}
												>
													{pad(m)}
												</button>
											{/each}
										</div>
									</div>
								</div>
							</div>
							<div class="flex justify-between items-center">
								{#if use12Hours}
									<div class="flex gap-1">
										<button type="button" data-active={isAM} class={periodClass} onclick={() => pickPeriod("AM")}>
											{amLabel}
										</button>
										<button type="button" data-active={!isAM} class={periodClass} onclick={() => pickPeriod("PM")}>
											{pmLabel}
										</button>
									</div>
								{:else}
									<div></div>
								{/if}
								<Button type="button" variant="secondary" size="sm" onclick={() => (open = false)}>
									{doneLabel}
								</Button>
							</div>
						</div>
					</div>
				</div>
			</PopoverPrimitive.Content>
		</PopoverPrimitive.Portal>
	</PopoverPrimitive.Root>
</div>
