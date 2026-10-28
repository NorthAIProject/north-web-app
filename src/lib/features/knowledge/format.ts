// The strings web/knowledge/*.templ built in Go code rather than the catalogue,
// with the same keys and the same rules.

import type { Translator } from '#lib/i18n/index.js';
import { formatTime } from '#lib/components/khepri/dates.js';
import type { IndexRun, KnowledgeCounts, KnowledgeDocument, KnowledgeHit } from './types.js';

const has = (d: KnowledgeDocument, s: string) => d.mime.toLowerCase().includes(s);

export function fileTypeLabel(i18n: Translator, d: KnowledgeDocument): string {
	if (has(d, 'pdf')) return 'PDF';
	if (has(d, 'markdown')) return 'Markdown';
	if (has(d, 'csv')) return 'CSV';
	if (d.kind === 'upload') return i18n.t('knowledge.type.text');
	return i18n.t('knowledge.type.note');
}

export function typeCode(i18n: Translator, d: KnowledgeDocument): string {
	if (has(d, 'pdf')) return 'PDF';
	if (has(d, 'markdown')) return 'MD';
	if (has(d, 'csv')) return 'CSV';
	if (d.kind === 'upload') return 'TXT';
	return i18n.t('knowledge.type.code.note');
}

export function humanSize(i18n: Translator, n: number): string {
	if (n < 1024) return `${n} B`;
	if (n < 1024 * 1024) return `${Math.floor((n + 512) / 1024)} KB`;
	return `${i18n.decimal(n / (1024 * 1024), 1)} MB`;
}

export function documentSize(i18n: Translator, d: KnowledgeDocument): string {
	return d.byteSize > 0 ? humanSize(i18n, d.byteSize) : '—';
}

export function documentLines(d: KnowledgeDocument): string {
	return (d.lineCount ?? 0) > 0 ? String(d.lineCount) : '—';
}

/** "2 Jan" in the user's zone, or a dash before the first read. */
export function readWhen(i18n: Translator, d: KnowledgeDocument, timeZone: string): string {
	if (!d.indexedAt) return '—';
	return formatTime(i18n.locale, d.indexedAt, '2 Jan', timeZone);
}

export function isWaiting(d: KnowledgeDocument): boolean {
	return d.status === 'pending' || d.status === 'failed' || Boolean(d.stale);
}

export type LibraryFilter = 'all' | 'notes' | 'files' | 'waiting';

/** Whether a row shows under a filter tab (Go: rowShowExpr). Vault files count as files. */
export function showsUnder(d: KnowledgeDocument, filter: LibraryFilter): boolean {
	if (filter === 'all') return true;
	if (filter === 'notes') return d.kind === 'note';
	if (filter === 'files') return d.kind !== 'note';
	return isWaiting(d);
}

export function filterCount(docs: KnowledgeDocument[], filter: LibraryFilter): number {
	switch (filter) {
		case 'all':
			return docs.length;
		case 'notes':
			return docs.filter((d) => d.kind === 'note').length;
		case 'files':
			// Go: countFiles counts uploads only, though the tab also shows vault files.
			return docs.filter((d) => d.kind === 'upload').length;
		default:
			return docs.filter(isWaiting).length;
	}
}

export function meterWidth(n: number, c: KnowledgeCounts): string {
	const total = c.ready + c.pending + c.failed;
	if (total === 0 || n === 0) return 'width:0';
	return `width:${((n / total) * 100).toFixed(1)}%`;
}

export function meterLabel(i18n: Translator, c: KnowledgeCounts): string {
	return i18n.tf('knowledge.meter.label', c.ready, c.pending, c.failed);
}

/** One passage is its own sentence: "1 passage are" reads as a bug. */
export function embeddingGapLine(i18n: Translator, n: number): string {
	return n === 1 ? i18n.t('knowledge.attention.gap.one') : i18n.tf('knowledge.attention.gap.many', n);
}

/** The last indexing pass in the terms a person would use. */
export function runSummary(i18n: Translator, run: IndexRun, timeZone: string): string {
	if (!run.completedAt) return i18n.t('knowledge.run.running');
	const when = formatTime(i18n.locale, run.completedAt, '2 Jan, 15:04', timeZone);
	if (run.failed > 0) return i18n.tf('knowledge.run.failed', when, run.failed, run.seen);
	if (run.seen === 0) return i18n.tf('knowledge.run.nothing', when);
	if (run.unchanged === run.seen) return i18n.tf('knowledge.run.current', when);
	return i18n.tf('knowledge.run.read', when, run.added + run.updated, run.seen);
}

/** Where a passage sits, for a result row; the title itself is left out. */
export function headingTrail(h: KnowledgeHit): string {
	const title = h.title.toLowerCase();
	return h.headingPath.filter((p) => p.toLowerCase() !== title).join(' › ');
}

/** Opens the document with the passage highlighted (Go: document.Hit.URL). */
export function hitURL(h: KnowledgeHit): string {
	const end = h.endLine ?? h.startLine;
	return `/app/knowledge/${h.documentId}?from=${h.startLine}&to=${end}#L${h.startLine}`;
}

export function hitLines(h: KnowledgeHit): string {
	const end = h.endLine ?? h.startLine;
	return h.startLine === end ? `L${h.startLine}` : `L${h.startLine}–${end}`;
}

export function searchCountLabel(i18n: Translator, n: number, hasMore: boolean): string {
	if (hasMore) return i18n.tf('knowledge.search.count.more', n);
	if (n === 1) return i18n.t('knowledge.search.count.one');
	return i18n.tf('knowledge.search.count.many', n);
}

/** A passage's line range off a document URL; anything unreadable is no highlight. */
export function highlightRange(url: URL): { from: number; to: number } {
	// Number, not parseInt: Go's Atoi refuses "5abc" rather than reading 5.
	const int = (v: string | null) => {
		const n = Number(v ?? '');
		return v && Number.isInteger(n) ? n : 0;
	};
	const from = int(url.searchParams.get('from'));
	let to = int(url.searchParams.get('to'));
	if (from < 1) return { from: 0, to: 0 };
	if (to < from) to = from;
	return { from, to };
}
