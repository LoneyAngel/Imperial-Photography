import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import prettierPlugin from 'eslint-plugin-prettier';
import prettierConfig from 'eslint-config-prettier';

export default tseslint.config(
  // 1. 忽略文件
  { ignores: ['dist', 'node_modules', 'build'] },

  // 2. 基础 JS 推荐配置
  js.configs.recommended,

  // 3. TypeScript 推荐配置 (使用数组展开符号)
  ...tseslint.configs.recommended,

  // 4. 自定义业务配置块
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        ...globals.browser,
        ...globals.es2020,
      },
      // 显式指定 parser，虽然 tseslint.config 默认处理，但显式定义更稳健
      parser: tseslint.parser,
      parserOptions: {
        project: ['./tsconfig.app.json', './tsconfig.node.json'],
      },
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
      'prettier': prettierPlugin,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true },
      ],
      'prettier/prettier': 'error',
      '@typescript-eslint/no-explicit-any': 'warn',
    },
  },

  // 5. 必须放在最后：关闭冲突
  prettierConfig,
);