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
			// BACKLOG. Recommended Svelte rules the existing tree still breaks
			// (count as of 2026-11-17). They report as warnings so CI stays
			// green while every other recommended rule is enforced. To retire
			// one: fix its hits, then delete the line. Never add a rule here.
			'svelte/no-navigation-without-resolve': 'warn', // 112
			'svelte/no-useless-mustaches': 'warn', // 9
			'svelte/no-unused-svelte-ignore': 'warn', // 8
			'svelte/prefer-svelte-reactivity': 'warn', // 4
			'svelte/prefer-writable-derived': 'warn' // 4
		}
	},
	...oxlint.buildFromOxlintConfigFile('./.oxlintrc.json')
);
