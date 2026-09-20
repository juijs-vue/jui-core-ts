import typescript from '@rollup/plugin-typescript'
import { nodeResolve } from '@rollup/plugin-node-resolve'
import terser from '@rollup/plugin-terser'
import { createRequire } from 'node:module'

const pkg = createRequire(import.meta.url)('./package.json')

function ts() {
  return typescript({
    tsconfig: './tsconfig.json',
    declaration: false,
    declarationMap: false,
    sourceMap: true
  })
}

export default [
  {
    input: 'src/index.ts',
    output: { file: pkg.main, format: 'cjs', exports: 'named', sourcemap: true },
    plugins: [nodeResolve(), ts()]
  },
  {
    input: 'src/index.ts',
    output: { file: pkg.module, format: 'es', sourcemap: true },
    plugins: [nodeResolve(), ts()]
  },
  {
    input: 'src/index.ts',
    output: { file: 'dist/jui-core.js', format: 'iife', name: 'juiCore', exports: 'named', sourcemap: true },
    plugins: [nodeResolve(), ts()]
  },
  {
    input: 'src/index.ts',
    output: { file: 'dist/jui-core.min.js', format: 'iife', name: 'juiCore', exports: 'named', sourcemap: true },
    plugins: [nodeResolve(), ts(), terser()]
  }
]
