<!--
	The solar-core loader: a sun at rest inside an arc that turns, the brand's
	one motion for "working". Inherits currentColor, so it takes the colour of
	the button or label it sits in. Under prefers-reduced-motion the arc holds
	still and the core stays lit. Decorative: the control it sits in says
	what is happening.
-->
<script lang="ts">
	import { cn } from '#lib/utils.js';

	let { class: className = '' }: { class?: string } = $props();
</script>

<svg viewBox="0 0 24 24" fill="none" aria-hidden="true" class={cn('size-4 shrink-0', className)}>
	<circle cx="12" cy="12" r="9" stroke="currentColor" stroke-opacity="0.2" stroke-width="2" />
	<path
		d="M12 3a9 9 0 0 1 9 9"
		stroke="currentColor"
		stroke-width="2"
		stroke-linecap="round"
		class="origin-center motion-safe:animate-spin"
	/>
	<circle cx="12" cy="12" r="3" fill="currentColor" class="motion-safe:animate-solar-core" />
</svg>
