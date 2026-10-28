// View helpers for the crew pages, ported from north-client web/crews
// (crews.templ, space.go) and internal/crews/crew (the reaction set, limits).
import type { components } from '#lib/api/generated/schema.js';
import type { Translator } from '#lib/i18n/index.js';

export type Crew = components['schemas']['Crew'];
export type CrewSpace = components['schemas']['CrewSpace'];
export type CrewChannel = components['schemas']['CrewChannel'];
export type CrewPerson = components['schemas']['CrewPerson'];
export type CrewMessage = components['schemas']['CrewMessage'];
export type CrewMessagePage = components['schemas']['CrewMessagePage'];
export type CrewBoard = components['schemas']['CrewBoard'];
export type CrewMember = components['schemas']['CrewMember'];
export type CrewChallenge = components['schemas']['CrewChallenge'];
export type CrewLiveEvent = components['schemas']['CrewLiveEvent'];

/** crew.MaxMembers */
export const MAX_MEMBERS = 25;

/** The tabs of the crew space (web/crews/space.go). */
export type Tab = 'chat' | 'challenge';

export const crewURL = (crewID: string) => `/app/crews/${crewID}`;
export const channelURL = (crewID: string, channelID: string) => `${crewURL(crewID)}/c/${channelID}`;
export const challengeURL = (crewID: string) => `${crewURL(crewID)}/challenge`;

/** crew.ReactionEmoji: the gym set, in the order shown. Keys are what the API stores. */
export const reactionEmoji: { key: string; glyph: string }[] = [
	{ key: 'fire', glyph: '🔥' },
	{ key: 'muscle', glyph: '💪' },
	{ key: 'clap', glyph: '👏' },
	{ key: 'heart', glyph: '❤️' },
	{ key: 'laugh', glyph: '😂' },
	{ key: 'hundred', glyph: '💯' },
	{ key: 'trophy', glyph: '🏆' },
	{ key: 'eyes', glyph: '👀' }
];

/** crew.Glyph: the emoji for a key, or "" when it is not in the set. */
export function glyph(key: string): string {
	return reactionEmoji.find((e) => e.key === key)?.glyph ?? '';
}

/** The reasons the report dialog offers, in its order (space.go reportReasons). */
export const reportReasons = ['spam', 'harassment', 'hate', 'sexual', 'violence', 'self_harm', 'other'] as const;

/** crew.NotifyAll / NotifyMentions / NotifyNone */
export const notifyLevels = ['all', 'mentions', 'none'] as const;

/** The mute choices and how long each lasts (chat_handler.go muteFor). */
export const muteChoices = ['off', 'hour', 'day', 'week'] as const;
const muteMs: Record<string, number> = { hour: 3_600_000, day: 86_400_000, week: 7 * 86_400_000 };

/** When a mute choice ends, from now; undefined for "off" or anything unknown. */
export function mutedUntil(choice: string, now: Date = new Date()): string | undefined {
	const ms = muteMs[choice];
	return ms ? new Date(now.getTime() + ms).toISOString() : undefined;
}

/** pick: the singular or plural form of a counted string. */
export function pick(i18n: Translator, n: number, one: string, many: string): string {
	return n === 1 ? i18n.t(one) : i18n.tf(many, n);
}

export function membersLabel(i18n: Translator, n: number): string {
	return pick(i18n, n, 'crews.members.one', 'crews.members.many');
}

/** canManage: owners and admins run channels, pins and the challenge. */
export function canManage(role: string | undefined): boolean {
	return role === 'owner' || role === 'admin';
}

/** canRemove: the owner may take out anybody else, an admin only plain members. */
export function canRemove(myRole: string, m: CrewMember): boolean {
	if (m.me || !canManage(myRole)) return false;
	return myRole === 'owner' || memberRole(m) === 'member';
}

/** A member's role; anything unknown reads as member. */
export function memberRole(m: CrewMember): string {
	return m.role === 'owner' || m.role === 'admin' ? m.role : 'member';
}

/** toggledRole: the role the owner's button on a row gives that member. */
export function toggledRole(role: string): string {
	return role === 'admin' ? 'member' : 'admin';
}

export function challengeLabel(i18n: Translator, c: CrewChallenge | undefined | null): string {
	if (!c) return i18n.t('crews.challenge.none');
	return c.kind === 'workouts'
		? i18n.tf('crews.challenge.workouts', c.target)
		: i18n.tf('crews.challenge.checkins', c.target);
}

export function percent(done: number, target: number): number {
	if (target <= 0) return 0;
	return Math.min(100, Math.floor((done * 100) / target));
}

/** initials: what an avatar without a photo shows. */
export function initials(name: string | undefined): string {
	const fields = (name ?? '').trim().split(/\s+/).filter(Boolean);
	if (fields.length === 0) return '?';
	const first = (s: string) => Array.from(s)[0] ?? '';
	if (fields.length === 1) return first(fields[0]).toUpperCase();
	return (first(fields[0]) + first(fields[fields.length - 1])).toUpperCase();
}

/** A run of message text, or an @mention to highlight. */
export type Segment = { text: string; mention: boolean };

// What the server resolves as a mention (internal/crews/mentions.go). The
// look-behind keeps the character before the @ in the plain text.
const mentionPattern = /(?:^|[^\w@])(@[A-Za-z0-9_]{3,20})\b/g;

/** segments splits a body around @mentions. */
export function segments(body: string): Segment[] {
	const out: Segment[] = [];
	let rest = 0;
	for (const m of body.matchAll(mentionPattern)) {
		const start = (m.index ?? 0) + m[0].length - m[1].length;
		const end = start + m[1].length;
		if (start > rest) out.push({ text: body.slice(rest, start), mention: false });
		out.push({ text: body.slice(start, end), mention: true });
		rest = end;
	}
	if (rest < body.length) out.push({ text: body.slice(rest), mention: false });
	return out;
}

/**
 * continues: whether m sits under prev without its own name and avatar —
 * same author, within five minutes, and not a reply.
 */
export function continues(prev: CrewMessage, m: CrewMessage): boolean {
	return (
		prev.kind === 'text' &&
		m.kind === 'text' &&
		!!prev.author &&
		!!m.author &&
		prev.author.id === m.author.id &&
		!m.replyTo &&
		new Date(m.createdAt ?? 0).getTime() - new Date(prev.createdAt ?? 0).getTime() < 5 * 60_000
	);
}

/** excerptOf: the start of a body, for a reply preview. */
export function excerptOf(body: string): string {
	const runes = Array.from(body);
	return runes.length <= 80 ? body : runes.slice(0, 79).join('') + '…';
}

/** The newest seq on a page: the cursor after it. */
export function lastSeq(messages: CrewMessage[]): number {
	return messages.length ? (messages[messages.length - 1].seq ?? 0) : 0;
}

export function firstSeq(messages: CrewMessage[]): number {
	return messages.length ? (messages[0].seq ?? 0) : 0;
}

/** What a row's Reply hands the composer. */
export type Reply = { id: string; name: string; excerpt: string };
