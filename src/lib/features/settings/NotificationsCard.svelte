<!-- What Khepri may say when nobody asked it anything (Go: settings.notificationsCard). -->
<script lang="ts">
	import { enhance } from '$app/forms';
	import { Button } from '#lib/components/ui/button/index.js';
	import * as Card from '#lib/components/ui/card/index.js';
	import { Input } from '#lib/components/ui/input/index.js';
	import { Label } from '#lib/components/ui/label/index.js';
	import { Separator } from '#lib/components/ui/separator/index.js';
	import { Switch } from '#lib/components/ui/switch/index.js';
	import { useI18n } from '#lib/i18n/index.js';
	import FieldDescription from './FieldDescription.svelte';
	import FieldMessage from './FieldMessage.svelte';
	import FormSelect from './FormSelect.svelte';
	import type { FieldErrors } from './form.js';
	import { cadenceOrDefault, digestCadences, hourLabel, hours, photoEveryDays, photoReminderDays } from './options.js';

	export type NotificationValues = {
		nudgeMissedCheckIn: boolean;
		nudgeGoalDeadline: boolean;
		coachActivity: boolean;
		trainingReminders: boolean;
		weeklyReportAuto: boolean;
		dailyBriefingAuto: boolean;
		statsDigestCadence: string;
		quietHoursEnabled: boolean;
		quietStart: string;
		quietEnd: string;
		photoAskEnabled: boolean;
		photoEveryDays: number;
		photoReminderDays: number;
		briefingHour?: number;
		eveningReflection?: boolean;
		eveningHour?: number;
		coachCheckIns?: boolean;
		coachAdjustsTraining?: boolean;
	};

	let { values, errors = {} }: { values: NotificationValues; errors?: FieldErrors } = $props();

	const i18n = useI18n();

	const hourGroups = [{ options: hours.map((h) => ({ value: String(h), label: hourLabel(h) })) }];
	const everyGroups = $derived([{ options: photoEveryDays.map((o) => ({ value: o.value, label: i18n.t(o.key) })) }]);
	const remindGroups = $derived([{ options: photoReminderDays.map((o) => ({ value: o.value, label: i18n.t(o.key) })) }]);
	const cadenceGroups = $derived([
		{ options: digestCadences.map((c) => ({ value: c, label: i18n.t('settings.notif.digest.' + c) })) }
	]);
	// Go: 14 is also what an unset schedule shows.
	const every = $derived(values.photoEveryDays === 0 ? '14' : String(values.photoEveryDays));
	const briefingHour = $derived(values.briefingHour ?? 7);
	const eveningHour = $derived(values.eveningHour ?? 21);
</script>

