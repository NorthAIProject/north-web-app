<!--
	Account fields: name, timezone, language, appearance, coaching tone and
	style (Go: settings.profileCard). A language change re-renders the page in
	the new language (the save redirects, which reloads every load); an
	appearance change is applied to <html> on the spot, as ThemeSwitcher does.
-->
<script lang="ts">
	import { enhance } from '$app/forms';
	import { page } from '$app/state';
	import { Button } from '#lib/components/ui/button/index.js';
	import * as Card from '#lib/components/ui/card/index.js';
	import { Input } from '#lib/components/ui/input/index.js';
	import { Label } from '#lib/components/ui/label/index.js';
	import { Textarea } from '#lib/components/ui/textarea/index.js';
	import { useI18n } from '#lib/i18n/index.js';
	import { appearances, isAppearance } from '#lib/theme.js';
	import DictateField from '#lib/features/voice/DictateField.svelte';
	import FieldDescription from './FieldDescription.svelte';
	import { FieldMessage, describedBy, withInvalidFocus } from '#lib/components/ui/field-message/index.js';
	import FormSelect from './FormSelect.svelte';
	import type { FieldErrors } from './form.js';
	import { localeOptions, localeOrDefault, toneOrDefault, tones, zoneGroupsIncluding } from './options.js';

	export type ProfileValues = {
		displayName: string;
		timezone: string;
		locale: string;
		coachingStyle: string;
		coachingTone: string;
		appearance?: string;
	};

	let { values, errors = {} }: { values: ProfileValues; errors?: FieldErrors } = $props();

	const i18n = useI18n();

	const zones = $derived(
		zoneGroupsIncluding(values.timezone).map((g) => ({
			label: g.region,
			options: g.zones.map((z) => ({ value: z, label: z }))
		}))
	);
	const languages = [{ options: localeOptions.map((l) => ({ value: l.value, label: l.label })) }];
	const appearanceGroups = $derived([
		{ options: appearances.map((a) => ({ value: a, label: i18n.t('appearance.' + a) })) }
	]);
	const toneGroups = $derived([{ options: tones.map((t) => ({ value: t, label: i18n.t('tone.' + t) })) }]);
	// Never chosen: the placeholder names what is showing now, without selecting it.
	const shownAppearance = $derived(isAppearance(page.data.appearance) ? page.data.appearance : 'dark');

	/** Applies the saved appearance to this document, like ThemeSwitcher. */
	function applyAppearance(chosen: string) {
		if (!isAppearance(chosen)) return;
		const root = document.documentElement;
		const dark = chosen === 'dark' || (chosen === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
		root.setAttribute('data-appearance', chosen);
		root.classList.toggle('dark', dark);
		document.dispatchEvent(new CustomEvent('theme-changed', { bubbles: true, detail: { appearance: chosen, dark } }));
	}
</script>

<Card.Root class="border-hairline bg-surface">
	<Card.Header>
		<Card.Title>{i18n.t('settings.profile.title')}</Card.Title>
		<Card.Description>{i18n.t('settings.profile.desc')}</Card.Description>
	</Card.Header>
	<Card.Content>
		<form
			method="post"
			action="?/profile"
			class="space-y-4"
			use:enhance={withInvalidFocus(({ formData }) => {
				const appearance = String(formData.get('appearance') ?? '');
				const locale = String(formData.get('locale') ?? '');
				return async ({ result, update }) => {
					if (result.type === 'redirect') {
						applyAppearance(appearance);
						if (locale) document.documentElement.lang = locale;
					}
					// The redirect reloads every load, so the page re-renders in
					// the language just saved.
					await update({ reset: false });
				};
			})}
		>
			<div class="space-y-2">
				<Label for="display_name">{i18n.t('settings.profile.name')}</Label>
				<Input
					id="display_name"
					name="display_name"
					value={values.displayName}
					required
					aria-invalid={errors.display_name ? true : undefined}
					aria-describedby={describedBy('display_name', errors.display_name)}
				/>
				<FieldMessage id="display_name" error={errors.display_name} />
			</div>
			<div class="space-y-2">
				<Label for="timezone">{i18n.t('settings.profile.timezone')}</Label>
				<!-- A select rather than a text field: an unrecognised zone is stored
				     as UTC without complaint, which would move somebody's whole day. -->
				<FormSelect
					id="timezone"
					name="timezone"
					searchPlaceholder={i18n.t('settings.profile.timezone.search')}
					value={values.timezone}
					placeholder={i18n.t('settings.profile.timezone.choose')}
					groups={zones}
					error={Boolean(errors.timezone)}
					describedby={describedBy('timezone', errors.timezone)}
				/>
				<FieldMessage id="timezone" error={errors.timezone} />
			</div>
			<div class="space-y-2">
				<Label for="locale">{i18n.t('settings.profile.language')}</Label>
				<FormSelect
					id="locale"
					name="locale"
					value={localeOrDefault(values.locale)}
					placeholder={i18n.t('settings.profile.language.choose')}
					groups={languages}
					error={Boolean(errors.locale)}
					describedby={describedBy('locale', errors.locale)}
				/>
				<FieldDescription>{i18n.t('settings.profile.language.desc')}</FieldDescription>
				<FieldMessage id="locale" error={errors.locale} />
			</div>
			<div class="space-y-2">
				<Label for="appearance">{i18n.t('settings.profile.appearance')}</Label>
				<FormSelect
					id="appearance"
					name="appearance"
					search={false}
					value={values.appearance ?? ''}
					placeholder={i18n.t('appearance.' + shownAppearance)}
					groups={appearanceGroups}
					error={Boolean(errors.appearance)}
					describedby={describedBy('appearance', errors.appearance)}
				/>
				<FieldDescription>{i18n.t('settings.profile.appearance.desc')}</FieldDescription>
				<FieldMessage id="appearance" error={errors.appearance} />
			</div>
			<div class="space-y-2">
				<Label for="coaching_tone">{i18n.t('settings.profile.tone')}</Label>
				<FormSelect
					id="coaching_tone"
					name="coaching_tone"
					search={false}
					value={toneOrDefault(values.coachingTone)}
					placeholder={i18n.t('tone.direct')}
					groups={toneGroups}
					error={Boolean(errors.coaching_tone)}
					describedby={describedBy('coaching_tone', errors.coaching_tone)}
				/>
				<FieldDescription>{i18n.t('settings.profile.tone.desc')}</FieldDescription>
				<FieldMessage id="coaching_tone" error={errors.coaching_tone} />
			</div>
			<div class="space-y-2">
				<Label for="coaching_style">{i18n.t('settings.profile.style')}</Label>
				<DictateField target="coaching_style" surface="settings">
					<Textarea
						id="coaching_style"
						name="coaching_style"
						rows={3}
						placeholder={i18n.t('settings.profile.style.placeholder')}
						value={values.coachingStyle}
						aria-invalid={errors.coaching_style ? true : undefined}
						aria-describedby={describedBy('coaching_style', errors.coaching_style)}
					/>
				</DictateField>
				<FieldMessage id="coaching_style" error={errors.coaching_style} />
			</div>
			<Button type="submit">{i18n.t('settings.profile.save')}</Button>
		</form>
	</Card.Content>
</Card.Root>
