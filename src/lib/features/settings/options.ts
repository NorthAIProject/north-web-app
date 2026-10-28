// The choices the settings page offers, in the order north-client offers them
// (web/settings/settings.templ, internal/users, internal/notifications,
// internal/calculator/macroplan, internal/preferences).

import type { Locale } from '#lib/i18n/locales.js';

export type ZoneGroup = { region: string; zones: string[] };

/** users.zoneGroups: a curated shortlist, not the whole tzdata. */
const zoneGroups: ZoneGroup[] = [
	{
		region: 'Africa',
		zones: [
			'Africa/Abidjan', 'Africa/Accra', 'Africa/Algiers', 'Africa/Cairo',
			'Africa/Casablanca', 'Africa/Johannesburg', 'Africa/Lagos', 'Africa/Nairobi'
		]
	},
	{
		region: 'Americas',
		zones: [
			'America/Anchorage', 'America/Argentina/Buenos_Aires', 'America/Bogota',
			'America/Chicago', 'America/Denver', 'America/Halifax', 'America/Lima',
			'America/Los_Angeles', 'America/Mexico_City', 'America/New_York',
			'America/Phoenix', 'America/Santiago', 'America/Sao_Paulo',
			'America/St_Johns', 'America/Toronto', 'America/Vancouver'
		]
	},
	{
		region: 'Asia',
		zones: [
			'Asia/Bangkok', 'Asia/Dhaka', 'Asia/Dubai', 'Asia/Hong_Kong',
			'Asia/Jakarta', 'Asia/Jerusalem', 'Asia/Karachi', 'Asia/Kolkata',
			'Asia/Manila', 'Asia/Riyadh', 'Asia/Seoul', 'Asia/Shanghai',
			'Asia/Singapore', 'Asia/Taipei', 'Asia/Tehran', 'Asia/Tokyo'
		]
	},
	{
		region: 'Europe',
		zones: [
			'Atlantic/Azores', 'Europe/Amsterdam', 'Europe/Athens', 'Europe/Berlin',
			'Europe/Brussels', 'Europe/Bucharest', 'Europe/Budapest', 'Europe/Copenhagen',
			'Europe/Dublin', 'Europe/Helsinki', 'Europe/Istanbul', 'Europe/Kyiv',
			'Europe/Lisbon', 'Europe/London', 'Europe/Madrid', 'Europe/Moscow',
			'Europe/Oslo', 'Europe/Paris', 'Europe/Prague', 'Europe/Rome',
			'Europe/Stockholm', 'Europe/Vienna', 'Europe/Warsaw', 'Europe/Zurich'
		]
	},
	{
		region: 'Oceania',
		zones: [
			'Australia/Adelaide', 'Australia/Brisbane', 'Australia/Melbourne',
			'Australia/Perth', 'Australia/Sydney', 'Pacific/Auckland',
			'Pacific/Fiji', 'Pacific/Honolulu'
		]
	},
	{ region: 'Other', zones: ['UTC'] }
];

/**
 * The offered zones, with current added as a group of its own when the
 * shortlist lacks it (Go: users.ZoneGroupsIncluding) — otherwise the select
 * could not show a zone somebody already holds.
 */
export function zoneGroupsIncluding(current: string): ZoneGroup[] {
	const zone = current.trim();
	if (!zone || zoneGroups.some((g) => g.zones.includes(zone))) return zoneGroups;
	return [{ region: 'Current', zones: [zone] }, ...zoneGroups];
}

/** users.Locales with Label(): each language named in itself. */
export const localeOptions: { value: Locale; label: string }[] = [
	{ value: 'en', label: 'English' },
	{ value: 'pt-PT', label: 'Português (Portugal)' },
	{ value: 'pt-BR', label: 'Português (Brasil)' },
	{ value: 'es', label: 'Español' }
];

/** users.Tones; the label key is "tone.<value>". */
export const tones = ['direct', 'warm', 'analytical', 'tough_love'] as const;
export const defaultTone = 'direct';

/** The tone to show selected (Go: ProfileForm.tone). */
export function toneOrDefault(tone: string | undefined): string {
	return (tones as readonly string[]).includes(tone ?? '') ? tone! : defaultTone;
}

/** The locale to show selected (Go: ProfileForm.locale). */
export function localeOrDefault(locale: string | undefined): string {
	return localeOptions.some((l) => l.value === locale) ? locale! : 'en';
}

/** notifications.digestCadences: off first, then least to most frequent. */
export const digestCadences = ['off', 'monthly', 'weekly', 'daily'] as const;

/** Prefs.Cadence: an unset cadence reads as off. */
export function cadenceOrDefault(c: string | undefined): string {
	return c || 'off';
}

export const hours = Array.from({ length: 24 }, (_, i) => i);

/** "07:00" (Go: hourLabel). */
export function hourLabel(h: number): string {
	return `${String(h).padStart(2, '0')}:00`;
}

export const photoEveryDays = [
	{ value: '7', key: 'settings.notif.photo.week1' },
	{ value: '14', key: 'settings.notif.photo.week2' },
	{ value: '21', key: 'settings.notif.photo.week3' },
	{ value: '28', key: 'settings.notif.photo.week4' }
];

export const photoReminderDays = [
	{ value: '0', key: 'settings.notif.photo.none' },
	{ value: '2', key: 'settings.notif.photo.days2' },
	{ value: '3', key: 'settings.notif.photo.days3' },
	{ value: '7', key: 'settings.notif.photo.days7' }
];

export const unitsOptions = [
	{ value: 'metric', key: 'settings.prefs.metric' },
	{ value: 'imperial', key: 'settings.prefs.imperial' }
];

export const goalOptions = [
	{ value: 'cutting', key: 'settings.prefs.cutting' },
	{ value: 'maintenance', key: 'settings.prefs.maintenance' },
	{ value: 'bulking', key: 'settings.prefs.bulking' }
];

export const splitOptions = [
	{ value: 'high_carb', key: 'settings.prefs.highcarb' },
	{ value: 'moderate_carb', key: 'settings.prefs.modcarb' },
	{ value: 'low_carb', key: 'settings.prefs.lowcarb' }
];

/** The instrument row (Go: buildSettingsSummary). Units are not translated there either. */
export function settingsSummary(timezone: string, unitsSystem: string, dietCount: number, connectionCount: number) {
	return {
		timezone: timezone || '—',
		units: unitsSystem === 'imperial' ? 'Imperial' : 'Metric',
		dietCount,
		connectionCount
	};
}
