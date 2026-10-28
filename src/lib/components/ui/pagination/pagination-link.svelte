<script lang="ts">
	import { Button, type ButtonProps } from "#lib/components/ui/button/index.js";

	type Props = Omit<ButtonProps, "variant" | "size"> & {
		isActive?: boolean;
	};

	let {
		ref = $bindable(null),
		class: className,
		href,
		isActive = false,
		disabled = false,
		children,
		...restProps
	}: Props = $props();
</script>

<!-- templUI renders a disabled link as a plain disabled ghost button. -->
<Button
	bind:ref
	data-slot="pagination-link"
	data-active={isActive || undefined}
	aria-current={isActive ? "page" : undefined}
	href={disabled ? undefined : href}
	{disabled}
	size="icon"
	variant={!disabled && isActive ? "outline" : "ghost"}
	class={className}
	{...restProps}
>
	{@render children?.()}
</Button>
