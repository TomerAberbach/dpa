<h1 align="center">
  dpa
</h1>

<div align="center">
  <a href="https://npmjs.org/package/dpa">
    <img src="https://badgen.now.sh/npm/v/dpa" alt="version" />
  </a>
  <a href="https://github.com/TomerAberbach/dpa/actions">
    <img src="https://github.com/TomerAberbach/dpa/workflows/CI/badge.svg" alt="CI" />
  </a>
  <a href="http://img.badgesize.io/https://unpkg.com/dpa/dist/index.min.js?compression=gzip&label=gzip">
    <img src="https://unpkg.com/dpa/dist/index.min.js" alt="gzip size" />
  </a>
  <a href="http://img.badgesize.io/https://unpkg.com/dpa/dist/index.min.js?compression=brotli&label=brotli">
    <img src="https://unpkg.com/dpa/dist/index.min.js" alt="brotli size" />
  </a>
</div>

<div align="center">
  Resolves promises concurrently with deterministic rejection order. Somewhere between <code>Promise.all</code> and <code>Promise.allSettled</code>.
</div>

## Features

- **Deterministic:** always rejects with the same promise for a list of promises
  where some reject regardless of which one rejects first
- **Performant:** always resolves or rejects as fast as or faster than
  [`Promise.allSettled`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/allSettled)
  for the same input
- **Familiar:** same API as
  [Promise.all](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/all)
  including iterables support
- **Tiny:** ~130 bytes minzipped!

## Install

```sh
$ npm i dpa
```

## Huh? What? Why?

**D**eterministic **p**romise **a**ll. I _promise_ (pun intended!) it's not as
esoteric as it sounds!

Suppose you have some asynchronous authorization functions, each resolving to
`undefined` or rejecting, that you'd like to run on all requests to an endpoint.
You care about performance! So you run the authorization checks concurrently
using `Promise.all` and display an error to the user on rejection.

Using [Remix](https://remix.run) it might look something like this:

```js
import { useCatch } from 'remix'

export const loader = async ({ request }) => {
  await Promise.all([
    checkThing1(request),
    checkThing2(request),
    checkThing3(request),
  ])

  // Do authorized stuff...
}

// Rendered when an error response is thrown in `loader`
export const CatchBoundary = () => {
  const caught = useCatch()

  // Return some JSX...
}
```

### The problem

Everything _seems_ to work great, but what if the promises returned by
`checkThing1` and `checkThing2` both reject? What does the user see? The answer
is it depends on which one rejects first!

That's right. You're error page is nondeterministic. The user can visit the same
URL with the same authorization state and receive a different page purely based
on how quickly each authorization check completes.

Another problematic case in a framework like Remix is redirects. In Remix you
can redirect by throwing redirect responses. If you use `Promise.all` to
concurrently run a bunch of functions that may throw redirects, then your
redirects are nondeterministic too.

### The solution

You could use
[`Promise.allSettled`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/allSettled)
to wait for all the promises to either resolve or reject, then if any reject you
could reject with the first rejected promise in your list of promises. This way
you reject with the same promise regardless of which one rejects first
(time-wise). This is what
[Remix was doing to keep concurrent loader execution deterministic](https://github.com/remix-run/remix/blob/ffc6000cde2bcdd99c9db53f0b116dabfb2da65e/packages/remix-server-runtime/server.ts#L301)
(and maybe still does, but I couldn't figure where that's done at latest
commit).

But can we do better? What if the first promise in your list is the first
promise to reject? We could reject right away and still be deterministic! But
with `Promise.allSettled` we're stuck waiting for every promise to resolve in
all cases...

More generally, if a promise in your list rejects and every promise before it in
the list resolved, then we can immediately reject with that promise. That's what
`dpa` does. It's deterministic while being strictly as fast as or faster than
`Promise.allSettled`!

## Usage

<!-- eslint-disable no-throw-literal -->

```js
import dpa from 'dpa'

const delay = ms => new Promise(resolve => setTimeout(resolve, ms))
const test = async fn => {
  const start = Date.now()
  try {
    console.log(await fn())
  } catch (error) {
    console.log(`${error} thrown`)
  } finally {
    const elapsed = Date.now() - start
    console.log(`${Math.trunc(elapsed / 1000)}s elapsed`)
  }
  console.log()
}

await test(() =>
  dpa([
    delay(1000).then(() => 1),
    delay(4000).then(() => 2),
    delay(5000).then(() => 3),
  ]),
)
// => [1, 2, 3]
// => 5s elapsed

await test(() =>
  dpa([
    delay(1000).then(() => 1),
    delay(4000).then(() => {
      throw 2
    }),
    delay(6000).then(() => {
      throw 3
    }),
  ]),
)
// => 2 thrown
// => 4s elapsed

await test(() =>
  dpa([
    dpa([
      delay(1000).then(() => 1),
      delay(6000).then(() => {
        throw 2
      }),
      delay(2000).then(() => {
        throw 3
      }),
    ]),
  ]),
)
// => 2 thrown
// => 6s elapsed
```

## Contributing

Stars are always welcome!

For bugs and feature requests,
[please create an issue](https://github.com/TomerAberbach/dpa/issues/new).

For pull requests, please read the
[contributing guidelines](https://github.com/TomerAberbach/dpa/blob/main/contributing.md).

## License

[Apache License 2.0](https://github.com/TomerAberbach/dpa/blob/main/license)

This is not an official Google product.
