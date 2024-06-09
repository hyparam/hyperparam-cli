import commonjs from '@rollup/plugin-commonjs'
import resolve from '@rollup/plugin-node-resolve'
import replace from '@rollup/plugin-replace'
import terser from '@rollup/plugin-terser'
import typescript from '@rollup/plugin-typescript'
import monaco from 'rollup-plugin-monaco-editor'
import postcss from 'rollup-plugin-postcss'


export default {
  input: 'src/app.js',
  output: {
    dir: 'public/build',
    inlineDynamicImports: true,
    name: 'hyperparam',
    format: 'es',
    sourcemap: true,
  },
  plugins: [
    commonjs(),
    replace({
      'process.env.NODE_ENV': JSON.stringify('production'), // or 'development' based on your build environment
      preventAssignment: true,
    }),
    resolve({ browser: true }),
    terser(),
    typescript({
      exclude: ['test/**'],
    }),
    postcss({
      extensions: ['.css'],
    }),
    monaco({
      languages: ['javascript'],
    }),
  ],
}
