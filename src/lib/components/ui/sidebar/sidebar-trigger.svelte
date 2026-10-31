<script lang="ts">
	import PanelLeftIcon from '@lucide/svelte/icons/panel-left';
	import { Button } from "#lib/components/ui/button/index.js";
	import { cn } from "#lib/utils.js";
	import { useSidebar } from "./context.svelte.js";
	import type { ComponentProps } from "svelte";
	import { useI18n } from "#lib/i18n/index.js";

	let {
		ref = $bindable(null),
		class: className,
		onclick,
		...restProps
	}: ComponentProps<typeof Button> & {
		onclick?: (e: MouseEvent) => void;
	} = $props();

	const sidebar = useSidebar();
	const i18n = useI18n();
</script>

<Button
	bind:ref
	data-sidebar="trigger"
	data-slot="sidebar-trigger"
	variant="ghost"
	size="icon"
	class={cn("size-7", className)}
	type="button"
	onclick={(e) => {
		onclick?.(e);
		sidebar.toggle();
	}}
	{...restProps}
>
	<PanelLeftIcon class="size-4 rtl:rotate-180" />
	<span class="sr-only">{i18n.t("layout.sidebar.toggle")}</span>
</Button>
