<!-- Units, default objective and macro split (Go: settings.preferencesCard). -->
<script lang="ts">
	import { enhance } from '$app/forms';
	import { Button } from '#lib/components/ui/button/index.js';
	import * as Card from '#lib/components/ui/card/index.js';
	import { Label } from '#lib/components/ui/label/index.js';
	import { useI18n } from '#lib/i18n/index.js';
	import FieldMessage from './FieldMessage.svelte';
	import FormSelect from './FormSelect.svelte';
	import type { FieldErrors } from './form.js';
	import { goalOptions, splitOptions, unitsOptions } from './options.js';

	let {
		values,
		errors = {}
	}: { values: { unitsSystem: string; defaultGoal: string; defaultMacroSplit: string }; errors?: FieldErrors } = $props();

	const i18n = useI18n();
	const groups = (opts: { value: string; key: string }[]) => [{ options: opts.map((o) => ({ value: o.value, label: i18n.t(o.key) })) }];
</script>

<Card.Root class="border-hairline bg-surface">
	<Card.Header>
		<Card.Title>{i18n.t('settings.prefs.title')}</Card.Title>
		<Card.Description>{i18n.t('settings.prefs.desc')}</Card.Description>
	</Card.Header>
	<Card.Content>
		<form method="post" action="?/preferences" class="space-y-4" use:enhance={() => async ({ update }) => update({ reset: false })}>
			<div class="space-y-2">
				<Label for="units_system">{i18n.t('settings.prefs.units')}</Label>
				<FormSelect id="units_system" name="units_system" value={values.unitsSystem} placeholder={i18n.t('settings.prefs.metric')} groups={groups(unitsOptions)} />
				<FieldMessage message={errors.units_system} />
			</div>
			<div class="space-y-2">
				<Label for="default_goal">{i18n.t('settings.prefs.objective')}</Label>
				<FormSelect id="default_goal" name="default_goal" value={values.defaultGoal} placeholder={i18n.t('settings.prefs.maintenance')} groups={groups(goalOptions)} />
				<FieldMessage message={errors.default_goal} />
			</div>
			<div class="space-y-2">
				<Label for="default_macro_split">{i18n.t('settings.prefs.macro')}</Label>
				<FormSelect
					id="default_macro_split"
					name="default_macro_split"
					value={values.defaultMacroSplit}
					placeholder={i18n.t('settings.prefs.modcarb')}
					groups={groups(splitOptions)}
				/>
				<FieldMessage message={errors.default_macro_split} />
			</div>
			<Button type="submit" class="bg-signal text-background hover:bg-signal/90">{i18n.t('settings.prefs.save')}</Button>
		</form>
	</Card.Content>
</Card.Root>
