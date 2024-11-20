# Hyperparam monorepo

This is a monorepo for the Hyperparam project.

It contains the following package:
- [`@hyparam/components`](./packages/components): a library of React components for building Hyperparam UIs.
- [`@hyparam/utils`](./packages/utils): a library of utils.

It also contains the following applications:
- [`hyperparam`](./apps/cli): a cli tool for viewing arbitrarily large datasets in the browser.
- [`hightable-demo`](./apps/hightable-demo): an example project showing how to use [hightable](https://github.com/hyparam/hightable).
- [`hyparquet-demo`](./apps/hyparquet-demo): an example project showing how to use [hyparquet](https://github.com/hyparam/hyparquet).

## Development

The dependencies between the packages and applications of this monorepo are pinned, and the packages are published to npm. It means that the changes in a dependency are not automatically reflected in the dependent package or application.

To make the development easier, you can locally replace the npm dependencies with the local packages, replacing the pinned versions (eg `"@hyparam/utils": "0.1.0",`) with a relative path (`"@hyparam/utils": "file:../../packages/utils",`). It's not ideal, we might switch to pnpm or yarn workspaces in the future.