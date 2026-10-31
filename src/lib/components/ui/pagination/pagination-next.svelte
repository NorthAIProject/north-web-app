<script lang="ts">
	import ChevronRightIcon from "@lucide/svelte/icons/chevron-right";
	import { Button, type ButtonProps } from "#lib/components/ui/button/index.js";
	import { cn } from "#lib/utils.js";
	import { useI18n } from "#lib/i18n/index.js";

	type Props = Omit<ButtonProps, "variant" | "size"> & { label?: string };

	let {
		ref = $bindable(null),
		class: className,
		href,
		disabled = false,
		label,
		...restProps
	}: Props = $props();

	const i18n = useI18n();
</script>

<Button
	bind:ref
	data-slot="pagination-next"
	aria-label={label ? undefined : i18n.t("layout.pagination.next")}
	href={disabled ? undefined : href}
	{disabled}
	variant="ghost"
	class={cn("gap-1", className)}
	{...restProps}
>
	{#if label}<span>{label}</span>{/if}
	<ChevronRightIcon class="size-4" />
</Button>
