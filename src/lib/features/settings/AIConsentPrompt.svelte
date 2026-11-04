<!-- Asked once per account before anything is sent. It has no way to dismiss it: both buttons are the answer. -->
<script lang="ts">
	import { enhance } from '$app/forms';
	import { Button } from '#lib/components/ui/button/index.js';
	import { useI18n } from '#lib/i18n/index.js';
	import AIConsentDisclosure from './AIConsentDisclosure.svelte';

	let { recipients }: { recipients: string[] } = $props();
	const i18n = useI18n();
</script>

<div
	class="fixed inset-0 z-50 overflow-y-auto bg-background/95 p-4"
	role="dialog"
	aria-modal="true"
	aria-labelledby="ai-consent-title"
>
	<div class="mx-auto max-w-xl space-y-4 py-8">
		<h1 id="ai-consent-title" class="text-2xl font-semibold">{i18n.t('ai.consent.title')}</h1>
		<AIConsentDisclosure {recipients} />
		<form
			method="POST"
			action="/app/settings?/aiConsent"
			use:enhance
			class="flex flex-col gap-2 sm:flex-row"
		>
			<Button type="submit" name="decision" value="granted">{i18n.t('ai.consent.allow')}</Button>
			<Button type="submit" name="decision" value="declined" variant="outline"
				>{i18n.t('ai.consent.decline')}</Button
			>
		</form>
		<p class="text-xs text-muted-foreground">{i18n.t('ai.consent.declined.note')}</p>
	</div>
</div>
