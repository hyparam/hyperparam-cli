# Hyperparam monorepo

This is a monorepo for the Hyperparam project.

It contains the following packages, published to npm:
- [`@hyparam/components`](./packages/components): a library of React components and utilities for building Hyperparam UIs.
- [`hyperparam`](./packages/cli): a cli tool for viewing arbitrarily large datasets in the browser.

It also contains the following applications:
- [`hightable-demo`](./apps/hightable-demo): an example project showing how to use [hightable](https://github.com/hyparam/hightable).
- [`hyparquet-demo`](./apps/hyparquet-demo): an example project showing how to use [hyparquet](https://github.com/hyparam/hyparquet).

## Use

Install all the workspaces with:

```bash
npm install
```

Lint all the workspaces:

```bash
npm run lint
```

Test all the workspaces:

```bash
npm test
```

Compute the coverage for all the workspaces:

```bash
npm run coverage
```

Build all the workspaces (they are built in order, so the dependencies are built first - it's defined manually by the order of the workspaces in the `package.json`):

```bash
npm run build
```

Run an app:

- `hightable-demo`:

```bash
npm run dev -w hightable-demo
```

- `hyparquet-demo`:

```bash
npm run dev -w hyparquet-demo
```

- `hyperparam`:

```bash
npm run dev -w hyperparam
```

- `components`:

```bash
npm run dev -w @hyparam/components
```

## Development

The monorepo is managed with [npm workspaces](https://docs.npmjs.com/cli/v10/using-npm/workspaces). Some workspaces are dependencies of others. Currently:

- `@hyparam/components` is a dependency of `hyperparam` and `hyparquet-demo`.

It means that if you make a change to `@hyparam/components`, you need to rebuild it before developing `hyperparam` or `hyparquet-demo`.

Also, if you increment the version of `@hyparam/components`, you need to update the version of `@hyparam/components` in the `package.json` of `hyperparam` and `hyparquet-demo`, as we use exact versions in the `package.json` of the workspaces. Note that we don't have to increment the version after every change, only when we want to publish a new version with a significant batch of changes.

The root package.json contains a special field, `overrides`, which sets the shared dependencies versions we want to have in all the workspaces. The "check_dependencies" GitHub action checks that the dependencies are the same in all the workspaces (`npm ls` would fail if dependency version mismatch).