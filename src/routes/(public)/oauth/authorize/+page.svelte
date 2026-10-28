<script lang="ts">
	import { onMount } from 'svelte';
	import { enhance } from '$app/forms';
	import AuthShell from '#lib/components/layout/AuthShell.svelte';
	import * as Alert from '#lib/components/ui/alert/index.js';
	import { Button } from '#lib/components/ui/button/index.js';
	import * as Card from '#lib/components/ui/card/index.js';
	import { Input } from '#lib/components/ui/input/index.js';
	import FormField from '#lib/features/auth/FormField.svelte';
	import GoogleIcon from '#lib/features/auth/GoogleIcon.svelte';
	import PasskeyButton from '#lib/features/auth/PasskeyButton.svelte';
	import { googleHref } from '#lib/features/auth/options.js';
	import { useI18n } from '#lib/i18n/index.js';
	import type { PageProps } from './$types';

	// Go: web/mcpauth/consent.templ + account.templ. The one page that is an
	// advertisement, a signup form and an install step at once: somebody who
	// never heard of Khepri pasted its MCP URL into their agent.
	let { data, form }: PageProps = $props();
	const i18n = useI18n();

	const req = $derived(data.request);
	const query = $derived(`?request_id=${encodeURIComponent(req.id)}`);
	// The account block's own state: a failed post re-renders in place.
	const failure = $derived(form && 'errors' in form ? form : undefined);
	const errors = $derived<Record<string, string>>(failure?.errors ?? {});
	const isLogin = $derived((failure?.values?.mode ?? data.mode) === 'login');

	// svelte-ignore state_referenced_locally
	let email = $state(failure?.values?.email ?? '');
	// svelte-ignore state_referenced_locally
	let displayName = $state(failure?.values?.display_name ?? '');
	let timezone = $state('');
	let passkeyError = $state('');
	let submitting = $state(false);

	onMount(() => {
		timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
	});
</script>

