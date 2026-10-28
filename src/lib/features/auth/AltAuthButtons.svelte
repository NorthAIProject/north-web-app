<script lang="ts">
	import { Button } from '#lib/components/ui/button/index.js';
	import { useI18n } from '#lib/i18n/index.js';
	import GoogleIcon from './GoogleIcon.svelte';
	import OrDivider from './OrDivider.svelte';
	import PasskeyButton from './PasskeyButton.svelte';
	import { googleHref, type AuthOptions } from './options.js';

	// Google and passkey entry points above the password form, with the "or"
	// divider when either is on (Go: altAuthButtons on the login page; the
	// signup page shows Google here and its passkey button inside the form).
	let {
		options,
		next = '',
		passkey = true,
		fields = () => ({}),
		onpasskeyerror = () => {}
	}: {
		options: AuthOptions;
		next?: string;
		/** False on signup, which places its register button among the fields. */
		passkey?: boolean;
		/** What the page's form holds when the passkey button is pressed. */
		fields?: () => { email?: string };
		onpasskeyerror?: (message: string) => void;
	} = $props();
	const i18n = useI18n();

	const showPasskey = $derived(passkey && options.passkey);
</script>

{#if options.google || showPasskey}
	<div class="mb-4 space-y-3">
		{#if options.google}
			<Button href={googleHref(next)} variant="outline" class="w-full" data-sveltekit-reload>
				<GoogleIcon />
				{i18n.t('auth.alt.google')}
			</Button>
		{/if}
		{#if showPasskey}
			<PasskeyButton mode="login" label={i18n.t('auth.alt.passkey')} {next} {fields} onerror={onpasskeyerror} />
		{/if}
		<OrDivider label={i18n.t('auth.alt.or')} />
	</div>
{/if}
