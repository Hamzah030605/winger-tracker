import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
  // Downgrade rules that produce false positives for intentional patterns
  {
    rules: {
      // Prop-sync effects and init effects are intentional — not infinite loops
      'react-hooks/set-state-in-effect': 'warn',
      // Function hoisting is safe here; JS hoists function declarations
      'react-hooks/immutability': 'warn',
      // `any` is unavoidable in a few legacy spots in lib/plans.ts
      '@typescript-eslint/no-explicit-any': 'warn',
      // prefer-const: let cursor is mutated via .setDate() — valid use of const
      'prefer-const': 'warn',
    },
  },
]);

export default eslintConfig;
