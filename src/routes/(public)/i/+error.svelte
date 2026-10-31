<!--
	A friend or crew link that did not open. The usual reason is a 404 — the
	link was used up, withdrawn or mistyped — and the person holding it came
	to join someone, so they get that said plainly and a way in anyway, not the
	generic error card. Anything else is our fault and says so. The status
	stays 404 / 5xx: only the page is specific.
-->
<script lang="ts">
	import { page } from '$app/state';
	import AuthShell from '#lib/components/layout/AuthShell.svelte';
	import { Button } from '#lib/components/ui/button/index.js';
	import * as Card from '#lib/components/ui/card/index.js';
	import { useI18n } from '#lib/i18n/index.js';

	const i18n = useI18n();
	const invalid = $derived(page.status === 404);
	const signedIn = $derived(Boolean(page.data.user));
	const title = $derived(i18n.t(invalid ? 'social.invitepage.invalid.title' : 'social.invitepage.failed.title'));
</script>

<AuthShell {title}>
	<Card.Root class="border-hairline bg-surface">
		<Card.Header>
			<Card.Title class="text-balance">{title}</Card.Title>
			<Card.Description>
				{i18n.t(invalid ? 'social.invitepage.invalid.body' : 'social.invitepage.failed.body')}
			</Card.Description>
		</Card.Header>
		<Card.Content>
			<div class="flex flex-col gap-2">
				{#if signedIn}
					<Button href="/app/friends" class="w-full">{i18n.t('land.cta.open')}</Button>
				{:else}
					<Button href="/signup" class="w-full">{i18n.t('social.invitepage.signup')}</Button>
					<Button href="/login" variant="ghost" class="w-full">{i18n.t('social.invitepage.login')}</Button>
				{/if}
			</div>
		</Card.Content>
	</Card.Root>
</AuthShell>
