<script lang="ts">
	import StarIcon from "@lucide/svelte/icons/star";
	import HeartIcon from "@lucide/svelte/icons/heart";
	import AngryIcon from "@lucide/svelte/icons/angry";
	import FrownIcon from "@lucide/svelte/icons/frown";
	import MehIcon from "@lucide/svelte/icons/meh";
	import SmileIcon from "@lucide/svelte/icons/smile";
	import LaughIcon from "@lucide/svelte/icons/laugh";
	import { cn, type WithElementRef } from "#lib/utils.js";
	import type { HTMLAttributes } from "svelte/elements";
	import { getRatingContext, type RatingStyle } from "./context.svelte.js";

	type Props = WithElementRef<HTMLAttributes<HTMLDivElement>> & {
		value: number;
		style?: RatingStyle;
	};

	let {
		ref = $bindable(null),
		class: className,
		value,
		style = "star",
		...restProps
	}: Props = $props();

	const rating = getRatingContext();

	$effect(() => rating.register(value));

	// Theme tokens, not the palette: gold stars and faces read 3:1 or more on
	// a card in both themes; hearts stay destructive red.
	const colorClass = $derived(style === "heart" ? "text-destructive" : "text-signal");

	const FilledEmoji = $derived(
		value <= 1 ? AngryIcon : value <= 2 ? FrownIcon : value <= 3 ? MehIcon : value <= 4 ? SmileIcon : LaughIcon,
	);
	const Shape = $derived(style === "heart" ? HeartIcon : StarIcon);
</script>

<div
	bind:this={ref}
	data-slot="rating-item"
	data-value={value}
	role="button"
	tabindex={rating.readonly ? -1 : 0}
	aria-label={`${value}`}
	aria-pressed={rating.value >= value}
	aria-disabled={rating.readonly || undefined}
	class={cn(
		"relative transition-opacity",
		colorClass,
		rating.readonly ? "cursor-default" : "cursor-pointer",
		className,
	)}
	onclick={() => rating.select(value)}
	onkeydown={(e) => {
		if (e.key === "Enter" || e.key === " ") {
			e.preventDefault();
			rating.select(value);
		}
	}}
	onmouseover={() => rating.hover(value)}
	onfocus={() => rating.hover(value)}
	onblur={() => rating.leave()}
	{...restProps}
>
	<div class="opacity-30">
		{#if style === "emoji"}
			<MehIcon />
		{:else}
			<Shape />
		{/if}
	</div>
	<div class="absolute inset-0 overflow-hidden" style:width={`${rating.fillPercent(value)}%`}>
		{#if style === "emoji"}
			<FilledEmoji />
		{:else}
			<Shape class="fill-current" />
		{/if}
	</div>
</div>
