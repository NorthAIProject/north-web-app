<script lang="ts">
	import { enhance } from '$app/forms';
	import { pageTitle } from '#lib/brand.js';
	import * as Alert from '#lib/components/ui/alert/index.js';
	import { Button } from '#lib/components/ui/button/index.js';
	import * as Card from '#lib/components/ui/card/index.js';
	import { useI18n } from '#lib/i18n/index.js';
	import { documentLines, documentSize, fileTypeLabel, readWhen } from '#lib/features/knowledge/format.js';
	import StatusBadge from '#lib/features/knowledge/StatusBadge.svelte';
	import type { PageProps } from './$types';

	// Go: web/knowledge/document.templ DocumentPage.
	let { data, form }: PageProps = $props();
	const i18n = useI18n();

	const doc = $derived(data.doc);
	// The parsed lines, as the chunker numbered them; a citation's range indexes these.
	const lines = $derived(doc.text === '' ? [] : doc.text.split('\n'));
	const headings = $derived(doc.headings ?? []);
	const highlight = $derived(data.from > 0);
	const highlighted = (line: number) => highlight && line >= data.from && line <= data.to;
	// Outline indent by heading level, inline because Tailwind cannot see built class names.
	const indentFor = (level: number) => `padding-left: ${Math.min(Math.max(level, 1), 6) - 1}rem`;
	const actionError = $derived((form as { errors?: Record<string, string> } | null)?.errors?.action ?? '');
</script>

<svelte:head><title>{pageTitle(doc.title)}</title></svelte:head>

<div class="mx-auto w-full max-w-4xl space-y-6 p-6 md:p-8">
	<header class="space-y-3">
		<a
			href="/app/knowledge"
			class="font-mono text-[10px] tracking-[0.14em] text-muted-foreground uppercase hover:text-foreground"
		>
			{'← ' + i18n.t('knowledge.title')}
		</a>
		<div class="flex flex-wrap items-center gap-2">
			<h1 class="text-2xl font-medium tracking-tight">{doc.title}</h1>
			<StatusBadge {doc} />
		</div>
		<dl class="mt-3 grid grid-cols-2 gap-x-6 gap-y-2 text-xs text-muted-foreground sm:grid-cols-4">
			<div>
				<dt class="text-[10px] tracking-wide uppercase opacity-70">{i18n.t('knowledge.col.kind')}</dt>
				<dd class="mt-0.5 text-foreground">{fileTypeLabel(i18n, doc)}</dd>
			</div>
			<div>
				<dt class="text-[10px] tracking-wide uppercase opacity-70">{i18n.t('knowledge.col.size')}</dt>
				<dd class="mt-0.5 text-foreground tabular-nums">{documentSize(i18n, doc)}</dd>
			</div>
			<div>
				<dt class="text-[10px] tracking-wide uppercase opacity-70">{i18n.t('knowledge.col.lines')}</dt>
				<dd class="mt-0.5 text-foreground tabular-nums">{documentLines(doc)}</dd>
			</div>
			<div>
				<dt class="text-[10px] tracking-wide uppercase opacity-70">{i18n.t('knowledge.col.read')}</dt>
				<dd class="mt-0.5 text-foreground">{readWhen(i18n, doc, data.user.timezone)}</dd>
			</div>
		</dl>
		{#if highlight}
			<p class="text-sm text-muted-foreground">{i18n.tf('knowledge.doc.showing', data.from, data.to)}</p>
		{/if}
	</header>
	{#if actionError}
		<Alert.Root variant="destructive">
			<Alert.Description>{actionError}</Alert.Description>
		</Alert.Root>
	{/if}
	{#if data.readError}
		<Card.Root class="border-hairline">
			<Card.Content class="py-4">
				<p class="text-sm text-destructive">{data.readError}</p>
			</Card.Content>
		</Card.Root>
	{/if}
	{#if headings.length > 1}
		<Card.Root class="border-hairline bg-surface">
			<Card.Content class="py-4">
				<p class="font-mono text-[10px] tracking-[0.14em] text-muted-foreground uppercase">
					{i18n.t('knowledge.doc.contents')}
				</p>
				<ul class="mt-3 space-y-1">
					{#each headings as h, i (i)}
						<li style={indentFor(h.level)}>
							<a href="#L{h.line}" class="text-sm text-muted-foreground hover:text-foreground">{h.text}</a>
						</li>
					{/each}
				</ul>
			</Card.Content>
		</Card.Root>
	{/if}
	{#if lines.length > 0}
		<!--
			A table rather than a <pre>: the gutter must not be selectable with the
			text, or copying a quoted passage copies the line numbers into it.
		-->
		<div class="overflow-x-auto rounded-md border border-hairline bg-surface">
			<table class="w-full border-collapse font-mono text-xs leading-relaxed">
				<tbody>
					{#each lines as text, i (i)}
						<tr id="L{i + 1}" class={['scroll-mt-24', highlighted(i + 1) && 'bg-signal/12']}>
							<td
								class="w-12 border-r border-hairline px-2 py-0.5 text-right align-top text-muted-foreground/60 tabular-nums select-none"
							>
								{i + 1}
							</td>
							<td class="px-3 py-0.5 align-top break-words whitespace-pre-wrap">{text}</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	{/if}
	<div class="flex flex-wrap gap-2">
		<form method="post" action="?/reindex" use:enhance>
			<Button type="submit" size="sm" variant="outline">{i18n.t('knowledge.doc.reread')}</Button>
		</form>
		<form method="post" action="?/delete" use:enhance>
			<Button type="submit" size="sm" variant="outline">{i18n.t('knowledge.remove')}</Button>
		</form>
	</div>
</div>
