<!-- The seven weekday boxes the habit and reminder forms share. -->
<script lang="ts">
	import { Checkbox } from '#lib/components/ui/checkbox/index.js';
	import { useI18n } from '#lib/i18n/index.js';
	import { weekdayLabel, weekdays } from './format.js';

	let { checked, idPrefix }: { checked: (day: number) => boolean; idPrefix: string } = $props();
	const i18n = useI18n();
</script>

<div class="mt-2 flex flex-wrap gap-3">
	{#each weekdays as d (d)}
		<label class="flex items-center gap-1 text-sm">
			<Checkbox id="{idPrefix}-{d}" name="days_of_week" value={String(d)} checked={checked(d)} />
			{weekdayLabel(i18n, d)}
		</label>
	{/each}
</div>
