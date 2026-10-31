<!--
	Who answers the coach: Khepri's own providers or the person's key (Go:
	settings.providerCard). Local state only says which half of the form shows;
	which provider is used is decided on the server, from the stored credential.
-->
<script lang="ts">
	import { enhance } from '$app/forms';
	import { Button } from '#lib/components/ui/button/index.js';
	import * as Card from '#lib/components/ui/card/index.js';
	import { Input } from '#lib/components/ui/input/index.js';
	import { Label } from '#lib/components/ui/label/index.js';
	import { useI18n } from '#lib/i18n/index.js';
	import BrandIcon from './BrandIcon.svelte';
	import FieldDescription from './FieldDescription.svelte';
	import { FieldMessage, describedBy, withInvalidFocus } from '#lib/components/ui/field-message/index.js';
	import type { FieldErrors } from './form.js';
	import type { AISettings } from './types.js';

	type Values = { provider: string; model: string; baseUrl: string };

	let { ai, values, errors = {} }: { ai: AISettings; values?: Values; errors?: FieldErrors } = $props();

	const i18n = useI18n();

	// A rejected submission comes back as typed; otherwise the stored
	// credential, or OpenRouter for somebody choosing for the first time.
	const initial = $derived<Values>(
		values ??
			(ai.current
				? { provider: ai.current.provider, model: ai.current.model ?? '', baseUrl: ai.current.baseUrl ?? '' }
				: { provider: 'openrouter', model: '', baseUrl: '' })
	);
	// The radio group's own value, "north" or "own".
	let mode = $derived(ai.current || values ? 'own' : 'north');
	let provider = $derived(initial.provider);

	const entry = $derived(ai.providers.find((p) => p.name === provider));
	const needsURL = $derived(Boolean(entry?.requiresBaseUrl));
	const keyPlaceholder = $derived(entry ? (entry.keyHint ?? '') : i18n.t('settings.conn.ai.key.ph'));
	const failing = $derived(Boolean(ai.current?.lastError));
	const toolsUnsupported = $derived(ai.current?.supportsTools === false);
</script>

