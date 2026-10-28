<script lang="ts">
	import { cn } from '#lib/utils.js';

	let { text, class: className = '' }: { text: string; class?: string } = $props();
</script>

<span class={cn('font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground', className)}>{text}</span>
