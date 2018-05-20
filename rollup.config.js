let pkg = require('./package.json')
let external = Object.keys(pkg.dependencies)

export default {
  input: 'src/index.js',
  external: external,
  output: [
    {
      file: pkg['main'],
      format: 'cjs',
      sourcemap: true
    }
  ]
}
