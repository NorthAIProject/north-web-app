<script lang="ts">
	import { enhance } from '$app/forms';
	import { Badge } from '#lib/components/ui/badge/index.js';
	import { Button } from '#lib/components/ui/button/index.js';
	import * as Card from '#lib/components/ui/card/index.js';
	import { FieldMessage, describe, describedBy, withInvalidFocus } from '#lib/components/ui/field-message/index.js';
	import { Input } from '#lib/components/ui/input/index.js';
	import * as InputOTP from '#lib/components/ui/inputotp/index.js';
	import { Label } from '#lib/components/ui/label/index.js';
	import SearchSelect from '#lib/components/khepri/SearchSelect.svelte';
	import { useI18n } from '#lib/i18n/index.js';
	import PostForm from './PostForm.svelte';
	import { countryName } from './format.js';
	import type { FriendsForm, PhoneCountries, PhoneView } from './types.js';

	// Go: phoneCard, phoneStartForm, phoneCodeForm (web/social/finding.templ).
	let {
		phone,
		countries,
		form
	}: { phone: PhoneView; countries: PhoneCountries; form: FriendsForm } = $props();
	const i18n = useI18n();

	const err = (name: string) => form.errors?.[name] ?? '';
	// What the select shows: what was just submitted, else the account's best guess (Go: countryValue).
	// svelte-ignore state_referenced_locally
	let dial = $state(form.country || countries.defaultDial);
	let busy = $state(false);
	const submit = withInvalidFocus(() => {
		busy = true;
		return async ({ update }) => {
			await update({ reset: false });
			busy = false;
		};
	});
</script>

<Card.Root id="phone-card" class="border-hairline bg-surface">
	<Card.Header>
		<Card.Title>{i18n.t('social.phone.title')}</Card.Title>
		<Card.Description>{i18n.t('social.phone.desc')}</Card.Description>
	</Card.Header>
	<Card.Content>
		<div class="space-y-4">
			{#if phone.number}
				<div class="flex items-center gap-3">
					<p class="flex-1 font-mono text-sm">{phone.number}</p>
					<Badge variant="secondary">{i18n.t('social.phone.verified')}</Badge>
					<PostForm action="/app/friends?/phoneRemove">
						<Button type="submit" variant="ghost" size="sm">{i18n.t('social.remove')}</Button>
					</PostForm>
				</div>
			{/if}
			{#if phone.configured}
				{#if phone.pending}
					<form
						method="post"
						action="/app/friends?/phoneCheck"
						class="space-y-3"
						use:enhance={submit}
					>
						<div class="space-y-2" {@attach describe('code', describedBy('code', err('code')))}>
							<Label for="code" error={err('code')}
								>{i18n.tf('social.phone.code', phone.pending)}</Label
							>
							<!-- Keyed on the form result: a refused code comes back empty, as Go's re-render did. -->
							{#key form}
								<InputOTP.Root id="code" name="code" hasError={!!err('code')}>
									<InputOTP.Group>
										{#each [0, 1, 2, 3, 4, 5] as i (i)}
											<InputOTP.Slot index={i} hasError={!!err('code')} />
										{/each}
									</InputOTP.Group>
								</InputOTP.Root>
							{/key}
							<FieldMessage id="code" error={err('code')} />
						</div>
						<Button type="submit" disabled={busy}>{i18n.t('social.phone.verify')}</Button>
					</form>
					<PostForm action="/app/friends?/phoneCancel" class="mt-2">
						<Button type="submit" variant="ghost" size="sm">{i18n.t('social.phone.change')}</Button>
					</PostForm>
				{:else}
					<form
						method="post"
						action="/app/friends?/phone"
						class="flex flex-wrap items-end gap-2"
						use:enhance={submit}
					>
						<div class="space-y-2" {@attach describe('countryCode', describedBy('countryCode', err('countryCode')))}>
							<Label for="countryCode" error={err('countryCode')}
								>{i18n.t('social.phone.country')}</Label
							>
							<SearchSelect
								id="countryCode"
								name="countryCode"
								bind:value={dial}
								items={countries.countries.map((c) => ({ value: c.dial, label: `${countryName(i18n, c)} (+${c.dial})` }))}
								placeholder={i18n.t('social.phone.choose')}
								searchPlaceholder={i18n.t('social.phone.search')}
								invalid={Boolean(err('countryCode'))}
							/>
							<FieldMessage id="countryCode" error={err('countryCode')} />
						</div>
						<div class="flex-1 space-y-2">
							<Label for="phone" error={err('phone')}>
								{phone.number ? i18n.t('social.phone.different') : i18n.t('social.phone.yours')}
							</Label>
							<Input
								id="phone"
								name="phone"
								type="tel"
								value={form.phone ?? ''}
								placeholder={i18n.t('social.phone.placeholder')}
								aria-invalid={err('phone') ? 'true' : undefined}
								aria-describedby={describedBy('phone', err('phone'))}
							/>
							<FieldMessage id="phone" error={err('phone')} />
						</div>
						<Button type="submit" variant="secondary" disabled={busy}
							>{i18n.t('social.phone.send')}</Button
						>
					</form>
				{/if}
			{/if}
		</div>
	</Card.Content>
</Card.Root>
