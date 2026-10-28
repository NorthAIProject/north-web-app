<script lang="ts">
	import { enhance } from '$app/forms';
	import AuthShell from '#lib/components/layout/AuthShell.svelte';
	import * as Alert from '#lib/components/ui/alert/index.js';
	import { Button } from '#lib/components/ui/button/index.js';
	import * as Card from '#lib/components/ui/card/index.js';
	import { Input } from '#lib/components/ui/input/index.js';
	import FormField from '#lib/features/auth/FormField.svelte';
	import { useI18n } from '#lib/i18n/index.js';
	import type { PageProps } from './$types';

	// Go: web/auth/forgot_password.templ.
	let { form }: PageProps = $props();
	const i18n = useI18n();
	let submitting = $state(false);

	const submitted = $derived(form && 'submitted' in form && form.submitted);
	const failure = $derived(form && 'errors' in form ? form : undefined);
</script>

<AuthShell title={i18n.t('auth.forgot.page')}>
	<Card.Root>
		<Card.Header>
			<Card.Title>{i18n.t('auth.forgot.title')}</Card.Title>
			<Card.Description>{i18n.t(submitted ? 'auth.forgot.sent' : 'auth.forgot.desc')}</Card.Description>
		</Card.Header>
		<Card.Content>
			{#if failure?.error}
				<Alert.Root variant="destructive" class="mb-4">
					<Alert.Description>{failure.error}</Alert.Description>
				</Alert.Root>
			{/if}
			{#if submitted}
				<Alert.Root class="mb-4">
					<Alert.Description>{i18n.t('auth.forgot.check')}</Alert.Description>
				</Alert.Root>
				<Button href="/login" variant="outline" class="w-full">{i18n.t('auth.back')}</Button>
			{:else}
				<form
					method="post"
					class="space-y-4"
					use:enhance={() => {
						submitting = true;
						return async ({ update }) => {
							await update({ reset: false });
							submitting = false;
						};
					}}
				>
					<FormField id="email" label={i18n.t('auth.field.email')} error={failure?.errors?.email}>
						<!-- svelte-ignore a11y_autofocus -->
						<Input
							id="email"
							name="email"
							type="email"
							value={failure?.values?.email ?? ''}
							required
							autocomplete="email"
							autofocus
							aria-invalid={failure?.errors?.email ? true : undefined}
						/>
					</FormField>
					<Button type="submit" class="w-full bg-signal text-background hover:bg-signal/90" disabled={submitting}>
						{i18n.t('auth.forgot.submit')}
					</Button>
				</form>
			{/if}
		</Card.Content>
	</Card.Root>
	{#if !submitted}
		<p class="mt-6 text-center text-sm text-muted-foreground">
			{i18n.t('auth.forgot.remembered')}
			<a href="/login" class="font-medium text-foreground underline underline-offset-4">{i18n.t('auth.signin.submit')}</a>
		</p>
	{/if}
</AuthShell>
