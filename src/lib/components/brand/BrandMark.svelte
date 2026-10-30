<!--
	The Khepri emblem at UI sizes (16–32 px): the silhouette cut, whose
	contours survive at that scale. Gold wings on the dark shell, navy wings
	on ivory, where Solar Gold washes out. docs/brand/README.md has the rules.
-->
<script lang="ts">
	import { cn } from '#lib/utils.js';

	let { size = 'size-6', class: className = '' }: { size?: string; class?: string } = $props();
</script>

<img
	src="/assets/brand/solar/khepri-emblem-small-light.svg"
	alt=""
	width="32"
	height="32"
	class={cn('shrink-0 object-contain dark:hidden', size, className)}
	decoding="async"
/>
<img
	src="/assets/brand/solar/khepri-emblem-small.svg"
	alt=""
	width="32"
	height="32"
	class={cn('hidden shrink-0 object-contain dark:block', size, className)}
	decoding="async"
/>
