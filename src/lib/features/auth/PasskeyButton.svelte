<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { Button } from '#lib/components/ui/button/index.js';
	import { passkeyErrorMessage, passkeysSupported, runPasskey, type PasskeyMode } from './passkey.js';

	// The passkey entry point (Go: #passkey-btn + passkey.js). fields() reads
	// the email, name and timezone the page holds at the moment of the click,
	// the way passkey.js read #email and #display_name.
	let {
		mode,
		label,
		next = '',
		fields = () => ({}),
		onerror
	}: {
		mode: PasskeyMode;
		label: string;
		next?: string;
		fields?: () => { email?: string; displayName?: string; timezone?: string };
		onerror: (message: string) => void;
	} = $props();

	let supported = $state(true);
	let busy = $state(false);

	onMount(() => {
		supported = passkeysSupported();
	});

	async function start() {
		onerror('');
		busy = true;
		try {
			const destination = await runPasskey({ mode, next, ...fields() });
			// The session cookie was just set: reload the layout's user too.
			await goto(destination, { invalidateAll: true });
		} catch (err) {
			onerror(passkeyErrorMessage(err));
		} finally {
			busy = false;
		}
	}
</script>

<Button
	type="button"
	variant="outline"
	class="w-full"
	data-passkey-mode={mode}
	disabled={!supported || busy}
	title={supported ? undefined : 'Passkeys are not supported in this browser.'}
	onclick={start}
>
	{label}
</Button>
