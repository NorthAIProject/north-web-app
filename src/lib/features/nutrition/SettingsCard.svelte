<!-- Go: nutrition.settingsCard and switchToEasy. -->
<script lang="ts">
	import { enhance } from '$app/forms';
	import { Button, buttonVariants } from '#lib/components/ui/button/index.js';
	import * as Card from '#lib/components/ui/card/index.js';
	import * as Dialog from '#lib/components/ui/dialog/index.js';
	import { Input } from '#lib/components/ui/input/index.js';
	import { Label } from '#lib/components/ui/label/index.js';
	import { useI18n } from '#lib/i18n/index.js';
	import { FieldMessage, describedBy, withInvalidFocus } from '#lib/components/ui/field-message/index.js';
	import PlanTypeFields from './PlanTypeFields.svelte';
	import { advanced, errorFor, errorsFor, type PlanPage } from './plan-page.js';
	import { gramsValue } from './view.js';

	let { page }: { page: PlanPage } = $props();
	const i18n = useI18n();

	const plan = $derived(page.plan);
	const disabled = $derived(!page.target);
	// Go's x-data on each form: the plan's own mode and type.
	let type = $derived<string>(plan.planType);
	// Switching to easy needs a preset: a custom plan starts from mid carb.
	let easyType = $derived<string>(['no_carb', 'low_carb', 'mid_carb', 'high_carb'].includes(plan.planType) ? plan.planType : 'mid_carb');
	let easyOpen = $state(false);
</script>

<Card.Root class="border-hairline bg-surface">
	<Card.Header>
		<Card.Title>{i18n.t('nutrition.settings.title')}</Card.Title>
	</Card.Header>
	<Card.Content class="space-y-4">
		<form method="post" action="?/settings" class="space-y-4" use:enhance={withInvalidFocus()}>
			<input type="hidden" name="mode" value={plan.mode} />
			<fieldset class="space-y-4" {disabled}>
				<div class="space-y-2">
					<Label for="plan-name">{i18n.t('nutrition.field.name')}</Label>
					<Input
						id="plan-name"
						name="name"
						value={plan.name}
						required
						aria-invalid={errorFor(page, 'settings', 'name') ? 'true' : undefined}
						aria-describedby={describedBy('plan-name', errorFor(page, 'settings', 'name'))}
					/>
					<FieldMessage id="plan-name" error={errorFor(page, 'settings', 'name')} />
				</div>
				<div class="space-y-2">
					<Label for="plan-description">{i18n.t('nutrition.field.description')}</Label>
					<Input id="plan-description" name="description" value={plan.description} />
				</div>
				<PlanTypeFields
					prefix="settings"
					target={page.target}
					planTypes={page.planTypes}
					mode={plan.mode}
					bind:type
					customPct={gramsValue(plan.customCarbPct)}
					errors={errorsFor(page, 'settings')}
				/>
				<Button type="submit" variant="outline">{i18n.t('nutrition.settings.save')}</Button>
			</fieldset>
		</form>
		{#if advanced(page)}
			<!-- Asks first: every day loses its own target. -->
			<Dialog.Root bind:open={easyOpen}>
				<Dialog.Trigger class={buttonVariants({ variant: 'ghost', size: 'sm' })} {disabled}>
					{i18n.t('nutrition.settings.toeasy')}
				</Dialog.Trigger>
				<Dialog.Content>
					<form method="post" action="?/settings" use:enhance={() => async ({ update }) => {
						easyOpen = false;
						await update();
					}}>
						<input type="hidden" name="name" value={plan.name} />
						<input type="hidden" name="description" value={plan.description} />
						<input type="hidden" name="mode" value="easy" />
						<input type="hidden" name="confirm_reset" value="1" />
						<Dialog.Header>
							<Dialog.Title>{i18n.t('nutrition.settings.toeasy.title')}</Dialog.Title>
							<Dialog.Description>{i18n.t('nutrition.settings.toeasy.desc')}</Dialog.Description>
						</Dialog.Header>
						<div class="space-y-2 py-4">
							<PlanTypeFields prefix="easy" target={page.target} planTypes={page.planTypes} mode="easy" bind:type={easyType} />
						</div>
						<Dialog.Footer>
							<Dialog.Close type="button" class={buttonVariants({ variant: 'outline' })}>
								{i18n.t('nutrition.settings.keepadvanced')}
							</Dialog.Close>
							<Button type="submit">{i18n.t('nutrition.settings.toeasy')}</Button>
						</Dialog.Footer>
					</form>
				</Dialog.Content>
			</Dialog.Root>
		{:else}
			<form method="post" action="?/settings" use:enhance>
				<input type="hidden" name="name" value={plan.name} />
				<input type="hidden" name="description" value={plan.description} />
				<input type="hidden" name="plan_type" value={plan.planType} />
				<input type="hidden" name="mode" value="advanced" />
				<p class="text-muted-foreground mb-2 text-sm">{i18n.t('nutrition.settings.advanced.desc')}</p>
				<Button type="submit" variant="ghost" size="sm" {disabled}>{i18n.t('nutrition.settings.toadvanced')}</Button>
			</form>
		{/if}
	</Card.Content>
</Card.Root>
