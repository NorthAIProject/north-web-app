<!--
	Something to click in an empty thread (Go: conversationStarters). A
	starter fills the composer rather than sending it, so the person still
	makes it their own. No mascot: the header avatar sits directly above.
-->
<script lang="ts">
	import MonoLabel from '#lib/components/khepri/MonoLabel.svelte';
	import { useI18n } from '#lib/i18n/index.js';
	import { starters } from './copy.js';

	let { onpick }: { onpick: (starter: string) => void } = $props();

	const i18n = useI18n();
</script>

<div class="flex flex-col items-center gap-4 py-8 text-center">
	<MonoLabel text={i18n.t('chat.thread.mono')} />
	<h2 class="text-lg font-medium tracking-tight">{i18n.t('chat.thread.heading')}</h2>
	<p class="text-muted-foreground max-w-sm text-sm leading-relaxed">{i18n.t('chat.thread.body')}</p>
	<div class="mt-2 grid w-full max-w-lg gap-2 sm:grid-cols-2">
		{#each starters(i18n) as starter (starter)}
			<button
				type="button"
				onclick={() => onpick(starter)}
				class="border-hairline bg-surface hover:bg-accent/50 min-h-11 rounded-lg border p-3 text-left text-sm transition-colors"
			>
				{starter}
			</button>
		{/each}
	</div>
</div>
