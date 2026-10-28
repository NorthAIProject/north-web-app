<!--
	north-client web/progress/progress.templ newCheck + Fields: one multipart
	form, photos and numbers saved together.

	Go's estimate button hx-posted the whole form and swapped only the fields,
	so the chosen photos stayed. Here it posts the same parts to
	/api/progress/checks/estimate from the browser and fills the fields in
	place (applyEstimate), which keeps the file inputs untouched too.
-->
<script lang="ts">
	import { enhance } from '$app/forms';
	import LockIcon from '@lucide/svelte/icons/lock';
	import SparklesIcon from '@lucide/svelte/icons/sparkles';
	import { browserApi } from '#lib/api/client.js';
	import { isApiError } from '#lib/api/errors.js';
	import * as Alert from '#lib/components/ui/alert/index.js';
	import { Button } from '#lib/components/ui/button/index.js';
	import * as Card from '#lib/components/ui/card/index.js';
	import { Input } from '#lib/components/ui/input/index.js';
	import { Label } from '#lib/components/ui/label/index.js';
	import { useI18n } from '#lib/i18n/index.js';
	import PoseSlot from './PoseSlot.svelte';
	import {
		applyEstimate,
		emptyForm,
		formErrors,
		formPhotos,
		measurements,
		poses,
		type Assist,
		type EstimateNote,
		type FormValues,
		type Photo
	} from './view.js';

	let {
		today,
		assist,
		last,
		initial,
		errors = {}
	}: {
		today: string;
		assist: Assist;
		last: Photo[];
		/** Values posted back with a refusal. */
		initial: FormValues | null;
		/** Field errors from the last refused save, by the service's keys. */
		errors?: Record<string, string>;
	} = $props();

	const i18n = useI18n();
	const tr = (msg: string) => (i18n.has(msg) ? i18n.t(msg) : msg);

	let values = $state<FormValues>(emptyForm());
	let fieldErrors = $state<Record<string, string>>({});
	let saving = $state(false);
	let estimating = $state(false);
	let estimate = $state<EstimateNote | null>(null);
	let estimateError = $state('');
	// Bumped after a save, so the photo slots start empty again.
	let generation = $state(0);
	let formEl: HTMLFormElement | undefined = $state();

	// A refused save hands back what was posted (Go re-rendered with it).
	$effect.pre(() => {
		if (initial) values = { ...initial };
		fieldErrors = errors;
	});

	async function runEstimate() {
		if (!formEl) return;
		estimating = true;
		estimateError = '';
		const body = new FormData();
		for (const [pose, file] of formPhotos(new FormData(formEl))) body.set(pose, file, file.name);
		try {
			const { data } = await browserApi().POST('/progress/checks/estimate', {
				body: body as never,
				bodySerializer: (b: unknown) => b as FormData
			});
			const applied = applyEstimate(values, data!.estimate);
			values = applied.form;
			estimate = applied.note;
			fieldErrors = {};
		} catch (err) {
			estimate = null;
			if (isApiError(err) && err.status === 422 && Object.keys(err.fields).length) {
				fieldErrors = err.fields;
			} else if (isApiError(err) && err.kind === 'unavailable') {
				estimateError = i18n.t('progress.estimate.unavailable');
			} else if (isApiError(err) && err.status === 429) {
				estimateError = err.message;
			} else {
				estimateError = i18n.t('progress.estimate.failed');
			}
		} finally {
			estimating = false;
		}
	}
</script>

