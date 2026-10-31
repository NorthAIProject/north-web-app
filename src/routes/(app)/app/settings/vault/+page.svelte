<!-- Local notes-vault sync (Go: web/settings/vault/vault.templ). -->
<script lang="ts">
	import { enhance } from '$app/forms';
	import { pageTitle } from '#lib/brand.js';
	import { formatTime } from '#lib/components/khepri/dates.js';
	import { Button } from '#lib/components/ui/button/index.js';
	import { FieldMessage, describedBy, withInvalidFocus } from '#lib/components/ui/field-message/index.js';
	import { Input } from '#lib/components/ui/input/index.js';
	import { Label } from '#lib/components/ui/label/index.js';
	import { useI18n } from '#lib/i18n/index.js';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();
	const i18n = useI18n();

	const vault = $derived(data.vault);
	const pathError = $derived(form?.errors?.path ?? '');
	const value = $derived(form?.rootPath || vault.rootPath);
</script>

<svelte:head><title>{pageTitle(i18n.t('settings.vault.title'))}</title></svelte:head>

<div class="mx-auto w-full max-w-2xl space-y-8 p-6 md:p-8">
	<header>
		<a href="/app/settings" class="text-muted-foreground hover:text-foreground font-mono text-[10px] uppercase tracking-[0.14em]">
			&larr; {i18n.t('settings.mono')}
		</a>
		<h1 class="mt-2 text-2xl font-medium tracking-tight">{i18n.t('settings.vault.heading')}</h1>
		<p class="text-muted-foreground mt-1 text-sm leading-relaxed">{i18n.t('settings.vault.intro')}</p>
	</header>
	{#if vault.rootPath}
		<section class="border-hairline bg-surface space-y-3 rounded-lg border p-4">
			<p class="text-sm"><span class="text-muted-foreground">{i18n.t('settings.vault.connected')}</span> {vault.rootPath}</p>
			{#if vault.lastSyncAt}
				<p class="text-muted-foreground text-xs">
					{i18n.tf('settings.vault.lastsync', formatTime(i18n.locale, vault.lastSyncAt, 'Jan 2, 2006 3:04 PM', data.user.timezone || 'UTC'))}
				</p>
			{/if}
			{#if vault.lastError}
				<p class="text-destructive text-xs">{vault.lastError}</p>
			{/if}
			<div class="flex flex-wrap gap-2">
				<form method="post" action="?/sync" use:enhance>
					<Button type="submit" size="sm">{i18n.t('settings.vault.sync')}</Button>
				</form>
				<form method="post" action="?/disconnect" use:enhance>
					<Button type="submit" size="sm" variant="outline">{i18n.t('settings.vault.disconnect')}</Button>
				</form>
			</div>
		</section>
	{/if}
	<section class="border-hairline bg-surface space-y-4 rounded-lg border p-4">
		<h2 class="text-sm font-medium">{vault.rootPath ? i18n.t('settings.vault.change') : i18n.t('settings.vault.connect')}</h2>
		<form method="post" action="?/connect" class="space-y-4" use:enhance={withInvalidFocus(() => async ({ update }) => update({ reset: false }))}>
			<div class="space-y-2">
				<Label for="root_path">{i18n.t('settings.vault.path')}</Label>
				<Input
					id="root_path"
					name="root_path"
					{value}
					placeholder="/Users/you/Documents/Obsidian/MyVault"
					aria-invalid={pathError ? 'true' : 'false'}
					aria-describedby={describedBy('root_path', pathError)}
				/>
				<FieldMessage id="root_path" error={pathError} />
			</div>
			<Button type="submit">{i18n.t('settings.vault.save')}</Button>
		</form>
	</section>
</div>
