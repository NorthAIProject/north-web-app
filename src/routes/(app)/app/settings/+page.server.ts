import { fail, redirect } from '@sveltejs/kit';
import { isApiError } from '#lib/api/errors.js';
import { serverApi } from '#lib/server/api.js';
import { clearSession } from '#lib/server/session.js';
import { isAppearance } from '#lib/theme.js';
import { checked, formHour, formSwitch, text } from '#lib/features/settings/form.js';
import type { Actions, PageServerLoad } from './$types';

// Go: internal/settings/handler.go (GET /app/settings and its form posts).
export const load: PageServerLoad = async (event) => {
	event.depends('north:settings');
	const api = serverApi(event);
	const [profile, preferences, notifications, diets, connections] = await Promise.all([
		api.GET('/settings/profile'),
		api.GET('/settings/preferences'),
		api.GET('/settings/notifications'),
		api.GET('/settings/diets'),
		api.GET('/settings/connections')
	]);
	return {
		profile: profile.data!,
		preferences: preferences.data!,
		notifications: notifications.data!,
		diets: diets.data!.diets,
		connectionCount: connections.data!.connections.length
	};
};

/** A 422 becomes the form's field messages; anything else is the error page. */
function rejected(err: unknown, form: string, values: Record<string, unknown>) {
	if (isApiError(err) && (err.status === 422 || err.status === 400)) {
		return fail(422, { form, errors: err.fields, message: err.message, values });
	}
	throw err;
}

export const actions: Actions = {
	// Go: updateProfile. Appearance is saved through its own endpoint so the
	// funnel records it as a settings change; an empty select is "unchanged".
	profile: async (event) => {
		const form = await event.request.formData();
		const values = {
			displayName: text(form, 'display_name'),
			timezone: text(form, 'timezone'),
			locale: text(form, 'locale'),
			coachingStyle: text(form, 'coaching_style'),
			coachingTone: text(form, 'coaching_tone'),
			appearance: text(form, 'appearance')
		};
		const api = serverApi(event);
		try {
			await api.PUT('/settings/profile', {
				body: {
					displayName: values.displayName,
					timezone: values.timezone,
					locale: values.locale,
					coachingStyle: values.coachingStyle,
					coachingTone: values.coachingTone as 'direct'
				} as never
			});
			if (values.appearance && isAppearance(values.appearance)) {
				await api.PUT('/settings/appearance', { body: { appearance: values.appearance, surface: 'settings' } });
			} else if (values.appearance) {
				return fail(422, { form: 'profile', errors: { appearance: 'Choose system, light or dark.' }, message: '', values });
			}
		} catch (err) {
			return rejected(err, 'profile', values);
		}
		redirect(303, '/app/settings');
	},

	// Go: updateNotifications. Checkboxes send nothing when off; the timing
	// fields are optional so a page from an older build keeps what is saved.
	notifications: async (event) => {
		const form = await event.request.formData();
		const body = {
			nudgeMissedCheckIn: checked(form, 'nudge_missed_checkin'),
			nudgeGoalDeadline: checked(form, 'nudge_goal_deadline'),
			coachActivity: checked(form, 'coach_activity'),
			trainingReminders: checked(form, 'training_reminders'),
			weeklyReportAuto: checked(form, 'weekly_report_auto'),
			dailyBriefingAuto: checked(form, 'daily_briefing_auto'),
			statsDigestCadence: String(form.get('stats_digest_cadence') ?? ''),
			quietHoursEnabled: checked(form, 'quiet_hours_enabled'),
			quietStart: text(form, 'quiet_start'),
			quietEnd: text(form, 'quiet_end'),
			briefingHour: formHour(form, 'briefing_hour'),
			eveningReflection: formSwitch(form, 'evening_reflection', 'evening_hour'),
			eveningHour: formHour(form, 'evening_hour'),
			coachCheckIns: formSwitch(form, 'coach_check_ins', 'coach_toggles'),
			coachAdjustsTraining: formSwitch(form, 'coach_adjusts_training', 'coach_toggles'),
			photoAskEnabled: checked(form, 'photo_ask_enabled'),
			photoEveryDays: Number.parseInt(text(form, 'photo_every_days'), 10) || 0,
			photoReminderDays: Number.parseInt(text(form, 'photo_reminder_days'), 10) || 0
		};
		try {
			await serverApi(event).PUT('/settings/notifications', { body: body as never });
		} catch (err) {
			return rejected(err, 'notifications', body);
		}
		redirect(303, '/app/settings');
	},

	// Go: updatePreferences.
	preferences: async (event) => {
		const form = await event.request.formData();
		const values = {
			unitsSystem: String(form.get('units_system') ?? ''),
			defaultGoal: String(form.get('default_goal') ?? ''),
			defaultMacroSplit: String(form.get('default_macro_split') ?? '')
		};
		try {
			await serverApi(event).PUT('/settings/preferences', { body: values as never });
		} catch (err) {
			return rejected(err, 'preferences', values);
		}
		redirect(303, '/app/settings');
	},

	// Go: updateDiets. Anything that is not an id is dropped, as Go did.
	diets: async (event) => {
		const form = await event.request.formData();
		const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
		const dietIds = form.getAll('diet_ids').map(String).filter((id) => uuid.test(id));
		await serverApi(event).PUT('/settings/diets', { body: { dietIds } });
		redirect(303, '/app/settings');
	},

	// Go: updateTargetWeight, posted from My Day's body panel
	// (action="/app/settings?/targetWeight"). Empty clears; it answers by going
	// back to the day.
	targetWeight: async (event) => {
		const form = await event.request.formData();
		const raw = text(form, 'target_weight_kg');
		let kg: number | null = null;
		if (raw) {
			kg = Number(raw.replaceAll(',', '.'));
			if (!Number.isFinite(kg)) return fail(422, { form: 'targetWeight', errors: {}, message: 'Unprocessable Entity', values: {} });
		}
		try {
			await serverApi(event).PUT('/settings/target-weight', { body: { targetWeightKg: kg } });
		} catch (err) {
			if (isApiError(err) && err.status === 422) {
				return fail(422, { form: 'targetWeight', errors: err.fields, message: err.message, values: {} });
			}
			throw err;
		}
		redirect(303, '/app');
	},

	// Go: deleteAccount. The session goes with the account, so the redirect
	// leaves /app (which would only bounce a signed-out browser to login).
	deleteAccount: async (event) => {
		const form = await event.request.formData();
		try {
			await serverApi(event).POST('/account/delete', { body: { confirmEmail: text(form, 'confirm_email') } });
		} catch (err) {
			if (isApiError(err) && err.status === 422) {
				return fail(422, {
					form: 'delete',
					errors: {},
					message: err.fields.confirmEmail || err.message,
					values: {}
				});
			}
			throw err;
		}
		clearSession(event.cookies, event.url);
		redirect(303, '/?deleted=1');
	}
};
