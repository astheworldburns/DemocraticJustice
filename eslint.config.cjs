const js = require('@eslint/js');
const importPlugin = require('eslint-plugin-import');
const globals = require('globals');

module.exports = [
    {
        ignores: ['_site/**', 'node_modules/**', 'bundle.js']
    },
    {
        files: ['**/*.js'],
        languageOptions: {
            ecmaVersion: 'latest',
            sourceType: 'module',
            globals: {
                ...globals.es2021
            }
        },
        plugins: {
            import: importPlugin
        },
        settings: {
            'import/resolver': {
                node: {
                    extensions: ['.js']
                }
            }
        },
        rules: {
            ...js.configs.recommended.rules,
            ...importPlugin.configs.recommended.rules,
            'no-console': 'off',
            'no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_', caughtErrors: 'none' }]
        }
    },
    {
        files: ['src/**/*.js'],
        languageOptions: {
            ecmaVersion: 'latest',
            sourceType: 'module',
            globals: {
                ...globals.browser,
                ...globals.es2021
            }
        }
    },
    {
        files: ['scripts/**/*.js', '.eleventy.js', 'tests/**/*.js'],
        languageOptions: {
            ecmaVersion: 'latest',
            sourceType: 'script',
            globals: {
                ...globals.node,
                ...globals.es2021
            }
        }
    }
];
