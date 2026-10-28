<!-- Go: nutrition.targetNotice — the macro target every plan is held to, or where to get one. -->
<script lang="ts">
	import MonoLabel from '#lib/components/khepri/MonoLabel.svelte';
	import * as Alert from '#lib/components/ui/alert/index.js';
	import * as Card from '#lib/components/ui/card/index.js';
	import { useI18n } from '#lib/i18n/index.js';
	import { targetLine, type Macros } from './view.js';

	let { target }: { target?: Macros } = $props();
	const i18n = useI18n();
</script>

{#if !target}
	<Alert.Root>
		<Alert.Title>{i18n.t('nutrition.target.missing.title')}</Alert.Title>
		<Alert.Description>
			<p>
				{i18n.t('nutrition.target.missing.before')}
				<a href="/app/calculator" class="underline">{i18n.t('nutrition.target.missing.link')}</a>.
			</p>
		</Alert.Description>
	</Alert.Root>
{:else}
	<Card.Root class="border-hairline">
		<Card.Content class="py-4">
			<MonoLabel text={i18n.t('nutrition.target.label')} />
			<p class="text-signal mt-1 text-sm font-medium">{targetLine(i18n, target)}</p>
		</Card.Content>
	</Card.Root>
{/if}
