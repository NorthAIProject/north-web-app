<!--
	The standing rules that draw the dashed markers on the rail (web/day
	dialogs.templ rulesDialog). Every kind is listed, set or not, so the form
	is also the menu.
-->
<script lang="ts">
	import { enhance } from '$app/forms';
	import ClockIcon from '@lucide/svelte/icons/clock';
	import { Button } from '#lib/components/ui/button/index.js';
	import { Checkbox } from '#lib/components/ui/checkbox/index.js';
	import * as Dialog from '#lib/components/ui/dialog/index.js';
	import { Input } from '#lib/components/ui/input/index.js';
	import { useI18n } from '#lib/i18n/index.js';
	import { quickSubmit } from './forms.js';
	import type { DayView } from './view.js';

	let { data }: { data: DayView } = $props();
	const i18n = useI18n();
	let open = $state(false);
</script>

<Dialog.Root bind:open>
	<Dialog.Trigger>
		{#snippet child({ props })}
			<Button {...props} variant="outline" size="icon" aria-label={i18n.t('day.rules')}><ClockIcon class="size-4" /></Button>
		{/snippet}
	</Dialog.Trigger>
	<Dialog.Content class="sm:max-w-sm">
		<Dialog.Header>
			<Dialog.Title>{i18n.t('day.rules')}</Dialog.Title>
			<Dialog.Description>{i18n.t('day.rules.intro')}</Dialog.Description>
		</Dialog.Header>
		<form method="post" action="?/rules" class="space-y-3" use:enhance={quickSubmit(i18n, () => (open = false))}>
			<input type="hidden" name="date" value={data.date} />
			{#each data.rules as r (r.kind)}
				<div class="flex items-center gap-3">
					<Checkbox id="rule-on-{r.kind}" name="on_{r.kind}" value="true" checked={r.enabled} />
					<label for="rule-on-{r.kind}" class="flex-1 text-sm">{i18n.t(`day.rule.${r.kind}`)}</label>
					<Input type="time" name="at_{r.kind}" value={r.at} class="w-28" />
				</div>
			{/each}
			<Dialog.Footer>
				<Button type="submit">{i18n.t('day.rules.save')}</Button>
			</Dialog.Footer>
		</form>
	</Dialog.Content>
</Dialog.Root>
