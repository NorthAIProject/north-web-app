<!--
	A section's position on the bearing line. The labels are distances rather
	than an ordered list, which is why they are not 01 / 02 / 03.
-->
<script lang="ts">
	import MonoLabel from '#lib/components/khepri/MonoLabel.svelte';

	let { distance }: { distance: string } = $props();
</script>

<div aria-hidden="true" class="absolute -left-[4.5rem] top-14 hidden lg:block">
	<div class="-ml-[3px] flex items-center gap-2">
		<span class="size-1.5 rounded-full bg-signal"></span>
		<MonoLabel text={distance} />
	</div>
</div>
