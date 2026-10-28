<script lang="ts">
	import type { AuthOptions } from './options';

	// Google and passkey entry points above the password form. Filled in with
	// the auth surface; renders nothing while no optional method is enabled.
	let { options }: { options: AuthOptions; next?: string; mode: 'login' | 'register' } = $props();
</script>

{#if options.google || options.passkey}
	<div class="mb-4 space-y-3"></div>
{/if}
