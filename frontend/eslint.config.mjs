import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';

const eslintConfig = [
  ...nextVitals,
  ...nextTs,
  {
    ignores: [
      'node_modules/**',
      '.next/**',
      'out/**',
      'build/**',
      'next-env.d.ts',
      'jest.config.js',
      'jest.setup.js',
    ],
  },
  {
    rules: {
      // React Hooks依存配列チェック
      'react-hooks/exhaustive-deps': 'warn',

      // useEffect 内の同期 setState（eslint-plugin-react-hooks 7 で追加）
      // 既存の9箇所は別タスクで修正するまで警告に留める
      'react-hooks/set-state-in-effect': 'warn',

      // 未使用変数の検出
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
        },
      ],

      // console.logの警告（本番前に削除推奨）
      'no-console': ['warn', { allow: ['warn', 'error'] }],
    },
  },
];

export default eslintConfig;
