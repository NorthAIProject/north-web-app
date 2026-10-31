<!-- Today's water: quick amounts and the entries logged (Go: waterCard). -->
<script lang="ts">
	import { enhance } from '$app/forms';
	import { Button } from '#lib/components/ui/button/index.js';
	import * as Card from '#lib/components/ui/card/index.js';
	import { FieldMessage } from '#lib/components/ui/field-message/index.js';
	import { Progress } from '#lib/components/ui/progress/index.js';
	import { formatTime } from '#lib/components/khepri/dates.js';
	import { useI18n } from '#lib/i18n/index.js';
	import ActionButton from './ActionButton.svelte';
	import { amountLabel, litres, quickAmounts, waterPercent, type Care } from './format.js';
	import { careSubmit, type CareFailure } from './forms.js';

	let { water, failure, timezone }: { water: Care['water']; failure: CareFailure | null; timezone: string } = $props();
	const i18n = useI18n();
</script>

<Card.Root class="border-hairline bg-surface">
	<Card.Header>
		<Card.Title>{i18n.t('care.water.title')}</Card.Title>
		<Card.Description>
			{i18n.tf('care.water.desc', litres(i18n, water.totalMl), litres(i18n, water.targetMl))}
		</Card.Description>
	</Card.Header>
	<Card.Content>
		<Progress value={waterPercent(water.totalMl, water.targetMl)} class="mb-4" aria-label={i18n.t('care.water.title')} />
		<FieldMessage id="water-amount" error={failure?.errors.amount_ml} class="mb-3" />
		<div class="flex flex-wrap gap-2">
			{#each quickAmounts as amount (amount)}
				<form method="post" action="?/water" use:enhance={careSubmit()}>
					<input type="hidden" name="amount_ml" value={amount} />
					<Button type="submit" variant="outline" size="sm">+ {amountLabel(i18n, amount)}</Button>
				</form>
			{/each}
		</div>
		{#if water.entries.length > 0}
			<ul class="mt-4 space-y-1">
				{#each water.entries as e (e.id)}
					<li class="text-muted-foreground flex items-center justify-between text-xs">
						<span>
							{i18n.tf('care.water.at', amountLabel(i18n, e.amountMl), formatTime(i18n.locale, e.loggedAt, '15:04', timezone))}
						</span>
						<ActionButton action="?/undoWater" fields={{ id: e.id }} variant="ghost">
							{i18n.t('care.water.undo')}
						</ActionButton>
					</li>
				{/each}
			</ul>
		{/if}
	</Card.Content>
</Card.Root>
