<script lang="ts">
	import { Switch as SwitchPrimitive } from "bits-ui";
	import { cn, type WithoutChildrenOrChild } from "#lib/utils.js";

	let {
		ref = $bindable(null),
		class: className,
		checked = $bindable(false),
		size = "default",
		...restProps
	}: WithoutChildrenOrChild<SwitchPrimitive.RootProps> & {
		size?: "sm" | "default";
	} = $props();
</script>

<!-- Matches templUI switch (web/shared/ui/switch/switch.templ). templUI draws the
     thumb with ::after; bits-ui renders a real Thumb element with the same classes. -->
<SwitchPrimitive.Root
	bind:ref
	bind:checked
	data-slot="switch"
	data-size={size}
	class={cn(
		"peer group/switch relative inline-flex shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors outline-none h-5 w-9 data-[size=sm]:h-4 data-[size=sm]:w-7",
		// North: off track at 80%/35% muted-foreground gives 3:1 on a card.
		"bg-muted-foreground/80 dark:bg-muted-foreground/35 data-[state=checked]:bg-primary dark:data-[state=checked]:bg-primary",
		"focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
		"data-disabled:cursor-not-allowed data-disabled:opacity-50",
		className
	)}
	{...restProps}
>
	<SwitchPrimitive.Thumb
		data-slot="switch-thumb"
		class="pointer-events-none block size-4 rounded-full bg-card shadow-xs ring-0 transition-transform group-data-[size=sm]/switch:size-3 data-[state=checked]:translate-x-4 group-data-[size=sm]/switch:data-[state=checked]:translate-x-3 data-[state=unchecked]:translate-x-0 rtl:data-[state=checked]:-translate-x-4"
	/>
</SwitchPrimitive.Root>
