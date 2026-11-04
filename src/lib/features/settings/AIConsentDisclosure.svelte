<!-- What goes to AI providers and who they are, as the settings card and the first-run question both say it. -->
<script lang="ts">
	import { useI18n } from '#lib/i18n/index.js';

	let { recipients }: { recipients: string[] } = $props();
	const i18n = useI18n();
</script>

<div class="space-y-3 text-sm">
	<p>{i18n.t('ai.consent.intro')}</p>
	<div>
		<p class="font-medium">{i18n.t('ai.consent.what')}</p>
		<ul class="mt-1 list-disc space-y-1 pl-5 text-muted-foreground">
			<li>{i18n.t('ai.consent.what.writing')}</li>
			<li>{i18n.t('ai.consent.what.health')}</li>
			<li>{i18n.t('ai.consent.what.about')}</li>
			<li>{i18n.t('ai.consent.what.files')}</li>
		</ul>
	</div>
	<div>
		<p class="font-medium">{i18n.t('ai.consent.who')}</p>
		<ul class="mt-1 list-disc space-y-1 pl-5 text-muted-foreground">
			{#each recipients as recipient (recipient)}
				<li>{recipient}</li>
			{/each}
		</ul>
		<p class="mt-1 text-xs text-muted-foreground">{i18n.t('ai.consent.own')}</p>
	</div>
	<p>{i18n.t('ai.consent.use')}</p>
	<a href="/privacy" class="underline underline-offset-4">{i18n.t('ai.consent.policy')}</a>
</div>
