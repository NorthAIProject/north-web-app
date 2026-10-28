<script lang="ts">
	import { page } from '$app/state';
	import { locales, useI18n } from '#lib/i18n/index.js';

	// Signed-out visitors only: Settings owns a signed-in person's language.
	// A form post rather than a link, because it writes a cookie and a GET
	// that changes state is a GET a prefetcher can fire.
	const i18n = useI18n();

	const labels: Record<string, string> = {
		en: 'English',
		'pt-PT': 'Português (Portugal)',
		'pt-BR': 'Português (Brasil)',
		es: 'Español'
	};
</script>

<form method="post" action="/locale" class="flex items-center gap-2" data-sveltekit-reload>
	<input type="hidden" name="next" value={page.url.pathname + page.url.search} />
	<label for="footer-locale" class="sr-only">{i18n.t('footer.language')}</label>
	<select
		id="footer-locale"
		name="locale"
		class="rounded-md border border-hairline bg-surface px-2 py-1 font-mono text-[10px] tracking-[0.14em] text-muted-foreground uppercase"
		onchange={(e) => e.currentTarget.form?.requestSubmit()}
	>
		{#each locales as tag (tag)}
			<option value={tag} selected={tag === i18n.locale}>{labels[tag]}</option>
		{/each}
	</select>
	<noscript>
		<button
			type="submit"
			class="rounded-md border border-hairline px-2 py-1 font-mono text-[10px] tracking-[0.14em] text-muted-foreground uppercase"
		>
			{i18n.t('footer.language.go')}
		</button>
	</noscript>
</form>
