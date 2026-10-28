<!--
	The public pages' appearance button (north-client ui.ThemeSwitcher): cycles
	System → Light → Dark.

	A form first, so it works with no script: it posts the next appearance to
	/appearance, which sets the cookie (and the account, when signed in) and
	redirects back. With script, the submit is intercepted, the class applied on
	the spot, `theme-changed` announced, and the same form sent with fetch
	(Accept: application/json → 204). Nothing is kept in localStorage: the
	server renders the class.
-->
<script lang="ts">
	import { page } from '$app/state';
	import Monitor from '@lucide/svelte/icons/monitor';
	import Sun from '@lucide/svelte/icons/sun';
	import Moon from '@lucide/svelte/icons/moon';
	import { useI18n } from '#lib/i18n/index.js';
	import { Button } from '#lib/components/ui/button/index.js';
	import { defaultAppearance, isAppearance, type Appearance } from '#lib/theme.js';

	let { class: className = '' }: { class?: string } = $props();

	const i18n = useI18n();

	const order: Appearance[] = ['system', 'light', 'dark'];

	/** The step the button takes from a (Go: nextAppearance). */
	function nextAppearance(a: Appearance): Appearance {
		return order[(order.indexOf(a) + 1) % order.length];
	}

	const fromServer = (): Appearance => {
		const a: unknown = page.data.appearance;
		return isAppearance(a) ? a : defaultAppearance;
	};

	let current: Appearance = $state(fromServer());
	const next = $derived(nextAppearance(current));
	// Says what the page is now and what a press will do.
	const label = $derived(i18n.t('appearance.switch.' + current));

	// Another switcher on the page (or anything else) changed it.
	$effect(() => {
		const onChange = (event: Event) => {
			const chosen = (event as CustomEvent<{ appearance?: string }>).detail?.appearance;
			if (isAppearance(chosen)) current = chosen;
		};
		document.addEventListener('theme-changed', onChange);
		return () => document.removeEventListener('theme-changed', onChange);
	});

	function onsubmit(event: SubmitEvent) {
		event.preventDefault();
		const form = event.currentTarget as HTMLFormElement;
		// Captured before the hidden field moves on to the next step.
		const body = new URLSearchParams(new FormData(form) as unknown as Record<string, string>);
		const chosen = body.get('appearance');
		if (!isAppearance(chosen)) return;
		const root = document.documentElement;
		const dark = chosen === 'dark' || (chosen === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

		root.setAttribute('data-appearance', chosen);
		root.classList.toggle('dark', dark);
		current = chosen;
		document.dispatchEvent(new CustomEvent('theme-changed', { bubbles: true, detail: { appearance: chosen, dark } }));

		fetch(form.action, {
			method: 'POST',
			credentials: 'same-origin',
			headers: { Accept: 'application/json' },
			body
		}).catch(() => {
			// The page already shows the choice; a lost save only means the
			// next page load forgets it.
		});
	}
</script>

<form method="post" action="/appearance" class="contents" data-theme-switcher {onsubmit}>
	<input type="hidden" name="next" value={page.url.pathname + page.url.search} />
	<input type="hidden" name="appearance" value={next} data-theme-switcher-next />
	<Button
		type="submit"
		size="icon"
		variant="ghost"
		class={className}
		aria-label={label}
		title={label}
		data-label-system={i18n.t('appearance.switch.system')}
		data-label-light={i18n.t('appearance.switch.light')}
		data-label-dark={i18n.t('appearance.switch.dark')}
	>
		<span data-theme-icon="system" class={current === 'system' ? 'inline-flex' : 'hidden'} aria-hidden="true">
			<Monitor class="size-5" />
		</span>
		<span data-theme-icon="light" class={current === 'light' ? 'inline-flex' : 'hidden'} aria-hidden="true">
			<Sun class="size-5" />
		</span>
		<span data-theme-icon="dark" class={current === 'dark' ? 'inline-flex' : 'hidden'} aria-hidden="true">
			<Moon class="size-5" />
		</span>
	</Button>
</form>
