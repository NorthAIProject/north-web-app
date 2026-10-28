<script lang="ts">
	import EllipsisIcon from "@lucide/svelte/icons/ellipsis";
	import { cn } from "#lib/utils.js";

	let { class: className }: { class?: string } = $props();
</script>

<EllipsisIcon data-slot="pagination-ellipsis" aria-hidden="true" class={cn("size-4", className)} />
