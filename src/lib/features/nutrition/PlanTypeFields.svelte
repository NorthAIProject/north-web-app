<!--
	Go: nutrition.planTypeFields — the preset plan types and, in advanced mode,
	a custom share of the carb target. The parent holds mode and type (Go's
	x-data); this binds type.
-->
<script lang="ts">
	import MonoLabel from '#lib/components/khepri/MonoLabel.svelte';
	import { Input } from '#lib/components/ui/input/index.js';
	import { Label } from '#lib/components/ui/label/index.js';
	import { useI18n } from '#lib/i18n/index.js';
	import { FieldMessage, describedBy } from '#lib/components/ui/field-message/index.js';
	import { radioClass } from './radio.js';
	import { bandLabel, type Macros, type PlanTypeOption } from './view.js';

	let {
		prefix,
		target,
		planTypes,
		mode,
		type = $bindable(),
		customPct = '',
		errors = {}
	}: {
		prefix: string;
		target?: Macros;
		planTypes: PlanTypeOption[];
		mode: string;
		type: string;
		customPct?: string;
		errors?: Record<string, string>;
	} = $props();

	const i18n = useI18n();
	const bands = $derived(planTypes.filter((t) => t.id !== 'custom'));
</script>

<fieldset class="space-y-2" aria-describedby={describedBy(`${prefix}-type`, errors.plan_type)}>
	<legend class="mb-2"><MonoLabel text={i18n.t('nutrition.macro.carbs')} /></legend>
	{#each bands as b (b.id)}
		<div class="flex items-center gap-2">
			<input type="radio" id="{prefix}-type-{b.id}" name="plan_type" value={b.id} bind:group={type} class={radioClass} />
			<Label for="{prefix}-type-{b.id}">{bandLabel(i18n, b, target)}</Label>
		</div>
	{/each}
	<!-- x-show in Go: hidden, still in the form. -->
	<div class="flex items-center gap-2" class:hidden={mode !== 'advanced'}>
			<input type="radio" id="{prefix}-type-custom" name="plan_type" value="custom" bind:group={type} class={radioClass} />
			<Label for="{prefix}-type-custom">{i18n.t('nutrition.type.custom.choice')}</Label>
	</div>
	<FieldMessage id="{prefix}-type" error={errors.plan_type} />
</fieldset>
<div class="space-y-2" class:hidden={!(mode === 'advanced' && type === 'custom')}>
		<Label for="{prefix}-custom-carb-pct">{i18n.t('nutrition.field.custompct')}</Label>
		<Input
			id="{prefix}-custom-carb-pct"
			name="custom_carb_pct"
			type="number"
			value={customPct}
			min="0"
			max="100"
			step="1"
			aria-invalid={errors.custom_carb_pct ? 'true' : undefined}
			aria-describedby={describedBy(`${prefix}-custom-carb-pct`, errors.custom_carb_pct)}
		/>
		<FieldMessage id="{prefix}-custom-carb-pct" error={errors.custom_carb_pct} />
</div>