<Card.Root class="border-hairline bg-surface">
	<Card.Header>
		<Card.Title>{i18n.t('conn.ai.title')}</Card.Title>
		<Card.Description>{i18n.t('conn.ai.desc')}</Card.Description>
	</Card.Header>
	<Card.Content>
		{#if !ai.enabled}
			<p class="text-muted-foreground text-sm leading-relaxed">{i18n.t('conn.ai.noenc')}</p>
		{:else}
			{#if failing}
				<p class="text-[0.8rem] font-medium text-destructive">{ai.current?.lastError} {i18n.t('settings.conn.ai.fallback')}</p>
			{/if}
			<!-- A working key that cannot run the coach's tools: nothing else about it looks wrong. -->
			{#if toolsUnsupported}
				<p class="text-[0.8rem] font-medium text-destructive">{i18n.t('conn.ai.notools')}</p>
			{/if}
			<form method="post" action="?/ai" class="space-y-4" use:enhance={withInvalidFocus(() => async ({ update }) => update({ reset: false }))}>
				<fieldset class="space-y-2">
					<legend class="sr-only">{i18n.t('conn.ai.title')}</legend>
					<label class="flex items-start gap-2 text-sm">
						<input type="radio" name="mode" value="north" bind:group={mode} class="mt-1" />
						<span>
							<span class="font-medium">{i18n.t('settings.conn.ai.khepri')}</span>
							<span class="text-muted-foreground block text-xs leading-relaxed">{i18n.t('conn.ai.free')}</span>
						</span>
					</label>
					<label class="flex items-start gap-2 text-sm">
						<input type="radio" name="mode" value="own" bind:group={mode} class="mt-1" />
						<span>
							<span class="font-medium">{i18n.t('settings.conn.ai.own')}</span>
							<span class="text-muted-foreground block text-xs leading-relaxed">{i18n.t('conn.ai.pays')}</span>
						</span>
					</label>
				</fieldset>
				{#if mode === 'own'}
					<div class="space-y-4 pt-2">
						<fieldset class="space-y-2" aria-describedby={describedBy('provider', errors.provider)}>
							<legend class="mb-2 text-sm leading-none font-medium">{i18n.t('conn.ai.provider')}</legend>
							<div class="grid grid-cols-2 gap-2 sm:grid-cols-3">
								{#each ai.providers as p (p.name)}
									<!-- A real radio, visually hidden, with the tile as its label. -->
									<label class="cursor-pointer">
										<input type="radio" name="provider" value={p.name} bind:group={provider} class="peer sr-only" />
										<span
											class="border-hairline peer-checked:border-signal peer-checked:bg-signal/5 peer-focus-visible:ring-ring/50 hover:bg-accent/40 flex h-full flex-col gap-1.5 rounded-lg border p-3 transition-colors peer-focus-visible:ring-[3px]"
										>
											<span class="flex items-center gap-2">
												<span class="[&_svg]:size-5"><BrandIcon name={p.name} /></span>
												<span class="text-sm font-medium">{p.label}</span>
											</span>
											{#if p.note}
												<span class="text-muted-foreground text-xs leading-relaxed">{p.note}</span>
											{/if}
										</span>
									</label>
								{/each}
							</div>
							<FieldMessage id="provider" error={errors.provider} />
						</fieldset>
						<!-- Only for a provider with no public address of its own (Hermes). -->
						{#if needsURL}
							<div class="space-y-2">
								<Label for="base_url">{i18n.t('conn.ai.gateway')}</Label>
								<Input
									id="base_url"
									name="base_url"
									value={initial.baseUrl}
									placeholder="http://hermes-box.ts.net:8642/v1"
									aria-invalid={errors.base_url ? true : undefined}
									aria-describedby={describedBy('base_url', errors.base_url)}
								/>
								<FieldMessage id="base_url" error={errors.base_url} />
								<FieldDescription>{i18n.t('conn.ai.instance')}</FieldDescription>
							</div>
						{/if}
						<div class="space-y-2">
							<Label for="api_key">{i18n.t('conn.ai.apikey')}</Label>
							<Input
								id="api_key"
								name="api_key"
								type="password"
								placeholder={keyPlaceholder}
								aria-invalid={errors.api_key ? true : undefined}
								aria-describedby={describedBy('api_key', errors.api_key)}
							/>
							<FieldMessage id="api_key" error={errors.api_key} />
							<FieldDescription>
								{ai.current ? i18n.tf('conn.ai.stored', ai.current.keyHint) : i18n.t('conn.ai.encrypted')}
							</FieldDescription>
						</div>
						<div class="space-y-2">
							<Label for="model">{i18n.t('conn.ai.model')}</Label>
							<Input
								id="model"
								name="model"
								value={initial.model}
								placeholder={entry?.defaultModel ?? ''}
								aria-invalid={errors.model ? true : undefined}
								aria-describedby={describedBy('model', errors.model)}
							/>
							<FieldMessage id="model" error={errors.model} />
							<FieldDescription>{i18n.t('conn.ai.model.desc')}</FieldDescription>
						</div>
						<Button type="submit">{i18n.t('conn.ai.save')}</Button>
						<p class="text-muted-foreground text-xs leading-relaxed">
							{i18n.t('conn.ai.claude')}
							<code class="font-mono">anthropic/</code>.
						</p>
					</div>
				{/if}
			</form>
			{#if ai.current}
				<form method="post" action="?/aiRemove" class="border-hairline mt-4 border-t pt-4" use:enhance>
					<Button type="submit" variant="outline" size="sm">{i18n.t('conn.ai.remove')}</Button>
				</form>
			{/if}
		{/if}
	</Card.Content>
</Card.Root>
