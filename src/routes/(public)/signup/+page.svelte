<script lang="ts">
	import { onMount } from 'svelte';
	import { enhance } from '$app/forms';
	import AuthShell from '#lib/components/layout/AuthShell.svelte';
	import * as Alert from '#lib/components/ui/alert/index.js';
	import { Button } from '#lib/components/ui/button/index.js';
	import * as Card from '#lib/components/ui/card/index.js';
	import { Input } from '#lib/components/ui/input/index.js';
	import AltAuthButtons from '#lib/features/auth/AltAuthButtons.svelte';
	import ConsentNotice from '#lib/features/auth/ConsentNotice.svelte';
	import FormField from '#lib/features/auth/FormField.svelte';
	import OrDivider from '#lib/features/auth/OrDivider.svelte';
	import PasskeyButton from '#lib/features/auth/PasskeyButton.svelte';
	import { useI18n } from '#lib/i18n/index.js';
	import type { PageProps } from './$types';

	// Go: web/auth/signup.templ.
	let { data, form }: PageProps = $props();
	const i18n = useI18n();

	let submitting = $state(false);
	let passkeyError = $state('');
	// svelte-ignore state_referenced_locally
	let displayName = $state(form?.values?.display_name ?? '');
	// svelte-ignore state_referenced_locally
	let email = $state(form?.values?.email ?? '');
	// svelte-ignore state_referenced_locally
	let timezone = $state(form?.values?.timezone ?? '');

	const errors = $derived<Record<string, string>>(form?.errors ?? {});

	// The browser reports the visitor's IANA zone, so a daily briefing lands at
	// their 07:00 without asking. The server falls back to UTC without it.
	onMount(() => {
		timezone ||= Intl.DateTimeFormat().resolvedOptions().timeZone;
	});
</script>

<AuthShell title={i18n.t('auth.signup.title')}>
	<Card.Root>
		<Card.Header>
			<Card.Title>{i18n.t('auth.signup.title')}</Card.Title>
			<Card.Description>{i18n.t('auth.signup.desc')}</Card.Description>
		</Card.Header>
		<Card.Content>
			{#if form?.error}
				<Alert.Root variant="destructive" class="mb-4">
					<Alert.Description>{form.error}</Alert.Description>
				</Alert.Root>
			{/if}
			<AltAuthButtons options={data.authOptions} passkey={false} />
			<form
				method="post"
				class="space-y-4"
				id="signup-form"
				use:enhance={() => {
					submitting = true;
					return async ({ update }) => {
						await update({ reset: false });
						submitting = false;
					};
				}}
			>
				<input type="hidden" name="timezone" id="timezone" value={timezone} />
				<FormField id="display_name" label={i18n.t('auth.field.name')} error={errors.display_name}>
					<!-- svelte-ignore a11y_autofocus -->
					<Input
						id="display_name"
						name="display_name"
						bind:value={displayName}
						required
						autocomplete="name"
						autofocus
						aria-invalid={errors.display_name ? true : undefined}
					/>
				</FormField>
				<FormField id="email" label={i18n.t('auth.field.email')} error={errors.email}>
					<Input
						id="email"
						name="email"
						type="email"
						bind:value={email}
						required
						autocomplete="email"
						aria-invalid={errors.email ? true : undefined}
					/>
				</FormField>
				{#if data.authOptions.passkey}
					<PasskeyButton
						mode="register"
						label={i18n.t('auth.signup.passkey')}
						fields={() => ({ email, displayName, timezone })}
						onerror={(message) => (passkeyError = message)}
					/>
					<OrDivider label={i18n.t('auth.signup.orpassword')} />
				{/if}
				<FormField
					id="password"
					label={i18n.t('auth.field.password')}
					error={errors.password}
					hint={i18n.t('auth.password.hint')}
				>
					<Input
						id="password"
						name="password"
						type="password"
						required
						autocomplete="new-password"
						aria-invalid={errors.password ? true : undefined}
					/>
				</FormField>
				<FormField id="password_confirmation" label={i18n.t('auth.field.confirm')} error={errors.password_confirmation}>
					<Input
						id="password_confirmation"
						name="password_confirmation"
						type="password"
						required
						autocomplete="new-password"
						aria-invalid={errors.password_confirmation ? true : undefined}
					/>
				</FormField>
				<Button type="submit" class="w-full bg-signal text-background hover:bg-signal/90" disabled={submitting}>
					{i18n.t('auth.signup.submit')}
				</Button>
				<ConsentNotice />
			</form>
			{#if passkeyError}
				<p id="passkey-error" class="mt-3 text-sm text-destructive" role="alert">{passkeyError}</p>
			{/if}
		</Card.Content>
	</Card.Root>
	<p class="mt-6 text-center text-sm text-muted-foreground">
		{i18n.t('auth.signup.have')}
		<a href="/login" class="font-medium text-foreground underline underline-offset-4">{i18n.t('auth.signin.submit')}</a>
	</p>
</AuthShell>
