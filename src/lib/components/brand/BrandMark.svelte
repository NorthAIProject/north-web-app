<script lang="ts">
	import { cn } from '#lib/utils.js';

	let { size = 'size-6', class: className = '' }: { size?: string; class?: string } = $props();
</script>

<img
	src="/assets/brand/khepri-logo-mark.png"
	alt=""
	width="32"
	height="32"
	class={cn('shrink-0 object-contain dark:rounded-full dark:bg-muted-foreground/60 dark:p-0.5', size, className)}
	decoding="async"
/>
