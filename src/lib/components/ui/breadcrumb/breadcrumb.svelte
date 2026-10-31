<script lang="ts">
	import { cn, type WithElementRef } from "#lib/utils.js";
	import type { HTMLAttributes } from "svelte/elements";
	import { useI18n } from "#lib/i18n/index.js";

	let {
		ref = $bindable(null),
		class: className,
		children,
		...restProps
	}: WithElementRef<HTMLAttributes<HTMLElement>> = $props();

	const i18n = useI18n();
</script>

<nav
	bind:this={ref}
	data-slot="breadcrumb"
	class={cn("flex", className)}
	aria-label={i18n.t("layout.breadcrumb")}
	{...restProps}
>
	{@render children?.()}
</nav>
