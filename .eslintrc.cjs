module.exports = {
	env: {
		es6: true,
		node: true,
		browser: true,
		"jest/globals": true,
	},
	parser: "@typescript-eslint/parser",
	extends: [
		"eslint:recommended",
		"plugin:@typescript-eslint/eslint-recommended",
		"plugin:@typescript-eslint/recommended",
	],
	parserOptions: {
		sourceType: "module",
		ecmaVersion: "exnext",
	},
	plugins: ["jest", "svelte3", "@typescript-eslint"],
	globals: {
		fetch: false,
	},
	settings: {
		jsdoc: {
			tagNamePreference: {
				returns: "return",
			},
		},
		"svelte3/typescript": require("typescript"),
	},
	overrides: [
		{
			files: ["**/*.svelte"],
			processor: "svelte3/svelte3",
		},
	],
	rules: {
		"no-multi-spaces": [
			"error",
			{
				ignoreEOLComments: true,
				exceptions: {
					VariableDeclarator: true,
				},
			},
		],
		"block-spacing": ["error", "always"],
		"array-bracket-spacing": ["error", "never"],
		"space-in-parens": ["error", "never"],
		"comma-spacing": [
			"error",
			{
				before: false,
				after: true,
			},
		],
		"key-spacing": [
			"error",
			{
				afterColon: true,
				beforeColon: false,
			},
		],
		quotes: [
			"error",
			"double",
			{
				avoidEscape: true,
				allowTemplateLiterals: true,
			},
		],
		semi: ["error", "always"],
		"no-console": ["warn"],
		"no-constant-condition": ["warn"],
		curly: ["error", "all"],
		"brace-style": [
			"error",
			"1tbs",
			{
				allowSingleLine: false,
			},
		],
		"keyword-spacing": [
			"error",
			{
				before: true,
				after: true,
			},
		],
		"object-curly-spacing": ["error", "always"],
		"no-mixed-spaces-and-tabs": ["error", "smart-tabs"],
		"spaced-comment": [2, "always"],
		"space-before-blocks": ["error", "always"],
		"space-before-function-paren": "off",
		"prefer-template": "error",
		"no-useless-concat": "error",
		"linebreak-style": ["error", "unix"],
		"eol-last": ["error", "always"],
		"template-curly-spacing": ["error", "never"],
		"no-multiple-empty-lines": "off",
		"jest/no-disabled-tests": "warn",
		"jest/no-focused-tests": "error",
		"jest/no-identical-title": "error",
		"jest/prefer-to-have-length": "warn",
		"jest/valid-expect": "error",
	},
};
