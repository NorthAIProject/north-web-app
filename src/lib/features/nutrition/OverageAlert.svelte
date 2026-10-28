<!--
	Go: nutrition.overageAlert — a change refused for taking a day over its
	target, with the amounts and, for an advanced plan, a button that sends the
	same form again confirmed.
-->
<script lang="ts">
	import { enhance } from '$app/forms';
	import * as Alert from '#lib/components/ui/alert/index.js';
	import { Button } from '#lib/components/ui/button/index.js';
	import { useI18n } from '#lib/i18n/index.js';
	import type { PlanPage } from './plan-page.js';
	import { overageLine } from './view.js';

	let { overage }: { overage: NonNullable<PlanPage['overage']> } = $props();
	const i18n = useI18n();
</script>

<Alert.Root variant="destructive">
	<Alert.Title>{i18n.t('nutrition.overage.title')}</Alert.Title>
	<Alert.Description>
		<ul class="mt-1 space-y-1">
			{#each overage.days as d (d.dayId)}
				<li>{overageLine(i18n, d)}</li>
			{/each}
		</ul>
		{#if overage.canConfirm}
			<form method="post" action={overage.repost.action} class="mt-3" use:enhance>
				{#each overage.repost.fields as f, i (i)}
					<input type="hidden" name={f.name} value={f.value} />
				{/each}
				<input type="hidden" name="confirm_overage" value="1" />
				<Button type="submit" variant="destructive" size="sm">{i18n.t('nutrition.overage.confirm')}</Button>
			</form>
		{:else}
			<p class="mt-2">{i18n.t('nutrition.overage.easy')}</p>
		{/if}
	</Alert.Description>
</Alert.Root>