<Card.Root>
	<Card.Header>
		<Card.Title>{i18n.t('progress.new')}</Card.Title>
		<Card.Description>{i18n.t('progress.new.help')}</Card.Description>
	</Card.Header>
	<Card.Content>
		<form
			bind:this={formEl}
			method="post"
			action="?/create"
			enctype="multipart/form-data"
			class="space-y-6"
			data-testid="progress-form"
			use:enhance={() => {
				saving = true;
				return async ({ result, update }) => {
					saving = false;
					if (result.type === 'redirect') {
						values = emptyForm();
						estimate = null;
						estimateError = '';
						fieldErrors = {};
						generation++;
					}
					await update();
				};
			}}
		>
			{#key generation}
				<div class="grid grid-cols-1 gap-4 sm:grid-cols-3">
					{#each poses as pose (pose.name)}
						<PoseSlot pose={pose.name} required={pose.required} last={last.find((p) => p.pose === pose.name)} />
					{/each}
				</div>
			{/key}
			<p class="text-muted-foreground flex items-center gap-1.5 text-xs">
				<LockIcon class="size-3.5" />
				{i18n.t('progress.private')}
			</p>

			<div id="progress-fields" class="space-y-4" data-testid="progress-fields">
				{#if assist.available}
					<div class="border-hairline bg-surface space-y-2 rounded-md border p-3" data-testid="progress-assist">
						<Button
							type="button"
							variant="outline"
							size="sm"
							onclick={runEstimate}
							disabled={estimating}
							data-testid="progress-estimate"
						>
							<SparklesIcon class="size-4" />
							{estimating ? i18n.t('progress.estimate.working') : i18n.t('progress.estimate')}
						</Button>
						<p class="text-muted-foreground text-xs" data-testid="progress-assist-consent">
							{assist.own
								? i18n.tf('progress.estimate.consent.own', assist.label)
								: i18n.tf('progress.estimate.consent', assist.label)}
						</p>
					</div>
				{/if}
				{#if estimateError}
					<Alert.Root variant="destructive" data-testid="progress-estimate-error">
						<Alert.Description>{estimateError}</Alert.Description>
					</Alert.Root>
				{/if}
				{#if estimate}
					<Alert.Root data-testid="progress-estimate-note" role="status">
						<Alert.Title class="line-clamp-none">
							{i18n.t('progress.estimate.label')} · {i18n.t(`progress.confidence.${estimate.confidence}`)}
						</Alert.Title>
						<Alert.Description>
							{#if estimate.notes}<p>{estimate.notes}</p>{/if}
							{#if estimate.filled > 0}
								<p>{i18n.t('progress.estimate.filled')}</p>
							{:else if estimate.kept === 0}
								<p>{i18n.t('progress.estimate.none')}</p>
							{/if}
							{#if estimate.kept > 0}<p>{i18n.t('progress.estimate.kept')}</p>{/if}
						</Alert.Description>
					</Alert.Root>
				{/if}
				<div class="grid grid-cols-2 gap-4 sm:grid-cols-3">
					<!-- templUI form.Item: no component here, the same box by hand. -->
					<div class="space-y-2">
						<Label for="measured_on">{i18n.t('progress.date')}</Label>
						<Input
							id="measured_on"
							name="measured_on"
							type="date"
							value={values.measured_on || today}
							oninput={(e) => (values.measured_on = e.currentTarget.value)}
							max={today}
							aria-invalid={fieldErrors.measured_on ? 'true' : undefined}
						/>
					</div>
					{#each measurements as m (m.name)}
						<div class="space-y-2">
							<Label for="m_{m.name}">
								{i18n.t(m.key)} <span class="text-muted-foreground">({m.unit})</span>
							</Label>
							<Input
								id="m_{m.name}"
								name={m.name}
								type="number"
								value={values[m.name]}
								oninput={(e) => (values[m.name] = e.currentTarget.value)}
								step="0.1"
								min="0"
								inputmode="decimal"
								aria-invalid={fieldErrors[m.field] ? 'true' : undefined}
							/>
							{#if m.name === 'waist'}
								<p class="text-muted-foreground text-sm">{i18n.t('progress.m.waist.help')}</p>
							{/if}
						</div>
					{/each}
				</div>
				<input type="hidden" name="source" value={values.source} />
				<input type="hidden" name="assist_confidence" value={values.assist_confidence} />
				<input type="hidden" name="assist_notes" value={values.assist_notes} />
				{#each formErrors(fieldErrors) as msg, i (i)}
					<p class="text-[0.8rem] font-medium text-red-500">{tr(msg)}</p>
				{/each}
			</div>

			<Button type="submit" class="bg-signal text-background hover:bg-signal/90" disabled={saving} data-testid="progress-save">
				{saving ? i18n.t('progress.saving') : i18n.t('progress.save')}
			</Button>
		</form>
	</Card.Content>
</Card.Root>
