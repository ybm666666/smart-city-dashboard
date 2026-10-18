import js from '@eslint/js'
import pluginVue from 'eslint-plugin-vue'
import tseslint from 'typescript-eslint'
import prettier from 'eslint-config-prettier'
import globals from 'globals'

/**
 * Day15：ESLint 扁平配置。
 *
 * 只做「正确性」检查（essential 而非 recommended），排版一律交给 Prettier ——
 * 两套工具各管一件事，避免规则互相打架、也避免为了过 lint 去改无意义的缩进。
 */
export default tseslint.config(
  {
    ignores: ['dist/**', 'node_modules/**', 'coverage/**', 'public/**']
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  ...pluginVue.configs['flat/essential'],
  {
    files: ['**/*.vue'],
    languageOptions: {
      parserOptions: { parser: tseslint.parser }
    }
  },
  {
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        ...globals.browser,
        ...globals.node
      }
    },
    rules: {
      // 类型检查已由 vue-tsc 负责，no-undef 在 TS 项目里只会误报
      'no-undef': 'off',
      'no-console': 'off',
      'vue/multi-word-component-names': 'off',
      // 第三方 / 模型返回的数据入口确实需要 any，收敛在少量边界处
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }
      ]
    }
  },
  prettier
)
