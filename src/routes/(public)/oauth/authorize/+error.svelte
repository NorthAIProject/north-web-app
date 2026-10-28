<script lang="ts">
	import { page } from '$app/state';
	import AuthShell from '#lib/components/layout/AuthShell.svelte';
	import * as Alert from '#lib/components/ui/alert/index.js';
	import { Button } from '#lib/components/ui/button/index.js';
	import * as Card from '#lib/components/ui/card/index.js';
	import { useI18n } from '#lib/i18n/index.js';

	// Go: web/mcpauth/consent.templ ErrorPage. Shown, never redirected: these
	// are the failures whose callback cannot be trusted, and the expired one.
	const i18n = useI18n();
</script>

<AuthShell title={i18n.t('oauth.error.title')}>
	<Card.Root>
		<Card.Header>
			<Card.Title>{i18n.t('oauth.error.title')}</Card.Title>
		</Card.Header>
		<Card.Content>
			<Alert.Root variant="destructive">
				<Alert.Description>{page.error?.message ?? i18n.t('oauth.error.expired')}</Alert.Description>
			</Alert.Root>
			<div class="mt-6">
				<Button href="/" variant="outline" class="w-full">{i18n.t('oauth.error.home')}</Button>
			</div>
		</Card.Content>
	</Card.Root>
</AuthShell>
