// The apple-app-site-association document (north-client internal/auth/aasa.go):
// webcredentials for passkeys and shared web credentials, and universal links
// for invite links only — an invite tapped on an iPhone with the app opens the
// app, which redeems it after sign-in; every other path stays in the browser.

export type AppSiteAssociation = {
	webcredentials: { apps: string[] };
	applinks: { details: { appIDs: string[]; components: { '/': string; comment: string }[] }[] };
};

/** Comma-separated list → trimmed, non-empty entries (Go's splitList). */
export function splitList(value: string): string[] {
	return value
		.split(',')
		.map((part) => part.trim())
		.filter(Boolean);
}

/** The document, or null when there is no team or bundle (Go answers 404). */
export function appSiteAssociation(teamID: string, bundleIDs: string): AppSiteAssociation | null {
	const apps = splitList(bundleIDs).map((id) => `${teamID}.${id}`);
	if (!teamID || apps.length === 0) return null;
	return {
		webcredentials: { apps },
		applinks: { details: [{ appIDs: apps, components: [{ '/': '/i/*', comment: 'invite links' }] }] }
	};
}
