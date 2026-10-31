<!--
	The error page. north-client had no page for a 404 or a 500 — chi answered
	with a plain-text body — so this follows the one error page it did have
	(web/mcpauth/consent.templ ErrorPage): the auth shell, one card, the reason
	in a destructive alert and a way home. Signed-in pages under /app have
	their own, inside the app shell ((app)/app/+error.svelte).
-->
<script lang="ts">
	import { page } from '$app/state';
	import AuthShell from '#lib/components/layout/AuthShell.svelte';
	import { errorView } from '#lib/components/layout/errorView.js';
	import * as Alert from '#lib/components/ui/alert/index.js';
	import { Button } from '#lib/components/ui/button/index.js';
	import * as Card from '#lib/components/ui/card/index.js';
	import { useI18n } from '#lib/i18n/index.js';

	const i18n = useI18n();
	const view = $derived(errorView(i18n, page.status, page.error?.message));
	const home = $derived((page.data as { user?: unknown }).user ? '/app' : '/');
</script>

<AuthShell title={view.title}>
	<Card.Root>
		<Card.Header>
			<Card.Title><span class="tabular-nums">{page.status}</span> · {view.title}</Card.Title>
		</Card.Header>
		<Card.Content>
			<Alert.Root variant="destructive">
				<Alert.Description>
					<p>{view.reason}</p>
					{#if view.detail}<p>{view.detail}</p>{/if}
				</Alert.Description>
			</Alert.Root>
			{#if page.error?.requestId}
				<p class="mt-3 font-mono text-[10px] text-muted-foreground">
					{i18n.tf('layout.error.reference', page.error.requestId)}
				</p>
			{/if}
			<div class="mt-6 flex flex-col gap-2">
				{#if page.status >= 500}
					<!-- A full reload: the client router would reuse the failed state. -->
					<Button href={page.url.pathname + page.url.search} data-sveltekit-reload class="w-full">
						{i18n.t('layout.error.retry')}
					</Button>
				{/if}
				<Button href={home} variant="outline" class="w-full">{i18n.t('oauth.error.home')}</Button>
			</div>
		</Card.Content>
	</Card.Root>
</AuthShell>
