<script lang="ts">
	import { cn } from '#lib/utils.js';

	let { text, class: className = '' }: { text: string; class?: string } = $props();
</script>

<span class={cn('font-mono text-xs uppercase tracking-[0.08em] text-muted-foreground', className)}>{text}</span>
