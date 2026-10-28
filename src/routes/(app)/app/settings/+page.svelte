<!-- Account settings (Go: web/settings/settings.templ Page). -->
<script lang="ts">
	import { discordUrl, pageTitle, productName } from '#lib/brand.js';
	import KpiCell from '#lib/components/khepri/KpiCell.svelte';
	import KpiStrip from '#lib/components/khepri/KpiStrip.svelte';
	import Mascot from '#lib/components/khepri/Mascot.svelte';
	import MonoLabel from '#lib/components/khepri/MonoLabel.svelte';
	import { Button } from '#lib/components/ui/button/index.js';
	import * as Card from '#lib/components/ui/card/index.js';
	import DietsCard from '#lib/features/settings/DietsCard.svelte';
	import NotificationsCard from '#lib/features/settings/NotificationsCard.svelte';
	import PreferencesCard from '#lib/features/settings/PreferencesCard.svelte';
	import ProfileCard from '#lib/features/settings/ProfileCard.svelte';
	import YourDataCard from '#lib/features/settings/YourDataCard.svelte';
	import { settingsSummary } from '#lib/features/settings/options.js';
	import { useI18n } from '#lib/i18n/index.js';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();
	const i18n = useI18n();

	const summary = $derived(
		settingsSummary(
			data.profile.timezone,
			data.preferences.unitsSystem,
			data.diets.filter((d) => d.selected).length,
			data.connectionCount
		)
	);
	// A rejected form comes back with what was typed and its messages; the
	// other forms keep showing what is saved (Go: render with one form filled).
	const failed = (name: string) => (form?.form === name ? form : undefined);
	const errorsFor = (name: string): Record<string, string> => failed(name)?.errors ?? {};
	const profileValues = $derived({ ...data.profile, ...(failed('profile')?.values ?? {}) });
	const notificationValues = $derived({ ...data.notifications, ...(failed('notifications')?.values ?? {}) });
	const preferenceValues = $derived({ ...data.preferences, ...(failed('preferences')?.values ?? {}) });
	const posthogCapture = () => {
		const ph = (window as { posthog?: { capture: (e: string, p: object) => void } }).posthog;
		ph?.capture('discord_link_clicked', { surface: 'settings' });
	};
</script>

<svelte:head><title>{pageTitle(i18n.t('settings.mono'))}</title></svelte:head>

<div class="mx-auto w-full max-w-6xl space-y-6 p-6 md:p-8">
	<header>
		<MonoLabel text={i18n.t('settings.mono')} />
		<h1 class="mt-2 text-2xl font-medium tracking-tight">{i18n.t('settings.heading')}</h1>
		<p class="text-muted-foreground mt-1 text-sm leading-relaxed">{i18n.t('settings.intro')}</p>
	</header>
	<KpiStrip>
		<KpiCell label={i18n.t('settings.kpi.timezone')} value={summary.timezone} />
		<KpiCell label={i18n.t('settings.kpi.units')} value={summary.units} />
		<KpiCell
			label={i18n.t('settings.kpi.diets')}
			value={String(summary.dietCount)}
			href="#diets"
			cta={i18n.t('settings.kpi.edit')}
		/>
		<KpiCell
			label={i18n.t('settings.kpi.connections')}
			value={String(summary.connectionCount)}
			href="/app/settings/connections"
			cta={i18n.t('settings.kpi.manage')}
		/>
	</KpiStrip>
	<ProfileCard values={profileValues} errors={errorsFor('profile')} />
	<NotificationsCard values={notificationValues} errors={errorsFor('notifications')} />
	<PreferencesCard values={preferenceValues} errors={errorsFor('preferences')} />
	<DietsCard diets={data.diets} />

	<!-- A doorway, not a section: managing agent keys has a page of its own. -->
	<Card.Root class="border-hairline bg-surface">
		<Card.Header>
			<Card.Title>{i18n.t('settings.agents.title')}</Card.Title>
			<Card.Description>{i18n.t('settings.agents.desc')}</Card.Description>
		</Card.Header>
		<Card.Content>
			<div class="flex flex-wrap gap-2">
				<Button href="/app/settings/connections" variant="outline">{i18n.t('settings.agents.manage')}</Button>
				<Button href="/app/settings/activity" variant="outline">{i18n.t('settings.agents.activity')}</Button>
				<Button href="/app/settings/news-ticker" variant="outline">{i18n.t('news.settings.title')}</Button>
			</div>
		</Card.Content>
	</Card.Root>

	<YourDataCard email={data.profile.email} deleteError={failed('delete')?.message ?? ''} />

	<!-- The one place about Khepri rather than the person; it sits last. -->
	<Card.Root class="border-hairline bg-surface">
		<Card.Content>
			<div class="flex items-center gap-4">
				<Mascot id="settings-mascot" size="md" />
				<div class="space-y-1">
					<MonoLabel text={i18n.t('settings.about.label')} />
					<p class="text-sm leading-relaxed">{i18n.tf('settings.about.body', productName)}</p>
					<a
						href={discordUrl}
						target="_blank"
						rel="noopener noreferrer"
						onclick={posthogCapture}
						class="inline-block text-sm text-foreground underline underline-offset-4"
					>
						{i18n.t('settings.about.discord')}
					</a>
				</div>
			</div>
		</Card.Content>
	</Card.Root>
</div>
