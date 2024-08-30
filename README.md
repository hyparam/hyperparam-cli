# hyperparam

[![npm](https://img.shields.io/npm/v/hyperparam)](https://www.npmjs.com/package/hyperparam)
[![workflow status](https://github.com/hyparam/hyperparam-cli/actions/workflows/ci.yml/badge.svg)](https://github.com/hyparam/hyperparam-cli/actions)
[![mit license](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
![coverage](https://img.shields.io/badge/Coverage-37-darkred)

This is the hyperparam cli tool.

The hyperparam cli tool is for viewing arbitrarily large datasets in the browser.

## Viewer

To open a file browser in your current local directory run:

```sh
npx hyperparam
```

You can also pass a specific file, folder, or url:

```sh
npx hyperparam example.parquet
npx hyperparam directory/
npx hyperparam https://hyperparam-public.s3.amazonaws.com/bunnies.parquet
```

## Chat

To start a chat with hyperparam:

```sh
npx hyperparam chat
```

## Installation

Install for all users:

```sh
sudo npm i -g hyperparam
```

Now you can just run:

```sh
hyperparam
```

or:

```sh
hyp
```
