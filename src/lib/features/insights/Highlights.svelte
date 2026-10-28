<!-- north-client web/insights/summary.templ highlights: the sentences worth noticing. -->
<script lang="ts">
	import SparklesIcon from '@lucide/svelte/icons/sparkles';
	import MonoLabel from '#lib/components/khepri/MonoLabel.svelte';
	import { useI18n } from '#lib/i18n/index.js';

	let { lines }: { lines: string[] } = $props();
	const i18n = useI18n();
</script>

<section class="space-y-3">
	<MonoLabel text={i18n.t('insights.summary.highlights')} />
	<ul class="border-hairline bg-surface/60 divide-hairline divide-y rounded-lg border">
		{#each lines as line, i (i)}
			<li class="flex items-start gap-2.5 p-4">
				<SparklesIcon class="text-signal mt-0.5 size-3.5 shrink-0" />
				<p class="text-sm leading-relaxed">{line}</p>
			</li>
		{/each}
	</ul>
</section>
