<!--
	Too little history to forecast anything. No scrubber and no numbers: a
	line drawn through three points would be a guess with a chart. Instead,
	exactly what is missing, each as progress toward enough.
-->
<script lang="ts">
	import { useI18n } from '#lib/i18n/index.js';
	import type { Horizon } from './view.js';

	let { needs }: { needs: Horizon['needs'] } = $props();
	const i18n = useI18n();
</script>

<section class="rounded-2xl border border-hairline bg-surface p-5" data-testid="horizon-low-data">
	<h2 class="text-base font-medium">{i18n.t('horizon.low.title')}</h2>
	<p class="mt-1 text-sm leading-relaxed text-muted-foreground">{i18n.t('horizon.low.body')}</p>
	<ul class="mt-4 space-y-3">
		{#each needs as need (need.code + need.text)}
			<li>
				<p class="text-sm">{need.text}</p>
				<div
					class="mt-1.5 h-1 overflow-hidden rounded-full bg-hairline"
					role="progressbar"
					aria-valuemin="0"
					aria-valuemax={need.want}
					aria-valuenow={Math.min(need.have, need.want)}
					aria-label={need.text}
				>
					<div
						class="h-full rounded-full bg-foreground/70"
						style:width="{need.want > 0 ? Math.min(need.have / need.want, 1) * 100 : 0}%"
					></div>
				</div>
			</li>
		{/each}
	</ul>
</section>
