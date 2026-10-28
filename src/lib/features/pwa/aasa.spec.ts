import { describe, expect, it } from 'vitest';
import { appSiteAssociation } from './aasa';

describe('appSiteAssociation', () => {
	it('prefixes every bundle with the team', () => {
		const body = appSiteAssociation('TEAM', 'a.b, a.b.beta ,');
		expect(body?.webcredentials.apps).toEqual(['TEAM.a.b', 'TEAM.a.b.beta']);
		expect(body?.applinks.details[0].components).toEqual([{ '/': '/i/*', comment: 'invite links' }]);
	});

	it('is absent without a team or bundle', () => {
		expect(appSiteAssociation('', 'a.b')).toBeNull();
		expect(appSiteAssociation('TEAM', ' , ')).toBeNull();
	});
});