{#snippet toggle(id: string, on: boolean, labelKey: string, descKey = '')}
	<div class="space-y-2">
		<Switch {id} name={id} checked={on} />
		<Label for={id}>{i18n.t(labelKey)}</Label>
		{#if descKey}<FieldDescription>{i18n.t(descKey)}</FieldDescription>{/if}
	</div>
{/snippet}

{#snippet hourSelect(id: string, labelKey: string, value: number)}
	<div class="space-y-2">
		<Label for={id}>{i18n.t(labelKey)}</Label>
		<FormSelect {id} name={id} value={String(value)} placeholder={hourLabel(value)} groups={hourGroups} error={Boolean(errors[id])} />
		<FieldMessage message={errors[id]} />
	</div>
{/snippet}

<Card.Root class="border-hairline bg-surface" id="notifications">
	<Card.Header>
		<Card.Title>{i18n.t('settings.notif.title')}</Card.Title>
		<Card.Description>{i18n.t('settings.notif.desc')}</Card.Description>
	</Card.Header>
	<Card.Content>
		<form method="post" action="?/notifications" class="space-y-4" use:enhance={() => async ({ update }) => update({ reset: false })}>
			{@render toggle('nudge_missed_checkin', values.nudgeMissedCheckIn, 'settings.notif.missed')}
			{@render toggle('nudge_goal_deadline', values.nudgeGoalDeadline, 'settings.notif.goal')}
			{@render toggle('coach_activity', values.coachActivity, 'settings.notif.coach', 'settings.notif.coach.desc')}
			{@render toggle('training_reminders', values.trainingReminders, 'settings.notif.training')}
			<!-- Marks that this form carries the two switches below. -->
			<input type="hidden" name="coach_toggles" value="1" />
			{@render toggle('coach_check_ins', values.coachCheckIns ?? true, 'settings.notif.checkins', 'settings.notif.checkins.desc')}
			{@render toggle(
				'coach_adjusts_training',
				values.coachAdjustsTraining ?? true,
				'settings.notif.adjusts',
				'settings.notif.adjusts.desc'
			)}
			<Separator />
			<p class="text-sm font-medium">{i18n.t('settings.notif.photo.title')}</p>
			<p class="text-muted-foreground text-xs">{i18n.t('settings.notif.photo.desc')}</p>
			{@render toggle('photo_ask_enabled', values.photoAskEnabled, 'settings.notif.photo.ask')}
			<div class="space-y-2">
				<Label for="photo_every_days">{i18n.t('settings.notif.photo.often')}</Label>
				<FormSelect
					id="photo_every_days"
					name="photo_every_days"
					value={every}
					placeholder={i18n.t('settings.notif.photo.week2')}
					groups={everyGroups}
				/>
			</div>
			<div class="space-y-2">
				<Label for="photo_reminder_days">{i18n.t('settings.notif.photo.forget')}</Label>
				<FormSelect
					id="photo_reminder_days"
					name="photo_reminder_days"
					value={String(values.photoReminderDays)}
					placeholder={i18n.t('settings.notif.photo.days2')}
					groups={remindGroups}
				/>
			</div>
			{@render toggle('weekly_report_auto', values.weeklyReportAuto, 'settings.notif.weekly', 'settings.notif.weekly.desc')}
			{@render toggle('daily_briefing_auto', values.dailyBriefingAuto, 'settings.notif.briefing', 'settings.notif.briefing.desc')}
			{@render hourSelect('briefing_hour', 'settings.notif.briefing.hour', briefingHour)}
			{@render toggle('evening_reflection', values.eveningReflection ?? false, 'settings.notif.evening', 'settings.notif.evening.desc')}
			{@render hourSelect('evening_hour', 'settings.notif.evening.hour', eveningHour)}
			<!-- A cadence rather than three switches: somebody wants one of these. -->
			<div class="space-y-2">
				<Label for="stats_digest_cadence">{i18n.t('settings.notif.digest')}</Label>
				<FormSelect
					id="stats_digest_cadence"
					name="stats_digest_cadence"
					value={cadenceOrDefault(values.statsDigestCadence)}
					placeholder={i18n.t('settings.notif.digest.choose')}
					groups={cadenceGroups}
					error={Boolean(errors.stats_digest_cadence)}
				/>
				<FieldMessage message={errors.stats_digest_cadence} />
				<FieldDescription>{i18n.t('settings.notif.digest.desc')}</FieldDescription>
			</div>
			{@render toggle('quiet_hours_enabled', values.quietHoursEnabled, 'settings.notif.quiet')}
			<div class="grid grid-cols-2 gap-3 sm:max-w-xs">
				<div class="space-y-2">
					<Label for="quiet_start">{i18n.t('settings.notif.quiet.from')}</Label>
					<!-- Native time input: posts "HH:MM", what the service expects. -->
					<Input
						id="quiet_start"
						name="quiet_start"
						type="time"
						value={values.quietStart}
						aria-invalid={errors.quiet_start ? true : undefined}
					/>
					<FieldMessage message={errors.quiet_start} />
				</div>
				<div class="space-y-2">
					<Label for="quiet_end">{i18n.t('settings.notif.quiet.to')}</Label>
					<Input
						id="quiet_end"
						name="quiet_end"
						type="time"
						value={values.quietEnd}
						aria-invalid={errors.quiet_end ? true : undefined}
					/>
					<FieldMessage message={errors.quiet_end} />
				</div>
			</div>
			<Button type="submit" class="bg-signal text-background hover:bg-signal/90">{i18n.t('settings.notif.save')}</Button>
		</form>
	</Card.Content>
</Card.Root>
