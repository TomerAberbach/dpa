/* eslint-disable no-throw-literal */
import { setTimeout } from 'node:timers/promises'
import dpa from './src/index.js'

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
    setTimeout(1000).then(() => 1),
    setTimeout(4000).then(() => 2),
    setTimeout(5000).then(() => 3),
  ]),
)
// => [1, 2, 3]
// => 5s elapsed

await test(() =>
  dpa([
    setTimeout(1000).then(() => 1),
    setTimeout(4000).then(() => {
      throw 2
    }),
    setTimeout(6000).then(() => {
      throw 3
    }),
  ]),
)
// => 2 thrown
// => 4s elapsed

await test(() =>
  dpa([
    dpa([
      setTimeout(1000).then(() => 1),
      setTimeout(6000).then(() => {
        throw 2
      }),
      setTimeout(2000).then(() => {
        throw 3
      }),
    ]),
  ]),
)
// => 2 thrown
// => 6s elapsed
