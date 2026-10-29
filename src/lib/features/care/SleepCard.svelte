<!-- Last night's sleep, logged or corrected (Go: sleepCard). -->
<script lang="ts">
	import { enhance } from '$app/forms';
	import SearchSelect from '#lib/components/khepri/SearchSelect.svelte';
	import { Button } from '#lib/components/ui/button/index.js';
	import * as Card from '#lib/components/ui/card/index.js';
	import { Input } from '#lib/components/ui/input/index.js';
	import { Label } from '#lib/components/ui/label/index.js';
	import { useI18n } from '#lib/i18n/index.js';
	import { sleepDuration, type Care } from './format.js';
	import { careSubmit, typed, type CareFailure } from './forms.js';

	let { last, failure }: { last: Care['lastNight']; failure: CareFailure | null } = $props();
	const i18n = useI18n();

	const qualities = ['1', '2', '3', '4', '5'];
	const errors = $derived(failure?.errors ?? {});
	// Bumped after a save, so the form goes back to empty (Go re-rendered it).
	let resetKey = $state(0);
</script>

<Card.Root class="border-hairline bg-surface">
	<Card.Header>
		<Card.Title>{i18n.t('care.sleep.title')}</Card.Title>
		<Card.Description>
			{#if last}
				{i18n.tf('care.sleep.last', sleepDuration(last.durationMinutes))}{#if last.quality != null}{i18n.tf(
						'care.sleep.quality.suffix',
						String(last.quality)
					)}{/if}
			{:else}
				{i18n.t('care.sleep.empty')}
			{/if}
		</Card.Description>
	</Card.Header>
	<Card.Content>
		{#key resetKey}
			<form method="post" action="?/sleep" class="space-y-4" use:enhance={careSubmit(() => resetKey++)}>
				<div class="flex flex-wrap gap-4">
					<div class="space-y-2">
						<Label for="hours">{i18n.t('care.sleep.hours')}</Label>
						<Input
							id="hours"
							name="hours"
							type="number"
							value={typed(failure, 'hours')}
							aria-invalid={errors.duration_minutes ? 'true' : undefined}
							min="0"
							max="24"
							placeholder="7"
						/>
					</div>
					<div class="space-y-2">
						<Label for="minutes">{i18n.t('care.sleep.minutes')}</Label>
						<Input
							id="minutes"
							name="minutes"
							type="number"
							value={typed(failure, 'minutes')}
							min="0"
							max="59"
							step="5"
							placeholder="30"
						/>
					</div>
					<div class="space-y-2">
						<Label for="quality">{i18n.t('care.sleep.quality')}</Label>
						<SearchSelect
							id="quality"
							name="quality"
							value={typed(failure, 'quality') || ''}
							items={qualities.map((q) => ({ value: String(q), label: `${q} / 5` }))}
							placeholder={i18n.t('care.sleep.quality.ph')}
							search={false}
						/>
					</div>
				</div>
				{#if errors.duration_minutes}
					<p class="text-[0.8rem] font-medium text-red-500">{errors.duration_minutes}</p>
				{/if}
				<div class="flex flex-wrap gap-4">
					<div class="space-y-2">
						<Label for="bedtime">{i18n.t('care.sleep.bedtime')}</Label>
						<Input
							id="bedtime"
							name="bedtime"
							type="time"
							value={typed(failure, 'bedtime')}
							aria-invalid={errors.bedtime ? 'true' : undefined}
						/>
					</div>
					<div class="space-y-2">
						<Label for="wake_time">{i18n.t('care.sleep.woke')}</Label>
						<Input
							id="wake_time"
							name="wake_time"
							type="time"
							value={typed(failure, 'wake_time')}
							aria-invalid={errors.wake_time ? 'true' : undefined}
						/>
					</div>
				</div>
				<Button type="submit" class="bg-signal text-background hover:bg-signal/90">
					{i18n.t(last ? 'care.sleep.update' : 'care.sleep.log')}
				</Button>
			</form>
		{/key}
	</Card.Content>
</Card.Root>