<AuthShell title={i18n.t('oauth.title')} wide>
	<div id="consent-card">
		<Card.Root>
			<Card.Header>
				<!-- The name is whatever the client called itself; the line under it is not. -->
				<Card.Title>{i18n.tf('oauth.asking', req.clientName)}</Card.Title>
				<Card.Description>
					{req.isLoopback ? i18n.t('oauth.destination.local') : i18n.tf('oauth.destination', req.redirectHost)}
				</Card.Description>
			</Card.Header>
			<Card.Content>
				{#if !data.email}
					<div class="space-y-5">
						<div>
							<h2 class="text-sm font-medium">{i18n.t(isLogin ? 'oauth.signin.title' : 'oauth.new.title')}</h2>
							{#if !isLogin}
								<p class="mt-1 text-xs text-muted-foreground">{i18n.t('oauth.new.desc')}</p>
							{/if}
						</div>
						{#if failure?.error}
							<Alert.Root variant="destructive">
								<Alert.Description>{failure.error}</Alert.Description>
							</Alert.Root>
						{/if}
						{#if data.authOptions.google || data.authOptions.passkey}
							<div class="space-y-2">
								{#if data.authOptions.google}
									<Button href={googleHref(data.resume)} variant="outline" class="w-full" data-sveltekit-reload>
										<GoogleIcon />
										{i18n.t('oauth.google')}
									</Button>
								{/if}
								{#if data.authOptions.passkey}
									<PasskeyButton
										mode={isLogin ? 'login' : 'register'}
										label={i18n.t('oauth.passkey')}
										next={data.resume}
										fields={() => ({ email, displayName, timezone })}
										onerror={(message) => (passkeyError = message)}
									/>
								{/if}
								{#if passkeyError}
									<p class="text-sm text-destructive" role="alert">{passkeyError}</p>
								{/if}
							</div>
							<div class="flex items-center gap-3">
								<span class="h-px flex-1 bg-hairline"></span>
								<span class="text-xs tracking-wide text-muted-foreground uppercase">{i18n.t('oauth.or')}</span>
								<span class="h-px flex-1 bg-hairline"></span>
							</div>
						{/if}
						<form
							method="post"
							action="{query}&/account"
							class="space-y-4"
							use:enhance={() => {
								submitting = true;
								return async ({ update }) => {
									await update({ reset: false });
									submitting = false;
								};
							}}
						>
							<input type="hidden" name="mode" value={isLogin ? 'login' : 'signup'} />
							{#if !isLogin}
								<FormField id="display_name" label={i18n.t('oauth.new.name')} error={errors.display_name}>
									<Input
										id="display_name"
										name="display_name"
										bind:value={displayName}
										required
										autocomplete="name"
										aria-invalid={errors.display_name ? true : undefined}
									/>
								</FormField>
							{/if}
							<FormField id="email" label={i18n.t('oauth.new.email')} error={errors.email}>
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
							<!-- One password, not two: a mistyped password is recoverable by
							     reset, a mistyped email is not. -->
							<FormField id="password" label={i18n.t('oauth.new.password')} error={errors.password}>
								<Input
									id="password"
									name="password"
									type="password"
									required
									autocomplete={isLogin ? 'current-password' : 'new-password'}
									aria-invalid={errors.password ? true : undefined}
								/>
							</FormField>
							<input type="hidden" id="timezone" name="timezone" value={timezone} />
							<Button type="submit" class="w-full bg-signal text-background hover:bg-signal/90" disabled={submitting}>
								{i18n.t(isLogin ? 'oauth.signin.submit' : 'oauth.new.submit')}
							</Button>
						</form>
						<p class="text-center text-xs text-muted-foreground">
							{i18n.t(isLogin ? 'oauth.signin.new' : 'oauth.new.haveone')}
							<a href="{query}&mode={isLogin ? 'signup' : 'login'}" class="ml-1 underline hover:text-foreground">
								{i18n.t(isLogin ? 'oauth.new.submit' : 'oauth.signin.submit')}
							</a>
						</p>
					</div>
				{:else}
					<div class="mb-6 flex items-center justify-between gap-3 rounded-md border border-hairline bg-surface px-3 py-2">
						<span class="text-sm">{i18n.tf('oauth.account.signed-in', data.email)}</span>
						<form method="post" action="/logout" class="shrink-0" data-sveltekit-reload>
							<input type="hidden" name="next" value={data.resume} />
							<button type="submit" class="text-xs text-muted-foreground underline hover:text-foreground">
								{i18n.t('oauth.account.notyou')}
							</button>
						</form>
					</div>
					<div class="space-y-2">
						<p class="text-xs tracking-wide text-muted-foreground uppercase">{i18n.t('oauth.can.title')}</p>
						<ul class="space-y-1.5 text-sm text-muted-foreground">
							<li>{i18n.t('oauth.can.read')}</li>
							{#if req.readOnlyRequested}
								<li class="text-foreground">{i18n.t('oauth.can.readonly.note')}</li>
							{:else}
								<li>{i18n.t('oauth.can.write')}</li>
							{/if}
						</ul>
					</div>
					<!-- A plain post, not enhanced: Approve sends the browser to another
					     origin. Nothing auto-submits it — a crafted link plus an
					     auto-submit would be a one-click grant. -->
					<form method="post" action="{query}&/decide" class="mt-6 space-y-4">
						<!-- Hand-rolled checkbox, as in Go: a native input posts read_only=1. -->
						<label class="flex items-start gap-2.5 rounded-md border border-hairline bg-surface px-3 py-2.5">
							<input
								type="checkbox"
								name="read_only"
								value="1"
								checked={req.readOnlyRequested}
								class="mt-0.5 size-4 rounded border-hairline accent-signal"
							/>
							<span class="text-sm">
								<span class="font-medium">{i18n.t('oauth.readonly.label')}</span>
								<span class="block text-xs text-muted-foreground">{i18n.t('oauth.readonly.hint')}</span>
							</span>
						</label>
						<div class="flex gap-3">
							<Button type="submit" name="decision" value="approve" class="flex-1 bg-signal text-background hover:bg-signal/90">
								{i18n.t('oauth.approve')}
							</Button>
							<Button type="submit" name="decision" value="deny" variant="outline" class="flex-1">
								{i18n.t('oauth.deny')}
							</Button>
						</div>
					</form>
				{/if}
			</Card.Content>
		</Card.Root>
		<p class="mt-4 text-center text-xs text-muted-foreground">{i18n.t('oauth.revoke.note')}</p>
	</div>
</AuthShell>
