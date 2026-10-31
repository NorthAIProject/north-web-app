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
	aria-label={i18n.t("layout.pagination")}
	data-slot="pagination"
	class={cn("flex flex-wrap justify-center", className)}
	{...restProps}
>
	{@render children?.()}
</nav>
