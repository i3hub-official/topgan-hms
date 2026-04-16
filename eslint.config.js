import prettier from 'eslint-config-prettier';
import path from 'node:path';
import { includeIgnoreFile } from '@eslint/compat';
import js from '@eslint/js';
import svelte from 'eslint-plugin-svelte';
import { defineConfig } from 'eslint/config';
import globals from 'globals';
import ts from 'typescript-eslint';

const gitignorePath = path.resolve(import.meta.dirname, '.gitignore');

export default defineConfig(
    includeIgnoreFile(gitignorePath),
    js.configs.recommended,
    ...ts.configs.recommended,
    ...svelte.configs['flat/recommended'],
    prettier,
    ...svelte.configs['flat/prettier'],
    {
        languageOptions: { 
            globals: { ...globals.browser, ...globals.node } 
        },
        rules: {
            'no-undef': 'off',
            
            // --- DISABLE UNUSED DECLARATION ALERTS ---
            'no-unused-vars': 'off', 
            '@typescript-eslint/no-unused-vars': 'off',
            
            // --- DISABLE NAVIGATION RESOLVE ALERT ---
            'svelte/no-navigation-without-resolve': 'off',

            // --- DISABLE EXPLICIT ANY ALERT ---
            '@typescript-eslint/no-explicit-any': 'off'
        }
    },
    {
        files: ['**/*.svelte'],
        languageOptions: {
            parserOptions: {
                parser: ts.parser,
                extraFileExtensions: ['.svelte'],
            }
        }
    }
);