import commonjs from '@rollup/plugin-commonjs'
import resolve from '@rollup/plugin-node-resolve'
import replace from '@rollup/plugin-replace'
import terser from '@rollup/plugin-terser'
import postcss from 'rollup-plugin-postcss'


export default [
  // app bundle
  {
    input: 'src/app.js',
    output: {
      file: 'public/build/app.min.js',
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
      postcss({
        extensions: ['.css'],
      }),
    ],
  },
]
