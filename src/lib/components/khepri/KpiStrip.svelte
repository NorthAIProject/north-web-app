<!-- The strip KpiCells sit in (north-client ui.KpiStrip). -->
<script lang="ts">
	import type { Snippet } from 'svelte';

	let { children }: { children?: Snippet } = $props();
</script>

<div class="border-hairline bg-surface/60 grid gap-3 rounded-lg border p-4 sm:grid-cols-2 lg:grid-cols-5">
	{@render children?.()}
</div>
