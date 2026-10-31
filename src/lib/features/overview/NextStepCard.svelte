<!--
	The one action a fresh account should take next (Go nextStepCard /
	nextStepBody): the mascot over an empty-state block whose filled button is
	the step. The push step hides until this browser can deliver, with a "Not
	now" remembered in this browser only.
-->
<script lang="ts">
	import EmptyState from '#lib/components/khepri/EmptyState.svelte';
	import Mascot from '#lib/components/khepri/Mascot.svelte';
	import { Button } from '#lib/components/ui/button/index.js';
	import * as Card from '#lib/components/ui/card/index.js';
	import PushCard from '#lib/features/push/PushCard.svelte';
	import { useI18n } from '#lib/i18n/index.js';
	import { NEXT_STEP_PUSH, type Snapshot } from './overview.js';

	let { step }: { step: NonNullable<Snapshot['nextStep']> } = $props();
	const i18n = useI18n();
</script>

{#snippet body(dismiss?: () => void)}
	<Card.Root class="border-hairline bg-surface" data-next-step={step.kind}>
		<Card.Content>
			<div class="flex justify-center">
				<Mascot size="md" />
			</div>
			<EmptyState eyebrow={step.eyebrow} title={step.title} body={step.body}>
				<Button href={step.href}>{step.cta}</Button>
				{#if dismiss}
					<Button variant="ghost" size="sm" data-push-dismiss onclick={dismiss}>{i18n.t('dash.notnow')}</Button>
				{/if}
			</EmptyState>
		</Card.Content>
	</Card.Root>
{/snippet}

{#if step.kind === NEXT_STEP_PUSH}
	<PushCard>
		{#snippet children({ dismiss })}
			{@render body(dismiss)}
		{/snippet}
	</PushCard>
{:else}
	{@render body()}
{/if}
