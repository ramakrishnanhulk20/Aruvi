import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import typescript from '@rollup/plugin-typescript';
import terser from '@rollup/plugin-terser';
import replace from '@rollup/plugin-replace';

const production = !process.env.ROLLUP_WATCH;

// Shared plugins
const basePlugins = [
  resolve({
    browser: true,
  }),
  commonjs(),
  replace({
    preventAssignment: true,
    'process.env.NODE_ENV': JSON.stringify(production ? 'production' : 'development'),
  }),
];

// Main SDK build (vanilla JS)
const mainConfig = {
  input: 'src/index.ts',
  output: [
    // ESM build
    {
      file: 'dist/aruvi-sdk.esm.js',
      format: 'esm',
      sourcemap: true,
    },
    // UMD build for browsers
    {
      file: 'dist/aruvi-sdk.umd.js',
      format: 'umd',
      name: 'Aruvi',
      sourcemap: true,
      globals: {},
    },
    // Minified UMD build
    {
      file: 'dist/aruvi-sdk.min.js',
      format: 'umd',
      name: 'Aruvi',
      sourcemap: true,
      plugins: [terser()],
    },
  ],
  plugins: [
    ...basePlugins,
    typescript({
      tsconfig: './tsconfig.json',
      declaration: true,
      declarationDir: 'dist/types',
      exclude: ['**/*.test.ts', 'src/react.tsx'],
    }),
  ],
};

// React components build
const reactConfig = {
  input: 'src/react.tsx',
  output: [
    // ESM build
    {
      file: 'dist/react/index.esm.js',
      format: 'esm',
      sourcemap: true,
    },
    // CJS build
    {
      file: 'dist/react/index.cjs.js',
      format: 'cjs',
      sourcemap: true,
    },
  ],
  external: ['react', 'react-dom'],
  plugins: [
    ...basePlugins,
    typescript({
      tsconfig: './tsconfig.json',
      declaration: true,
      declarationDir: 'dist/react/types',
    }),
  ],
};

// CSS styles build (just copies the inline styles for documentation)
const cssContent = `
/**
 * Aruvi SDK Styles
 * Optional - these styles are automatically injected by the SDK
 * Import this file only if you need to customize the styles
 */

/* Button Base Styles */
.aruvi-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  border: none;
  text-decoration: none;
  font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
}

/* Button Sizes */
.aruvi-button--small {
  height: 36px;
  padding: 0 16px;
  font-size: 14px;
  border-radius: 8px;
}

.aruvi-button--medium {
  height: 44px;
  padding: 0 24px;
  font-size: 15px;
  border-radius: 10px;
}

.aruvi-button--large {
  height: 52px;
  padding: 0 32px;
  font-size: 16px;
  border-radius: 12px;
}

/* Button Variants */
.aruvi-button--primary {
  background: linear-gradient(135deg, #0070ba 0%, #003087 100%);
  color: #ffffff;
}

.aruvi-button--primary:hover {
  filter: brightness(1.1);
  transform: translateY(-1px);
}

.aruvi-button--secondary {
  background: #f5f7fa;
  color: #003087;
}

.aruvi-button--secondary:hover {
  background: #e8ecf2;
}

.aruvi-button--outline {
  background: transparent;
  color: #0070ba;
  border: 2px solid #0070ba;
}

.aruvi-button--outline:hover {
  background: rgba(0, 112, 186, 0.08);
}

.aruvi-button--dark {
  background: #1a1a1a;
  color: #ffffff;
}

.aruvi-button--dark:hover {
  background: #2a2a2a;
}

/* Button States */
.aruvi-button:disabled,
.aruvi-button--disabled {
  opacity: 0.5;
  cursor: not-allowed;
  pointer-events: none;
}

/* Spinner Animation */
@keyframes aruvi-spin {
  to {
    transform: rotate(360deg);
  }
}

.aruvi-spinner {
  width: 20px;
  height: 20px;
  border: 2px solid currentColor;
  border-top-color: transparent;
  border-radius: 50%;
  animation: aruvi-spin 1s linear infinite;
}
`;

export default [mainConfig, reactConfig];
