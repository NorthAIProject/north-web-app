<!--
	The create and the edit form (Go: decisions.decisionFormCard). withOutcome is
	false on create: a call logged today has no outcome yet, and an empty "how did
	it go?" box at the moment of deciding invites a guess instead of a review.
-->
<script lang="ts">
	import { enhance, type SubmitFunction } from '$app/forms';
	import { Button } from '#lib/components/ui/button/index.js';
	import * as Card from '#lib/components/ui/card/index.js';
	import { FieldMessage, describedBy, withInvalidFocus } from '#lib/components/ui/field-message/index.js';
	import { Input } from '#lib/components/ui/input/index.js';
	import { Label } from '#lib/components/ui/label/index.js';
	import * as RadioGroup from '#lib/components/ui/radio-group/index.js';
	import { Textarea } from '#lib/components/ui/textarea/index.js';
	import DictateField from '#lib/features/voice/DictateField.svelte';
	import { useI18n } from '#lib/i18n/index.js';
	import { heldChoices, heldLabel, type DecisionForm } from './form.js';

	let {
		action,
		heading,
		submit,
		form: f,
		withOutcome
	}: { action: string; heading: string; submit: string; form: DecisionForm; withOutcome: boolean } = $props();

	const i18n = useI18n();

	// The redirect lands back on the same page: a new decision empties the form
	// as Go's full reload did, while an edit keeps showing what was saved.
	// A rejection then moves focus to the first field it names.
	const reload: SubmitFunction = withInvalidFocus(
		({ formElement }) =>
			async ({ result, update }) => {
				await update({ reset: false });
				if (result.type === 'redirect' && !withOutcome) formElement.reset();
			}
	);
	const err = (name: string) => f.errors?.[name] ?? '';
	let held = $derived(f.held);

	type Area = { name: 'options' | 'rationale' | 'outcome'; label: string; placeholder: string };
	const areas = $derived<Area[]>([
		{ name: 'options', label: 'decisions.form.options', placeholder: 'decisions.form.options_ph' },
		{ name: 'rationale', label: 'decisions.form.rationale', placeholder: 'decisions.form.rationale_ph' },
		...(withOutcome
			? [{ name: 'outcome', label: 'decisions.form.outcome', placeholder: 'decisions.form.outcome_ph' } as Area]
			: [])
	]);
</script>

<Card.Root class="border-hairline bg-surface">
	<Card.Header>
		<Card.Title>{heading}</Card.Title>
	</Card.Header>
	<Card.Content>
		<form method="post" {action} class="space-y-4" use:enhance={reload}>
			<div class="space-y-2">
				<Label for="title" error={err('title')}>{i18n.t('decisions.form.title')}</Label>
				<Input
					id="title"
					name="title"
					value={f.title}
					placeholder={i18n.t('decisions.form.title_ph')}
					aria-invalid={err('title') ? true : undefined}
					aria-describedby={describedBy('title', err('title'))}
				/>
				<FieldMessage id="title" error={err('title')} />
			</div>
			{#each areas as a (a.name)}
				<div class="space-y-2">
					<Label for={a.name} error={err(a.name)}>{i18n.t(a.label)}</Label>
					<DictateField target={a.name}>
						<Textarea
							id={a.name}
							name={a.name}
							rows={3}
							placeholder={i18n.t(a.placeholder)}
							value={f[a.name]}
							aria-invalid={err(a.name) ? true : undefined}
							aria-describedby={describedBy(a.name, err(a.name))}
						/>
					</DictateField>
					<FieldMessage id={a.name} error={err(a.name)} />
				</div>
			{/each}
			{#if withOutcome}
				<div class="space-y-2">
					<Label id="held-label" error={err('held')}>{i18n.t('decisions.form.held')}</Label>
					<RadioGroup.Root
						name="held"
						bind:value={held}
						class="flex flex-wrap gap-4"
						aria-labelledby="held-label"
						aria-describedby={describedBy('held', err('held'))}
					>
						{#each heldChoices as c (c.id)}
							<div class="flex items-center gap-2">
								<RadioGroup.Item id="held-{c.id}" value={c.value} />
								<Label for="held-{c.id}">{heldLabel(i18n, c.value)}</Label>
							</div>
						{/each}
					</RadioGroup.Root>
					<FieldMessage id="held" error={err('held')} />
				</div>
			{/if}
			<Button type="submit">{submit}</Button>
		</form>
	</Card.Content>
</Card.Root>
