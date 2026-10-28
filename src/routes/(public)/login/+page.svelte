<script lang="ts">
	import { enhance } from '$app/forms';
	import AuthShell from '#lib/components/layout/AuthShell.svelte';
	import * as Alert from '#lib/components/ui/alert/index.js';
	import { Button } from '#lib/components/ui/button/index.js';
	import * as Card from '#lib/components/ui/card/index.js';
	import { Input } from '#lib/components/ui/input/index.js';
	import { Label } from '#lib/components/ui/label/index.js';
	import AltAuthButtons from '#lib/features/auth/AltAuthButtons.svelte';
	import { useI18n } from '#lib/i18n/index.js';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();
	const i18n = useI18n();
	let submitting = $state(false);
</script>

<AuthShell title={i18n.t('auth.signin.page')}>
	<Card.Root>
		<Card.Header>
			<Card.Title>{i18n.t('auth.signin.title')}</Card.Title>
			<Card.Description>{i18n.t('auth.signin.desc')}</Card.Description>
		</Card.Header>
		<Card.Content>
			{#if form?.error}
				<Alert.Root variant="destructive" class="mb-4">
					<Alert.Description>{form.error}</Alert.Description>
				</Alert.Root>
			{/if}
			<AltAuthButtons options={data.authOptions} next={data.next} mode="login" />
			<form
				method="post"
				class="space-y-4"
				id="login-form"
				use:enhance={() => {
					submitting = true;
					return async ({ update }) => {
						await update({ reset: false });
						submitting = false;
					};
				}}
			>
				{#if data.next}
					<input type="hidden" name="next" value={data.next} />
				{/if}
				<div class="space-y-2">
					<Label for="email">{i18n.t('auth.field.email')}</Label>
					<!-- svelte-ignore a11y_autofocus -->
					<Input id="email" name="email" type="email" value={form?.email ?? ''} required autocomplete="email" autofocus />
				</div>
				<div class="space-y-2">
					<div class="flex items-center justify-between gap-2">
						<Label for="password">{i18n.t('auth.field.password')}</Label>
						{#if data.authOptions.passwordReset}
							<a
								href="/forgot-password"
								class="text-xs font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
							>
								{i18n.t('auth.signin.forgot')}
							</a>
						{/if}
					</div>
					<Input id="password" name="password" type="password" required autocomplete="current-password" />
				</div>
				<Button type="submit" class="w-full bg-signal text-background hover:bg-signal/90" disabled={submitting}>
					{i18n.t('auth.signin.submit')}
				</Button>
			</form>
		</Card.Content>
	</Card.Root>
	<p class="mt-6 text-center text-sm text-muted-foreground">
		{i18n.t('auth.signin.noaccount')}
		<a href="/signup" class="font-medium text-foreground underline underline-offset-4">{i18n.t('auth.signin.create')}</a>
	</p>
</AuthShell>
