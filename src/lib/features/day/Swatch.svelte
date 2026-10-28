<!--
	A tracker's colour beside a number (web/day cards.templ swatch). The colour
	is never the text: carb yellow and exercise lime fall to about 2:1 on a
	white card, so the figure stays in the foreground colour and the dot says
	which ring it belongs to.
-->
<script lang="ts">
	let { color }: { color: string } = $props();
</script>

<span class="inline-block size-2 shrink-0 rounded-full" style:background={color} aria-hidden="true"></span>
