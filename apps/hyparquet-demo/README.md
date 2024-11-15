# Hyparquet demo

This is an example project showing how to use [hyparquet](https://github.com/hyparam/hyparquet).

## Build

```bash
cd apps/hyparquet-demo
npm i
npm run build
```

The build artifacts will be stored in the `dist/` directory and can be served using any static server, eg. `http-server`:

```bash
npm i -g http-server
http-server dist/
```
