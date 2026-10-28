<!--
	The set logger: today's sets and a form for the next one (north-client
	web/lifts/today.templ TodayCard, loaded in Go by LoaderCard from
	GET /app/lifts/today). Self-contained: it loads its own data through the
	/api proxy and handles log and undo itself, so a page embeds <TodayCard />.
	After a log the exercise, weight, reps and kind stay filled in, so the next
	set of the same exercise is one tap; effort is per set and is cleared.
-->
<script lang="ts">
	import XIcon from '@lucide/svelte/icons/x';
	import { browserApi } from '#lib/api/client.js';
	import { isApiError } from '#lib/api/errors.js';
	import { Button } from '#lib/components/ui/button/index.js';
	import * as Card from '#lib/components/ui/card/index.js';
	import { Input } from '#lib/components/ui/input/index.js';
	import { Label } from '#lib/components/ui/label/index.js';
	import { radioClass } from '#lib/features/weekly/radio.js';
	import { useI18n } from '#lib/i18n/index.js';
	import { emptyForm, kinds, loadLabel, parseSetForm, rirLabel, type LiftSet } from './sets.js';

	const i18n = useI18n();
	const api = browserApi();

	let loaded = $state(false);
	let sets = $state<LiftSet[]>([]);
	let recent = $state<string[]>([]);
	let form = $state(emptyForm());
	let error = $state('');
	let busy = $state(false);

	const kindLabel: Record<string, string> = {
		work: 'lifts.kind.work',
		warmup: 'lifts.kind.warmup',
		drop: 'lifts.kind.drop'
	};

	async function refresh() {
		const { data } = await api.GET('/lifts/today');
		sets = data!.sets;
		recent = data!.recent;
		loaded = true;
	}

	$effect(() => {
		refresh().catch(() => {
			// Go's LoaderCard leaves the placeholder empty when the fragment fails.
		});
	});

	/** A refused set keeps what was typed and says why (Go: 200 with the message in the card). */
	function messageFor(err: unknown): string {
		if (isApiError(err) && err.status === 422) {
			const first = Object.values(err.fields)[0];
			return first || err.message;
		}
		return i18n.t('lifts.err.generic');
	}

	async function logSet(event: SubmitEvent) {
		event.preventDefault();
		const parsed = parseSetForm(form);
		if ('error' in parsed) {
			error = i18n.t(parsed.error);
			return;
		}
		busy = true;
		try {
			await api.POST('/lifts/sets', { body: parsed.input });
			form.rir = '';
			error = '';
			await refresh();
		} catch (err) {
			error = messageFor(err);
		} finally {
			busy = false;
		}
	}

	async function undo(set: LiftSet) {
		busy = true;
		try {
			await api.DELETE('/lifts/sets/{setID}', { params: { path: { setID: set.id } } });
		} catch (err) {
			// Already gone is what was wanted.
			if (!(isApiError(err) && err.status === 404)) {
				error = messageFor(err);
				busy = false;
				return;
			}
		}
		form = emptyForm();
		error = '';
		try {
			await refresh();
		} finally {
			busy = false;
		}
	}
</script>

