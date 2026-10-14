import eslint from '@eslint/js';
import { defineConfig } from 'eslint/config';
import importX from 'eslint-plugin-import-x';
import tseslint from 'typescript-eslint';

const ALLOWED_UTILITY = 'Partial|Required|Readonly|Pick|Omit';
const FORBIDDEN_UTILITY =
  'Record|Exclude|Extract|Awaited|ReturnType|NonNullable|Parameters|InstanceType|ConstructorParameters|Uppercase|Lowercase|Capitalize|Uncapitalize';
const allowedRef = `TSTypeReference[typeName.name=/^(${ALLOWED_UTILITY})$/]`;

const restrictedSyntax = [
  { selector: 'IfStatement[alternate]', message: 'else is forbidden: use an early return.' },
  { selector: 'ExportDefaultDeclaration', message: 'Default export is forbidden: use a named export.' },
  { selector: "CallExpression[callee.property.name='then']", message: 'Use async/await instead of .then.' },
  { selector: 'SwitchStatement[cases.length>10]', message: 'More than 10 cases: use a Map.' },
  { selector: `TSTypeReference[typeName.name=/^(${FORBIDDEN_UTILITY})$/]`, message: 'This utility type is forbidden.' },
  { selector: `${allowedRef} ${allowedRef}`, message: 'Only one utility type layer is allowed.' },
  { selector: 'TSConditionalType', message: 'Conditional types are forbidden.' },
  { selector: 'TSMappedType', message: 'Mapped types are forbidden.' },
  { selector: 'TSTemplateLiteralType', message: 'Template literal types are forbidden.' },
  { selector: 'TSIntersectionType', message: 'Intersection types are forbidden: use an explicit type.' },
];

export default defineConfig(
  { ignores: ['dist', 'node_modules', 'vitest.config.mts'] },
  eslint.configs.recommended,
  tseslint.configs.recommended,
  {
    files: ['**/*.ts'],
    plugins: { 'import-x': importX },
    rules: {
      // Size and complexity
      'max-lines': ['error', 250],
      'max-classes-per-file': ['error', 1],
      'max-params': ['error', 3],
      complexity: ['error', { max: 5, variant: 'modified' }],
      curly: ['error', 'multi-line'],
      'no-restricted-syntax': ['error', ...restrictedSyntax],

      // Names
      'id-denylist': ['error', 'handler', 'handle', 'process', 'data', 'temp'],
      'id-length': ['error', { min: 3, properties: 'never', exceptions: ['id'] }],

      // TypeScript
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/consistent-type-definitions': ['error', 'type'],
      '@typescript-eslint/explicit-module-boundary-types': 'error',

      // Hygiene
      'no-empty': 'error',
      'no-console': 'error',
      'no-restricted-imports': [
        'error',
        { patterns: [{ group: ['./*', '../*'], message: 'Use the @/ alias instead of relative imports.' }] },
      ],
      'import-x/order': [
        'error',
        {
          groups: ['builtin', 'external', 'type', 'internal'],
          pathGroups: [{ pattern: '@/**', group: 'internal' }],
          pathGroupsExcludedImportTypes: ['builtin', 'external', 'type'],
          'newlines-between': 'always',
        },
      ],
    },
  },
);
