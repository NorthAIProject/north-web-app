// ESLint runs only the Svelte-specific rules (template and runes checks that
// oxlint cannot see). Everything else, including type-aware rules, is oxlint:
// see .oxlintrc.json. eslint-plugin-oxlint turns off any ESLint rule that
// oxlint already covers, so the two never report the same thing twice.
import prettier from 'eslint-config-prettier';
import path from 'node:path';
import oxlint from 'eslint-plugin-oxlint';
import svelte from 'eslint-plugin-svelte';
import { defineConfig, includeIgnoreFile } from 'eslint/config';
import globals from 'globals';
import ts from 'typescript-eslint';

const gitignorePath = path.resolve(import.meta.dirname, '.gitignore');
const svelteFiles = ['**/*.svelte', '**/*.svelte.ts', '**/*.svelte.js'];

export default defineConfig(
	includeIgnoreFile(gitignorePath),
	// Plain TypeScript is oxlint's job. Without this, an oxlint override that
	// names .ts files would pull them into ESLint, which has no parser for them.
	{ ignores: ['**/*.ts', '!**/*.svelte.ts'] },
	svelte.configs.recommended.map((config) => ({ ...config, files: svelteFiles })),
	svelte.configs.prettier.map((config) => ({ ...config, files: svelteFiles })),
	prettier,
	{
		files: svelteFiles,
		languageOptions: {
			globals: { ...globals.browser, ...globals.node },
			// Parse only: no projectService. No Svelte rule needs type
			// information, and building the TS program per file is the slow
			// part of a typed ESLint run.
			parserOptions: { parser: ts.parser, extraFileExtensions: ['.svelte'] }
		},
		// Existing `eslint-disable @typescript-eslint/...` comments still have to
		// resolve to a known rule; the plugin is registered but none of its
		// rules run here (oxlint honours those comments instead), so ESLint
		// must not call them unused either.
		plugins: { '@typescript-eslint': ts.plugin },
		linterOptions: { reportUnusedDisableDirectives: 'off' },
		rules: {
			// No paths.base is configured, so plain hrefs and goto() targets are
			// already resolved; wrapping all of them in resolve() would change nothing.
			'svelte/no-navigation-without-resolve': 'off',
			// {' '} and {' · '} are how this tree keeps whitespace that Svelte trims
			// at the edge of an element or a block; the plain text the rule asks for
			// would lose the space.
			'svelte/no-useless-mustaches': 'off'
		}
	},
	...oxlint.buildFromOxlintConfigFile('./.oxlintrc.json')
);
