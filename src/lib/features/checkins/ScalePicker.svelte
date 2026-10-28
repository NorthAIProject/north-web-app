<!--
	A 1–5 radio group (Go scalePicker / optionalScalePicker). The inputs are
	visually replaced by the squares but stay real radios, so keyboard and
	screen-reader users get the group for free. `optional` adds a first "Skip"
	option that submits an empty value, checked when nothing was given.
-->
<script lang="ts">
	import { useI18n } from '#lib/i18n/index.js';

	let {
		name,
		legend,
		current,
		optional = false
	}: { name: string; legend: string; current: number; optional?: boolean } = $props();

	const i18n = useI18n();
	const square =
		'flex min-h-11 w-full items-center justify-center rounded-lg border border-hairline peer-checked:border-signal peer-checked:bg-signal/15 peer-checked:text-signal peer-focus-visible:ring-2 peer-focus-visible:ring-ring';
</script>

<fieldset class="space-y-1.5">
	<legend class="sr-only">{i18n.tf('checkins.scale.legend', legend)}</legend>
	<div class="flex gap-2">
		{#if optional}
			<label class="flex-1 cursor-pointer">
				<input
					type="radio"
					{name}
					value=""
					class="peer sr-only"
					aria-label={i18n.t('checkins.scale.skip')}
					checked={current < 1 || current > 5}
				/>
				<span class="{square} text-muted-foreground text-xs">{i18n.t('checkins.scale.skip')}</span>
			</label>
		{/if}
		{#each [1, 2, 3, 4, 5] as i (i)}
			<label class="flex-1 cursor-pointer">
				<input
					type="radio"
					{name}
					value={String(i)}
					class="peer sr-only"
					aria-label={i18n.tf('checkins.scale.option', legend, i)}
					checked={i === current}
				/>
				<span class="{square} text-sm font-medium">{i}</span>
			</label>
		{/each}
	</div>
	<div class="text-muted-foreground flex justify-between text-[10px]">
		<span>{i18n.t('checkins.scale.low')}</span>
		<span>{i18n.t('checkins.scale.high')}</span>
	</div>
</fieldset>