{#if !loaded}
	<div data-testid="set-logger-loading"></div>
{:else}
	<section id="set-logger" class="mb-6" data-testid="set-logger">
		<Card.Root class="border-hairline bg-surface">
			<Card.Header>
				<div class="flex items-baseline justify-between gap-3">
					<Card.Title class="text-base">{i18n.t('lifts.today.title')}</Card.Title>
					<a
						href="/app/lifts/import"
						class="text-muted-foreground hover:text-foreground text-xs underline-offset-4 hover:underline"
						>{i18n.t('lifts.today.import')}</a
					>
				</div>
				<Card.Description>{i18n.t('lifts.today.desc')}</Card.Description>
			</Card.Header>
			<Card.Content class="space-y-4">
				<form class="space-y-3" onsubmit={logSet}>
					<div class="space-y-1.5">
						<Label for="set-exercise">{i18n.t('lifts.form.exercise')}</Label>
						<Input
							id="set-exercise"
							name="exercise"
							bind:value={form.exercise}
							placeholder={i18n.t('lifts.form.exercise.ph')}
							required
							list="set-exercise-recent"
							autocomplete="off"
							maxlength={120}
						/>
						<!-- Native datalist: suggestions without a combobox, and the input still takes any name. -->
						<datalist id="set-exercise-recent">
							{#each recent as name (name)}
								<option value={name}></option>
							{/each}
						</datalist>
					</div>
					<div class="grid grid-cols-3 gap-2">
						<div class="space-y-1.5">
							<Label for="set-weight">{i18n.t('lifts.form.kg')}</Label>
							<Input
								id="set-weight"
								name="weight_kg"
								type="number"
								bind:value={form.weightKg}
								placeholder="0"
								step="0.5"
								min="0"
								max="600"
								inputmode="decimal"
							/>
						</div>
						<div class="space-y-1.5">
							<Label for="set-reps">{i18n.t('lifts.form.reps')}</Label>
							<Input
								id="set-reps"
								name="reps"
								type="number"
								bind:value={form.reps}
								placeholder="8"
								required
								min="1"
								max="100"
								inputmode="numeric"
							/>
						</div>
						<div class="space-y-1.5">
							<Label for="set-rir">{i18n.t('lifts.form.rir')}</Label>
							<Input
								id="set-rir"
								name="rir"
								type="number"
								bind:value={form.rir}
								placeholder="—"
								min="0"
								max="10"
								inputmode="numeric"
								aria-describedby="set-rir-help"
							/>
						</div>
					</div>
					<p id="set-rir-help" class="text-muted-foreground text-xs">{i18n.t('lifts.form.rir.help')}</p>
					<fieldset class="flex flex-wrap gap-4">
						<legend class="sr-only">{i18n.t('lifts.form.kind')}</legend>
						{#each kinds as value (value)}
							<div class="flex items-center gap-2">
								<input
									type="radio"
									id="set-kind-{value}"
									name="kind"
									{value}
									checked={value === form.kind || (form.kind === '' && value === 'work')}
									onchange={() => (form.kind = value)}
									class={radioClass}
								/>
								<Label for="set-kind-{value}" class="text-sm font-normal">{i18n.t(kindLabel[value])}</Label>
							</div>
						{/each}
					</fieldset>
					{#if error}
						<p class="text-destructive text-sm" role="alert">{error}</p>
					{/if}
					<Button type="submit" class="w-full" disabled={busy}>{i18n.t('lifts.form.submit')}</Button>
				</form>
				{#if sets.length > 0}
					<ul class="divide-border divide-y" aria-label={i18n.t('lifts.list.aria')}>
						{#each sets as s (s.id)}
							{@const load = loadLabel(i18n, s)}
							{@const rir = rirLabel(i18n, s)}
							<li
								class={['flex items-center justify-between gap-3 py-2 text-sm', s.kind === 'warmup' && 'text-muted-foreground']}
							>
								<span class="min-w-0 truncate">
									<span class="font-medium">{s.exerciseName}</span>
									<span class="tabular-nums"> · {load}</span>
									{#if s.kind === 'warmup'}
										<span class="font-mono text-[10px] tracking-[0.14em] uppercase"> · {i18n.t('lifts.kind.warmup')}</span>
									{:else if s.kind === 'drop'}
										<span class="font-mono text-[10px] tracking-[0.14em] uppercase"> · {i18n.t('lifts.list.drop')}</span>
									{/if}
									{#if rir}
										<span class="text-muted-foreground"> · {rir}</span>
									{/if}
								</span>
								<Button
									type="button"
									variant="ghost"
									size="icon"
									disabled={busy}
									aria-label={i18n.tf('lifts.list.remove', s.exerciseName, load)}
									onclick={() => undo(s)}
								>
									<XIcon class="size-4" />
								</Button>
							</li>
						{/each}
					</ul>
				{/if}
			</Card.Content>
		</Card.Root>
	</section>
{/if}
