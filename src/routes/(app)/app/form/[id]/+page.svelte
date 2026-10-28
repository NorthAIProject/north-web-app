<script lang="ts">
	import { createQuery } from '@tanstack/svelte-query';
	import { pageTitle } from '#lib/brand.js';
	import { browserApi } from '#lib/api/client.js';
	import { Button } from '#lib/components/ui/button/index.js';
	import AnalysisStatus from '#lib/features/formcheck/AnalysisStatus.svelte';
	import { POLL_MS, inProgress, type FormCheck } from '#lib/features/formcheck/view.js';
	import { useI18n } from '#lib/i18n/index.js';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
	const i18n = useI18n();

	// Go polled GET /app/form/{id}/status every 3 s while the analysis ran and
	// swapped the fragment in; here the same check is polled from the API and
	// the fragment re-renders. Polling stops once it is done or failed. The
	// client is the app's one (root layout's QueryClientProvider).
	const query = createQuery(
		() => ({
			queryKey: ['form-check', data.check.id],
			queryFn: async (): Promise<FormCheck> => {
				const { data: fresh } = await browserApi().GET('/form-checks/{analysisID}', {
					params: { path: { analysisID: data.check.id } }
				});
				return fresh!;
			},
			initialData: data.check,
			staleTime: POLL_MS,
			refetchInterval: (q) => (inProgress(q.state.data) ? POLL_MS : false)
		})
	);
	const check = $derived(query.data ?? data.check);

	// The clip keeps the URL it was loaded with: every poll signs a new one, and
	// swapping it would reload the video.
	const playbackUrl = $derived(data.check.playbackUrl);

	let clip: HTMLVideoElement | undefined = $state();
	function seek(seconds: number) {
		if (!clip) return;
		clip.currentTime = seconds;
		void clip.play();
	}
</script>

<svelte:head><title>{pageTitle(i18n.t('form.title'))}</title></svelte:head>

<div class="mx-auto w-full max-w-3xl p-6 md:p-8">
	<header class="mb-6 flex items-center justify-between gap-4">
		<h1 class="text-2xl font-semibold tracking-tight">
			{check.result ? check.result.exercise : i18n.t('form.title')}
		</h1>
		<Button variant="outline" size="sm" href="/app/form">
			{i18n.t('form.new')}
		</Button>
	</header>
	<!-- svelte-ignore a11y_media_has_caption -->
	<video
		bind:this={clip}
		src={playbackUrl}
		controls
		playsinline
		preload="metadata"
		class="border-border mb-6 w-full rounded-lg border bg-black"
	></video>
	<AnalysisStatus {check} {seek} />
</div>
