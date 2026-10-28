<script lang="ts">
	import { Button } from '#lib/components/ui/button/index.js';
	import * as Alert from '#lib/components/ui/alert/index.js';
	import { pageTitle } from '#lib/brand.js';
	import { useI18n } from '#lib/i18n/index.js';
	import AddNote from '#lib/features/knowledge/AddNote.svelte';
	import Attention from '#lib/features/knowledge/Attention.svelte';
	import IndexMeter from '#lib/features/knowledge/IndexMeter.svelte';
	import Library from '#lib/features/knowledge/Library.svelte';
	import type { NoteForm } from '#lib/features/knowledge/types.js';
	import type { PageProps } from './$types';

	// Go: web/knowledge/knowledge.templ IndexPage.
	let { data, form }: PageProps = $props();
	const i18n = useI18n();

	const library = $derived(data.library);
	const problems = $derived(library.problems ?? []);
	const embeddingGap = $derived(library.embeddingGap ?? 0);
	const actionError = $derived((form as NoteForm | null)?.errors?.action ?? '');
</script>

<svelte:head><title>{pageTitle(i18n.t('knowledge.title'))}</title></svelte:head>

<div class="mx-auto w-full max-w-7xl p-6 md:p-8">
	<header class="flex flex-col gap-6 border-b border-hairline pb-6 lg:flex-row lg:items-end lg:justify-between">
		<div class="max-w-xl">
			<h1 class="text-2xl font-medium tracking-tight text-balance">{i18n.t('knowledge.title')}</h1>
			<p class="mt-1 text-sm leading-relaxed text-muted-foreground">{i18n.t('knowledge.intro')}</p>
		</div>
		<IndexMeter counts={library.counts} lastRun={library.lastRun} timeZone={data.user.timezone} />
	</header>
	{#if actionError}
		<Alert.Root variant="destructive" class="mt-6">
			<Alert.Description>{actionError}</Alert.Description>
		</Alert.Root>
	{/if}
	{#if problems.length > 0 || embeddingGap > 0}
		<div class="mt-6">
			<Attention {problems} {embeddingGap} />
		</div>
	{/if}
	<div class="mt-8 grid items-start gap-8 lg:grid-cols-12">
		<section class="order-2 min-w-0 lg:order-1 lg:col-span-8">
			<Library documents={library.documents} timeZone={data.user.timezone} />
		</section>
		<aside id="add-note" class="order-1 space-y-6 lg:sticky lg:top-6 lg:order-2 lg:col-span-4 lg:self-start">
			<AddNote form={form as NoteForm | null} />
			<div class="border-t border-hairline pt-4">
				<p class="text-xs leading-relaxed text-muted-foreground">{i18n.t('knowledge.export.body')}</p>
				<div class="mt-2">
					<Button href="/app/settings/export.zip" variant="ghost" size="sm" data-sveltekit-reload>{i18n.t('knowledge.export.cta')}</Button>
				</div>
			</div>
		</aside>
	</div>
</div>
