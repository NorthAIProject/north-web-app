<script lang="ts">
	import type { Snippet } from 'svelte';
	import { page } from '$app/state';
	import ChevronDownIcon from '@lucide/svelte/icons/chevron-down';
	import LogOutIcon from '@lucide/svelte/icons/log-out';
	import PanelLeftIcon from '@lucide/svelte/icons/panel-left';
	import BrandLockup from '#lib/components/brand/BrandLockup.svelte';
	import { Button } from '#lib/components/ui/button/index.js';
	import * as Collapsible from '#lib/components/ui/collapsible/index.js';
	import * as Sidebar from '#lib/components/ui/sidebar/index.js';
	import { useI18n } from '#lib/i18n/index.js';
	import { buildNav, type NavItem } from '#lib/nav/nav.js';
	import { cn } from '#lib/utils.js';
	import CommandPalette from './CommandPalette.svelte';
	import ShellWidgets from './ShellWidgets.svelte';
	import SkipLink from './SkipLink.svelte';
	import CrewsUnreadBadge from '#lib/features/crews/CrewsUnreadBadge.svelte';

	// The shell for every signed-in page (Go: layout.App / layout.AppWide).
	// A wide page lays out its own panes edge to edge (a crew's chat): the
	// rail starts collapsed and main does not scroll, so each pane scrolls on
	// its own.
	let {
		user,
		simpleNav = false,
		wide = false,
		children
	}: {
		user: { displayName: string; email: string };
		simpleNav?: boolean;
		wide?: boolean;
		children: Snippet;
	} = $props();

	const i18n = useI18n();
	const nav = $derived(buildNav(i18n, page.data.navActive ?? page.url.pathname, simpleNav));

	// The lit item is the page you are on, unless one of its sub-pages is: then
	// it is only the section that holds it.
	const current = (item: NavItem) =>
		item.active ? (item.children.some((c) => c.active) ? 'true' : 'page') : undefined;
</script>

