<!-- The documents something is wrong with, and the fix (Go: attention). -->
<script lang="ts">
	import { enhance } from '$app/forms';
	import * as Alert from '#lib/components/ui/alert/index.js';
	import { Button } from '#lib/components/ui/button/index.js';
	import { useI18n } from '#lib/i18n/index.js';
	import { embeddingGapLine } from './format.js';
	import ProblemBadge from './ProblemBadge.svelte';
	import type { KnowledgeProblem } from './types.js';

	let { problems, embeddingGap }: { problems: KnowledgeProblem[]; embeddingGap: number } = $props();
	const i18n = useI18n();
</script>

<Alert.Root class="border-hairline bg-surface">
	<Alert.Title>{i18n.t('knowledge.attention.title')}</Alert.Title>
	<Alert.Description>
		<div class="mt-2 divide-y divide-hairline">
			{#each problems as p (p.documentId)}
				<div class="flex flex-wrap items-center justify-between gap-3 py-2 first:pt-0 last:pb-0">
					<div class="min-w-0 space-y-0.5">
						<div class="flex flex-wrap items-center gap-2">
							<a href="/app/knowledge/{p.documentId}" class="text-sm font-medium hover:underline">{p.title}</a>
							<ProblemBadge kind={p.kind} />
						</div>
						<p class={['text-xs', p.kind === 'failed' ? 'text-destructive' : 'text-muted-foreground']}>{p.detail}</p>
					</div>
					{#if p.kind !== 'stuck'}
						<form method="post" action="/app/knowledge/{p.documentId}?/reindex" use:enhance>
							<Button type="submit" size="sm" variant="outline">{i18n.t('knowledge.read_again')}</Button>
						</form>
					{/if}
				</div>
			{/each}
		</div>
		{#if embeddingGap > 0}
			<div class="mt-3 flex flex-wrap items-center gap-3">
				<p class="text-xs leading-relaxed text-muted-foreground">{embeddingGapLine(i18n, embeddingGap)}</p>
				<form method="post" action="/app/knowledge?/retryEmbeddings" use:enhance>
					<Button type="submit" size="sm" variant="outline">{i18n.t('knowledge.attention.embed')}</Button>
				</form>
			</div>
		{/if}
	</Alert.Description>
</Alert.Root>
