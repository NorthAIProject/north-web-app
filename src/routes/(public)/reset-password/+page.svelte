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

	// Go: web/auth/reset_password.templ.
	let { data, form }: PageProps = $props();
	const i18n = useI18n();
	let submitting = $state(false);

	const errors = $derived<Record<string, string>>(form?.errors ?? {});
	// A link without a token gets Go's "missing" message and a way to ask again.
	const error = $derived(form?.error || (data.token ? '' : i18n.t('auth.err.reset.missing')));
</script>

<AuthShell title={i18n.t('auth.reset.title')}>
	<Card.Root>
		<Card.Header>
			<Card.Title>{i18n.t('auth.reset.title')}</Card.Title>
			<Card.Description>{i18n.t('auth.reset.desc')}</Card.Description>
		</Card.Header>
		<Card.Content>
			{#if error}
				<Alert.Root variant="destructive" class="mb-4">
					<Alert.Description>{error}</Alert.Description>
				</Alert.Root>
				{#if !data.token}
					<Button href="/forgot-password" class="mt-4 w-full">{i18n.t('auth.reset.again')}</Button>
				{/if}
			{/if}
			{#if data.token}
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
					<input type="hidden" name="token" value={data.token} />
					<FormField
						id="password"
						label={i18n.t('auth.field.newpassword')}
						error={errors.password}
						hint={i18n.t('auth.password.hint')}
					>
						<!-- svelte-ignore a11y_autofocus -->
						<Input
							id="password"
							name="password"
							type="password"
							required
							autocomplete="new-password"
							autofocus
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
					<Button type="submit" class="w-full" disabled={submitting}>
						{i18n.t('auth.reset.submit')}
					</Button>
				</form>
			{/if}
		</Card.Content>
	</Card.Root>
	<p class="mt-6 text-center text-sm text-muted-foreground">
		<a href="/login" class="font-medium text-foreground underline underline-offset-4">{i18n.t('auth.back')}</a>
	</p>
</AuthShell>