<Sidebar.Provider open={!wide} class={wide ? 'h-dvh overflow-hidden' : 'min-h-dvh'}>
	<SkipLink />
	<Sidebar.Root collapsible="icon" id="app-sidebar">
		<!-- One navigation landmark holds the brand, the links and the account, so nothing in the rail sits outside a landmark. -->
		<nav aria-label={i18n.t('layout.nav.aria')} class="flex min-h-0 flex-1 flex-col">
		<Sidebar.Header>
			<!-- Collapsed to icons, the name stays for screen readers: the mark alone is alt="". -->
			<BrandLockup
				href="/app"
				markSize="size-6"
				textClass="text-base font-medium tracking-tight group-data-[collapsible=icon]:sr-only"
			/>
		</Sidebar.Header>
		<Sidebar.Content>
			<div class="flex flex-col gap-2">
				{#each nav as group (group.label)}
					{#if group.more}
						<Collapsible.Root open={group.open} data-testid="nav-more">
							<Sidebar.Group>
								<!-- A real button: the label primitive renders a div, which no
								     keyboard can reach. Collapsed to icons the label is
								     invisible, so it leaves the tab order with it. -->
								<Collapsible.Trigger>
									{#snippet child({ props })}
										<Sidebar.GroupLabel {...props}>
											{#snippet child({ props: labelProps })}
												<button
													type="button"
													{...labelProps}
													class={cn(
														labelProps.class as string,
														'w-full cursor-pointer text-left group-data-[collapsible=icon]:invisible [&[data-state=open]>svg]:rotate-180'
													)}
												>
													{group.label}
													<ChevronDownIcon
														class="ml-auto size-3.5 transition-transform motion-reduce:transition-none"
													/>
												</button>
											{/snippet}
										</Sidebar.GroupLabel>
									{/snippet}
								</Collapsible.Trigger>
								<Collapsible.Content>
									<Sidebar.Menu>
										{#each group.items as item (item.href)}
											{@render navItem(item)}
										{/each}
									</Sidebar.Menu>
								</Collapsible.Content>
							</Sidebar.Group>
						</Collapsible.Root>
					{:else}
						<Sidebar.Group>
							<Sidebar.GroupLabel>{group.label}</Sidebar.GroupLabel>
							<Sidebar.Menu>
								{#each group.items as item (item.href)}
									{@render navItem(item)}
								{/each}
							</Sidebar.Menu>
						</Sidebar.Group>
					{/if}
				{/each}
			</div>
		</Sidebar.Content>
		<Sidebar.Footer>
			<div class="p-1">
				<div class="mb-2 px-2 group-data-[collapsible=icon]:hidden">
					<p class="truncate text-sm font-medium">{user.displayName}</p>
					<p class="truncate text-xs text-muted-foreground">{user.email}</p>
				</div>
				<!-- A POST rather than a link: a GET that ends a session can be fired by any image tag. -->
				<form method="post" action="/logout">
					<Button type="submit" variant="ghost" size="sm" class="w-full justify-start">
						<LogOutIcon class="size-4" />
						<span class="group-data-[collapsible=icon]:sr-only">{i18n.t('layout.signout')}</span>
					</Button>
				</form>
			</div>
		</Sidebar.Footer>
		</nav>
	</Sidebar.Root>
	<Sidebar.Inset class={wide ? 'min-h-0' : ''}>
		<header
			class="flex min-h-14 shrink-0 items-center gap-2 border-b border-border pt-[env(safe-area-inset-top)] pr-[max(1rem,env(safe-area-inset-right))] pl-[max(1rem,env(safe-area-inset-left))]"
		>
			<Sidebar.Trigger class="size-11">
				<PanelLeftIcon class="size-4" />
			</Sidebar.Trigger>
			<span class="md:hidden">
				<BrandLockup href="/app" markSize="size-5" textClass="text-sm font-medium tracking-tight" />
			</span>
			<div class="ml-auto flex min-w-0 items-center gap-2">
				<ShellWidgets>
					<CommandPalette />
				</ShellWidgets>
			</div>
		</header>
		<!-- The page's one main landmark (SidebarInset is a div); tabindex lets the
		     skip link move focus here. -->
		<main
			id="main"
			tabindex="-1"
			class={['min-h-0 flex-1 outline-none', wide ? 'overflow-hidden' : 'overflow-y-auto']}
		>
			{@render children()}
		</main>
	</Sidebar.Inset>
</Sidebar.Provider>

{#snippet navItem(item: NavItem)}
	<Sidebar.MenuItem>
		<!-- Where you are is one of gold's few jobs: the icon's tint, over the
		     raised navy the primitive already paints. No side rule. -->
		<Sidebar.MenuButton
			isActive={item.active}
			tooltipContent={item.label}
			class="data-[active=true]:[&>svg]:text-sidebar-primary"
		>
			{#snippet child({ props })}
				<a href={item.href} {...props} aria-current={current(item)}>
					{#if item.icon}
						<item.icon class="size-4" />
					{/if}
					<span>{item.label}</span>
					{#if item.href === '/app/crews'}
						<!-- Unread crew messages (iOS has the same badge; Go had only the rail dots). -->
						<CrewsUnreadBadge class="ml-auto" />
					{/if}
				</a>
			{/snippet}
		</Sidebar.MenuButton>
		{#if item.children.length && item.active}
			<Sidebar.MenuSub>
				{#each item.children as sub (sub.href + sub.label)}
					<Sidebar.MenuSubItem>
						<Sidebar.MenuSubButton href={sub.href} isActive={sub.active}>
							<span>{sub.label}</span>
						</Sidebar.MenuSubButton>
					</Sidebar.MenuSubItem>
				{/each}
			</Sidebar.MenuSub>
		{/if}
	</Sidebar.MenuItem>
{/snippet}
