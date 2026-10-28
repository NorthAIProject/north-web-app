// Strings the Go chat page built in Go code rather than the catalogue
// (web/chat/chat.templ: captionText, humanSchedule, capitalise, sourceLabel,
// fileLabel, starters). Same keys, same rules.

import type { Translator } from '#lib/i18n/index.js';
import type { components } from '#lib/api/generated/schema.js';

export type ChatMessage = components['schemas']['ChatMessage'];
export type WatchProposal = components['schemas']['WatchProposal'];

// conversations.SourceDailyBriefing / SourceStandingTask / SourceCoachCheckIn.
const SOURCE_DAILY_BRIEFING = 'Daily briefing';
const SOURCE_STANDING_TASK = 'Standing task';
const SOURCE_COACH_CHECK_IN = 'Coach check-in';

export function starters(i18n: Translator): string[] {
	return [i18n.t('chat.starter.1'), i18n.t('chat.starter.2'), i18n.t('chat.starter.3'), i18n.t('chat.starter.4')];
}

/** "15:04" in the reader's timezone. */
export function clock(iso: string, timeZone: string): string {
	const parts = new Intl.DateTimeFormat('en-GB', {
		hour: '2-digit',
		minute: '2-digit',
		hour12: false,
		timeZone: timeZone || 'UTC'
	}).formatToParts(new Date(iso));
	const hour = parts.find((p) => p.type === 'hour')?.value ?? '00';
	const minute = parts.find((p) => p.type === 'minute')?.value ?? '00';
	return `${hour === '24' ? '00' : hour}:${minute}`;
}

/** Why a message nobody asked for is here: "Briefing · 07:00", "Standing task". */
export function captionText(i18n: Translator, m: ChatMessage, timeZone: string): string {
	const label = (m.sourceLabel ?? '').trim();
	switch (label) {
		case SOURCE_DAILY_BRIEFING:
			return i18n.tf('chat.caption.briefing', clock(m.createdAt, timeZone));
		case SOURCE_STANDING_TASK:
			return i18n.t('chat.caption.standing');
		case SOURCE_COACH_CHECK_IN:
			return i18n.t('chat.caption.checkin');
		case '':
			return i18n.t('chat.caption.proactive');
		default:
			return i18n.tf('chat.caption.from', label);
	}
}

export function sourceLabel(i18n: Translator, n: number): string {
	return n === 1 ? i18n.t('chat.sources.one') : i18n.tf('chat.sources.many', n);
}

export function fileLabel(i18n: Translator, name: string): string {
	return name.trim() || i18n.t('chat.file');
}

/** "Every day at 8:00", "Every Monday at 18:30". */
export function humanSchedule(i18n: Translator, w: WatchProposal): string {
	if (w.cadence === 'weekly') {
		return i18n.tf('chat.watch.weekly', i18n.t(`chat.watch.day.${w.weekday}`), w.clock);
	}
	return i18n.tf('chat.watch.daily', w.clock);
}

export function capitalise(s: string): string {
	const t = s.trim();
	if (!t) return t;
	const chars = Array.from(t);
	return chars[0].toUpperCase() + chars.slice(1).join('');
}

/** Go clipDraft: a starter or deep link pre-fills at most 500 characters. */
export function clipDraft(s: string | null): string {
	const t = (s ?? '').trim();
	const chars = Array.from(t);
	return chars.length <= 500 ? t : chars.slice(0, 500).join('');
}
