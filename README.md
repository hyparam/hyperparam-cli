# Hyperparam monorepo

This is a monorepo for the Hyperparam project.

It contains the following packages, published to npm:
- [`@hyparam/components`](./packages/components): a library of React components and utilities for building Hyperparam UIs.
- [`hyperparam`](./packages/cli): a cli tool for viewing arbitrarily large datasets in the browser.

It also contains the following applications:
- [`hightable-demo`](./apps/hightable-demo): an example project showing how to use [hightable](https://github.com/hyparam/hightable).
- [`hyparquet-demo`](./apps/hyparquet-demo): an example project showing how to use [hyparquet](https://github.com/hyparam/hyparquet).

## Development

The dependencies between the packages and applications of this monorepo are pinned, and the packages are published to npm. It means that the changes in a dependency are not automatically reflected in the dependent package or application.

To make the development easier, you can locally replace the npm dependencies with the local packages, 1. creating a local package with `npm pack`, 2. replacing the pinned versions (eg `"@hyparam/components": "0.1.3",`) with a relative path to the local package (`"@hyparam/components": "file:../../packages/components/hyparam-components-0.1.3.tgz",`).
