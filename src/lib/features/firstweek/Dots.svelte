<!-- The seven days, filled when done (web/firstweek card.templ dots). -->
<script lang="ts">
	import { useI18n } from '#lib/i18n/index.js';
	import { dotClass } from './firstweek.js';

	let { days, today }: { days: boolean[]; today: number } = $props();
	const i18n = useI18n();
	const doneCount = $derived(days.filter(Boolean).length);
</script>

<div class="flex items-center gap-1" role="img" aria-label={i18n.tf('firstweek.card.progress', doneCount)}>
	{#each days as done, i (i)}
		<span class={dotClass(i + 1, today, done)} data-day={i + 1} data-done={String(done)}></span>
	{/each}
</div>
