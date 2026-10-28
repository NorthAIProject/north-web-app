import type { components } from '#lib/api/generated/schema.js';

export type KnowledgeDocument = components['schemas']['KnowledgeDocument'];
export type KnowledgeDocumentDetail = components['schemas']['KnowledgeDocumentDetail'];
export type KnowledgeList = components['schemas']['KnowledgeList'];
export type KnowledgeCounts = KnowledgeList['counts'];
export type KnowledgeProblem = NonNullable<KnowledgeList['problems']>[number];
export type IndexRun = NonNullable<KnowledgeList['lastRun']>;
export type KnowledgeHit = components['schemas']['KnowledgeSearchResults']['hits'][number];
export type KnowledgeHeading = NonNullable<KnowledgeDocumentDetail['headings']>[number];

/** Field messages and values a note/upload form gets back on a 422 (Go: NoteForm). */
export type NoteForm = {
	title?: string;
	body?: string;
	errors?: Record<string, string>;
};
