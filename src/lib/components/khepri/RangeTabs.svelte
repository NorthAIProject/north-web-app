<!--
	The one period (or filter) selector the "how am I doing" pages share:
	overview, insights, recap and the timeline's kind filter.

	Built on ui/toggle-group, so bits-ui gives it one tab stop, arrow keys
	between options and radio semantics. Each option is still a real link to
	its URL (?range=, ?kind=): without JavaScript it is an ordinary link, and a
	modified click opens it in a new tab. With JavaScript a click, Enter or
	Space navigates client-side without resetting scroll or focus (reset:
	false), and the page's load refetches.

	It sits in a <nav> named by `label`, and the selected link keeps
	aria-current alongside the radio's aria-checked.

	The selected option comes from the URL the page was loaded with; the group
	never holds a selection of its own, so clicking the current option does
	nothing rather than clearing it.
-->
<script lang="ts" module>
	export type RangeOption = { key: string; label: string; count?: number };
</script>

<script lang="ts">
	import { goto } from '$app/navigation';
	import { ToggleGroup, ToggleGroupItem } from '#lib/components/ui/toggle-group/index.js';
	import { cn } from '#lib/utils.js';

	let {
		label,
		value,
		options,
		hrefFor,
		wrap = false,
		class: className = ''
	}: {
		/** The landmark's accessible name ("Time period"). */
		label: string;
		/** The selected option's key. */
		value: string;
		options: RangeOption[];
		/** The URL an option navigates to. */
		hrefFor: (key: string) => string;
		/** Wrap onto more lines instead of scrolling sideways (long filter lists). */
		wrap?: boolean;
		class?: string;
	} = $props();

	// The group's values are option positions, not keys: a key may be empty
	// (the timeline's "Everything" is ?kind= unset), and bits-ui reads an empty
	// value as "nothing selected".
	const current = $derived(String(options.findIndex((o) => o.key === value)));

	function select(index: string) {
		// An empty value is the group trying to clear the current option: ignore it.
		const o = index === '' ? undefined : options[Number(index)];
		if (!o || o.key === value) return;
		void goto(hrefFor(o.key), { reset: false });
	}

	function modified(e: MouseEvent) {
		return e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey;
	}
</script>

<nav aria-label={label} class={cn('max-w-full min-w-0', className)}>
	<ToggleGroup
		type="single"
		bind:value={() => current, select}
		spacing={1}
		class={cn(
			'border-hairline bg-surface/60 max-w-full shrink-0 rounded-lg border p-1',
			wrap ? 'flex-wrap' : 'overflow-x-auto'
		)}
		data-testid="range-tabs"
	>
		{#each options as o, i (o.key)}
			{@const selected = o.key === value}
			<ToggleGroupItem
				value={String(i)}
				class={cn(
					'text-muted-foreground h-8 gap-1.5 rounded-md px-3 text-xs font-medium whitespace-nowrap transition-colors pointer-coarse:min-h-11',
					'hover:bg-accent/60 hover:text-foreground',
					'data-[state=on]:bg-signal data-[state=on]:text-signal-foreground data-[state=on]:hover:bg-signal data-[state=on]:hover:text-signal-foreground',
					'focus-visible:ring-ring focus-visible:ring-offset-background focus-visible:ring-2 focus-visible:ring-offset-2'
				)}
			>
				{#snippet child({ props })}
					<a
						{...props}
						href={hrefFor(o.key)}
						data-sveltekit-reset="false"
						aria-current={selected ? 'true' : undefined}
						onclick={(e) => {
							// Let the browser open a new tab or window; otherwise the group navigates.
							if (modified(e)) return;
							e.preventDefault();
							(props.onclick as ((e: MouseEvent) => void) | undefined)?.(e);
						}}
					>
						{o.label}
						{#if o.count !== undefined}
							<span class={['tabular-nums', !selected && 'text-muted-foreground']}>{o.count}</span>
						{/if}
					</a>
				{/snippet}
			</ToggleGroupItem>
		{/each}
	</ToggleGroup>
</nav>
