<script lang="ts">
	import AuthShell from '#lib/components/layout/AuthShell.svelte';
	import { Button } from '#lib/components/ui/button/index.js';
	import * as Card from '#lib/components/ui/card/index.js';
	import { useI18n } from '#lib/i18n/index.js';
	import type { PageProps } from './$types';

	// Go: InvitePage (web/social/social.templ), in layout.Auth.
	let { data }: PageProps = $props();
	const i18n = useI18n();
</script>

<AuthShell title={i18n.tf('social.invitepage.title', data.inviter)}>
	<Card.Root class="border-hairline bg-surface">
		<Card.Header>
			<Card.Title>{i18n.tf('social.invitepage.heading', data.inviter)}</Card.Title>
			<Card.Description>{i18n.t('social.invitepage.desc')}</Card.Description>
		</Card.Header>
		<Card.Content>
			<div class="flex flex-col gap-2">
				<Button href="/signup" class="w-full">{i18n.t('social.invitepage.signup')}</Button>
				<Button href="/login" variant="ghost" class="w-full"
					>{i18n.t('social.invitepage.login')}</Button
				>
			</div>
		</Card.Content>
	</Card.Root>
</AuthShell>
