<script lang="ts" module>
	import { type VariantProps, tv } from "tailwind-variants";
	import { cn, type WithElementRef } from "#lib/utils.js";
	import type { HTMLAnchorAttributes, HTMLButtonAttributes } from "svelte/elements";

	export const buttonVariants = tv({
		// Matches templUI button (web/shared/ui/button/button.templ).
		base: "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background aria-invalid:ring-destructive aria-invalid:border-destructive cursor-pointer",
		variants: {
			variant: {
				// North: the primary action is signal, not the near-black --primary.
				default: "bg-signal text-signal-foreground shadow-xs hover:bg-signal-hover",
				destructive: "bg-destructive text-white shadow-xs hover:bg-destructive/90 focus-visible:ring-destructive dark:bg-destructive/60",
				outline: "border bg-background shadow-xs hover:bg-accent hover:text-accent-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50",
				secondary: "bg-secondary text-secondary-foreground shadow-xs hover:bg-secondary/80",
				ghost: "hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50",
				link: "text-primary underline-offset-4 hover:underline",
			},
			// Desktop keeps templUI's steps; a coarse pointer (a finger) gets the
			// 44 px minimum on every size, whatever a caller's class says.
			size: {
				default: "h-9 px-4 py-2 has-[>svg]:px-3 pointer-coarse:min-h-11",
				sm: "h-8 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5 pointer-coarse:min-h-11",
				lg: "h-10 rounded-md px-6 has-[>svg]:px-4 pointer-coarse:min-h-11",
				icon: "size-9 pointer-coarse:size-11",
				// Not in templUI; kept for shadcn compatibility, scaled to templUI's steps.
				xs: "h-7 rounded-md gap-1 px-2 text-xs has-[>svg]:px-1.5 [&_svg:not([class*='size-'])]:size-3.5 pointer-coarse:min-h-11",
				"icon-xs": "size-7 [&_svg:not([class*='size-'])]:size-3.5 pointer-coarse:size-11",
				"icon-sm": "size-8 pointer-coarse:size-11",
				"icon-lg": "size-10 pointer-coarse:size-11",
			},
		},
		defaultVariants: {
			variant: "default",
			size: "default",
		},
	});

	export type ButtonVariant = VariantProps<typeof buttonVariants>["variant"];
	export type ButtonSize = VariantProps<typeof buttonVariants>["size"];

	export type ButtonProps = WithElementRef<HTMLButtonAttributes> &
		WithElementRef<HTMLAnchorAttributes> & {
			variant?: ButtonVariant;
			size?: ButtonSize;
		};
</script>

<script lang="ts">
	let {
		class: className,
		variant = "default",
		size = "default",
		ref = $bindable(null),
		href = undefined,
		type = "button",
		disabled,
		children,
		...restProps
	}: ButtonProps = $props();
</script>

{#if href}
	<a
		bind:this={ref}
		data-slot="button"
		class={cn(buttonVariants({ variant, size }), className)}
		href={disabled ? undefined : href}
		aria-disabled={disabled}
		role={disabled ? "link" : undefined}
		tabindex={disabled ? -1 : undefined}
		{...restProps}
	>
		{@render children?.()}
	</a>
{:else}
	<button
		bind:this={ref}
		data-slot="button"
		class={cn(buttonVariants({ variant, size }), className)}
		{type}
		{disabled}
		{...restProps}
	>
		{@render children?.()}
	</button>
{/if}
