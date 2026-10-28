<!--
	The marketing layout (north-client layout.Public): top navigation and a
	full-height content area. Not signed-out-only — `/` renders for everyone —
	so the navbar swaps its calls to action for a signed-in visitor.
-->
<script lang="ts">
	import Navbar from '#lib/components/khepri/Navbar.svelte';
	import type { LayoutProps } from './$types';

	let { data, children }: LayoutProps = $props();
</script>

<div class="flex h-full flex-col">
	<Navbar signedIn={Boolean(data.user)} />
	<main class="flex-1">
		{@render children()}
	</main>
</div>
