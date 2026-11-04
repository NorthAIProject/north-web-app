<!-- Settings: the same disclosure, the current answer, and a way to change it. -->
<script lang="ts">
	import { enhance } from '$app/forms';
	import { Button } from '#lib/components/ui/button/index.js';
	import * as Card from '#lib/components/ui/card/index.js';
	import { useI18n } from '#lib/i18n/index.js';
	import AIConsentDisclosure from './AIConsentDisclosure.svelte';

	let { status, recipients }: { status: string; recipients: string[] } = $props();
	const i18n = useI18n();
	const allowed = $derived(status === 'granted');
</script>

<Card.Root id="ai-data-sharing">
	<Card.Header>
		<Card.Title>{i18n.t('ai.consent.settings.title')}</Card.Title>
		<Card.Description>
			{i18n.t(allowed ? 'ai.consent.settings.on' : 'ai.consent.settings.off')}
		</Card.Description>
	</Card.Header>
	<Card.Content class="space-y-4">
		<AIConsentDisclosure {recipients} />
		<form method="POST" action="/app/settings?/aiConsent" use:enhance>
			<Button
				type="submit"
				name="decision"
				value={allowed ? 'declined' : 'granted'}
				variant={allowed ? 'outline' : 'default'}
			>
				{i18n.t(allowed ? 'ai.consent.settings.turn_off' : 'ai.consent.settings.turn_on')}
			</Button>
		</form>
	</Card.Content>
</Card.Root>
