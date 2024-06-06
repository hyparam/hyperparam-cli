import commonjs from '@rollup/plugin-commonjs'
import resolve from '@rollup/plugin-node-resolve'
import replace from '@rollup/plugin-replace'
import terser from '@rollup/plugin-terser'
import typescript from '@rollup/plugin-typescript'


export default {
  input: 'src/render.js',
  output: {
    file: 'public/build/render.min.js',
    name: 'hyperparam',
    format: 'iife',
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
  ],
}
