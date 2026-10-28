<script lang="ts">
	import { enhance } from '$app/forms';
	import { Badge } from '#lib/components/ui/badge/index.js';
	import { Button } from '#lib/components/ui/button/index.js';
	import * as Card from '#lib/components/ui/card/index.js';
	import { Input } from '#lib/components/ui/input/index.js';
	import * as InputOTP from '#lib/components/ui/inputotp/index.js';
	import { Label } from '#lib/components/ui/label/index.js';
	import * as Select from '#lib/components/ui/select/index.js';
	import { useI18n } from '#lib/i18n/index.js';
	import FieldError from './FieldError.svelte';
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
	const chosen = $derived(countries.countries.find((c) => c.dial === dial));
	let busy = $state(false);
	const submit = () => {
		busy = true;
		return async ({ update }: { update: (o?: { reset?: boolean }) => Promise<void> }) => {
			await update({ reset: false });
			busy = false;
		};
	};
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
						<div class="space-y-2">
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
							<FieldError message={err('code')} />
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
						<div class="space-y-2">
							<Label for="countryCode" error={err('countryCode')}
								>{i18n.t('social.phone.country')}</Label
							>
							<Select.Root type="single" name="countryCode" bind:value={dial}>
								<Select.Trigger
									id="countryCode"
									aria-invalid={err('countryCode') ? 'true' : undefined}
								>
									{chosen
										? `${countryName(i18n, chosen)} (+${chosen.dial})`
										: i18n.t('social.phone.choose')}
								</Select.Trigger>
								<Select.Content>
									{#each countries.countries as c (c.dial)}
										<Select.Item value={c.dial} label="{countryName(i18n, c)} (+{c.dial})" />
									{/each}
								</Select.Content>
							</Select.Root>
							<FieldError message={err('countryCode')} />
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
							/>
							<FieldError message={err('phone')} />
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
