<!--
	The error page. north-client had no page for a 404 or a 500 — chi answered
	with a plain-text body — so this follows the one error page it did have
	(web/mcpauth/consent.templ ErrorPage): the auth shell, one card, the reason
	in a destructive alert and a way home.
-->
<script lang="ts">
	import { page } from '$app/state';
	import AuthShell from '#lib/components/layout/AuthShell.svelte';
	import * as Alert from '#lib/components/ui/alert/index.js';
	import { Button } from '#lib/components/ui/button/index.js';
	import * as Card from '#lib/components/ui/card/index.js';
	import { useI18n } from '#lib/i18n/index.js';

	const i18n = useI18n();
	const title = $derived(page.status === 404 ? 'Page not found' : 'Something went wrong');
	const reason = $derived(
		page.status === 404
			? 'There is nothing at this address.'
			: page.error?.message || 'The server could not answer this request.'
	);
</script>

<AuthShell {title}>
	<Card.Root>
		<Card.Header>
			<Card.Title>{page.status} · {title}</Card.Title>
		</Card.Header>
		<Card.Content>
			<Alert.Root variant="destructive">
				<Alert.Description>{reason}</Alert.Description>
			</Alert.Root>
			{#if page.error?.requestId}
				<p class="mt-3 font-mono text-[10px] text-muted-foreground">{page.error.requestId}</p>
			{/if}
			<div class="mt-6">
				<Button href="/" variant="outline" class="w-full">{i18n.t('oauth.error.home')}</Button>
			</div>
		</Card.Content>
	</Card.Root>
</AuthShell>
