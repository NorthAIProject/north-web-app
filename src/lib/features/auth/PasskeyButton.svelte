<script lang="ts">
	import { onMount } from 'svelte';
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

	// What the page holds at the click. Like passkey.js, read #email and
	// #display_name off the DOM first: that catches text typed or autofilled
	// before hydration, which the page's bound state never saw.
	function current() {
		const given = fields();
		const value = (id: string) =>
			(document.getElementById(id) as HTMLInputElement | null)?.value.trim() || undefined;
		return {
			email: value('email') ?? given.email,
			displayName: value('display_name') ?? given.displayName,
			timezone: given.timezone || value('timezone')
		};
	}

	async function start() {
		onerror('');
		busy = true;
		try {
			const destination = await runPasskey({ mode, next, ...current() });
			// The session cookie was just set, so load the next page in full, as
			// passkey.js did. goto() cannot: the consent screen's way back
			// (/oauth/authorize/resume) is an endpoint, not a page.
			window.location.assign(destination);
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
