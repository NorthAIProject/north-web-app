<!--
	The muscle viewer on its own, for a caller that knows only a slug — the
	coach's transcript (Go: GET /app/exercises/{slug}/muscles, MusclePartial).
	Fetches the exercise through the /api proxy with TanStack Query.
-->
<script lang="ts">
	import { createQuery } from '@tanstack/svelte-query';
	import { browserApi } from '#lib/api/client.js';
	import ExerciseArt from '#lib/components/khepri/ExerciseArt.svelte';
	import ExerciseArtCredit from '#lib/components/khepri/ExerciseArtCredit.svelte';
	import MuscleViewer from '#lib/components/khepri/MuscleViewer.svelte';
	import { useI18n } from '#lib/i18n/index.js';
	import type { components } from '#lib/api/generated/schema.js';

	let { slug }: { slug: string } = $props();
	const i18n = useI18n();

	// Cached per slug, so a transcript naming the same exercise twice fetches it once.
	// An unknown slug (a message naming an exercise since removed) renders nothing.
	const query = createQuery(() => ({
		queryKey: ['exercises', 'detail', slug],
		queryFn: async () => {
			const { data } = await browserApi().GET('/exercises/{slug}', { params: { path: { slug } } });
			return data!;
		},
		staleTime: Infinity,
		retry: false
	}));
	const e = $derived(query.data ?? null);
</script>

{#snippet viewer(ex: components['schemas']['ExerciseDetail'])}
	<MuscleViewer
		id="coach-muscles-{ex.slug}"
		primary={ex.primaryMuscles}
		secondary={ex.secondaryMuscles}
		exerciseName={ex.name}
	/>
{/snippet}

{#if e}
	<figure class="mt-3 w-full max-w-[85%]">
		{#if e.illustrationSlug}
			<div class="grid grid-cols-2 gap-2">
				<ExerciseArt
					id="coach-art-{e.slug}"
					slug={e.illustrationSlug}
					name={e.name}
					class="border-hairline bg-surface rounded-lg border p-2"
				/>
				{@render viewer(e)}
			</div>
		{:else}
			{@render viewer(e)}
		{/if}
		<figcaption class="text-muted-foreground mt-2 text-xs">
			{i18n.t('exercises.partial.before')}
			<a href="/app/exercises/{e.slug}" class="underline underline-offset-2">{e.name}</a>{i18n.t('exercises.partial.after')}
			{#if e.illustrationSlug}
				<ExerciseArtCredit />
			{/if}
		</figcaption>
	</figure>
{/if}
