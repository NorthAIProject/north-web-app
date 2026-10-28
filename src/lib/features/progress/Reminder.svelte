<!--
	north-client web/progress/progress.templ reminder: the cadence as radios
	(three choices and off read at a glance) in a plain POST form. The radio is
	templUI's native one, hand-drawn here: the app's RadioGroup is a bits-ui
	widget, and this form must post without JavaScript.
-->
<script lang="ts">
	import { enhance } from '$app/forms';
	import { Button } from '#lib/components/ui/button/index.js';
	import * as Card from '#lib/components/ui/card/index.js';
	import { Label } from '#lib/components/ui/label/index.js';
	import { useI18n } from '#lib/i18n/index.js';
	import { cadences } from './view.js';

	let { cadence, nextDueOn }: { cadence: string; nextDueOn: string } = $props();

	const i18n = useI18n();
	const id = (c: string) => (c === '' ? 'off' : c);
	const radioClass =
		'relative h-4 w-4 before:absolute before:left-1/2 before:top-1/2 before:h-1.5 before:w-1.5 before:-translate-x-1/2 before:-translate-y-1/2 appearance-none rounded-full border-2 border-primary before:content-[\'\'] before:rounded-full before:bg-background checked:border-primary checked:bg-primary checked:before:visible focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed';
</script>

<Card.Root>
	<Card.Header>
		<Card.Title>{i18n.t('progress.reminder')}</Card.Title>
		<Card.Description>
			{nextDueOn ? i18n.tf('progress.reminder.next', nextDueOn) : i18n.t('progress.reminder.none')}
		</Card.Description>
	</Card.Header>
	<Card.Content>
		<form
			method="post"
			action="?/schedule"
			class="space-y-4"
			data-testid="progress-schedule"
			use:enhance={() =>
				async ({ update }) => {
					await update({ reset: false });
				}}
		>
			<fieldset class="flex flex-wrap gap-4">
				<legend class="sr-only">{i18n.t('progress.reminder')}</legend>
				{#each cadences as c (c)}
					<div class="flex items-center gap-2">
						<input
							type="radio"
							id="cadence-{id(c)}"
							name="cadence"
							value={c}
							checked={cadence === c}
							class={radioClass}
						/>
						<Label for="cadence-{id(c)}">{i18n.t(`progress.cadence.${id(c)}`)}</Label>
					</div>
				{/each}
			</fieldset>
			<Button type="submit" variant="outline" size="sm">{i18n.t('progress.reminder.save')}</Button>
		</form>
	</Card.Content>
</Card.Root>
