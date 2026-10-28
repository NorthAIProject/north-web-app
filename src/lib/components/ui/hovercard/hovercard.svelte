<script lang="ts">
	import { LinkPreview as LinkPreviewPrimitive } from "bits-ui";

	let {
		open = $bindable(false),
		openDelay = 150,
		closeDelay = 300,
		...restProps
	}: LinkPreviewPrimitive.RootProps = $props();
</script>

<!-- templUI sets the hover delays on Content (150/300 ms); bits-ui takes them on Root. -->
<LinkPreviewPrimitive.Root bind:open {openDelay} {closeDelay} {...restProps} />
