/* eslint-disable typescript/only-throw-error */
import { promiseStateSync } from 'p-state'
import { fc, test } from '@fast-check/vitest'
import { afterEach, beforeEach, expect, expectTypeOf, vi } from 'vitest'
import dpa from './index.js'

beforeEach(() => {
  vi.useFakeTimers()
})
afterEach(() => {
  vi.useRealTimers()
})

test.prop([
  fc
    .array(
      fc.oneof(
        fc.anything().map(value => () => value),
        fc.tuple(fc.nat(), fc.anything()).map(
          ([ms, value]) =>
            () =>
              delay(ms).then(() => value),
        ),
      ),
    )
    .map(getValues => () => getValues.map(getValue => getValue())),
])(
  `dpa behaves like Promise.all for resolved promises`,
  async getResolvingValues => {
    const now1 = Date.now()
    const values1Promise = Promise.all(getResolvingValues())
    vi.runAllTimers()
    const values1 = await values1Promise
    const elapsed1 = Date.now() - now1

    const now2 = Date.now()
    const values2Promise = dpa(getResolvingValues())
    vi.runAllTimers()
    const values2 = await values2Promise
    const elapsed2 = Date.now() - now2

    expect(values2).toStrictEqual(values1)
    expect(elapsed2).toBe(elapsed1)
  },
)

test.prop([
  fc.context(),
  fc
    .array(
      fc.tuple(fc.integer({ min: 1 }), fc.anything(), fc.boolean()).map(
        ([ms, value, shouldResolve]) =>
          () =>
            delay(ms).then(() =>
              // eslint-disable-next-line typescript/prefer-promise-reject-errors
              shouldResolve ? value : Promise.reject(value),
            ),
      ),
    )
    .map(getValues => () => getValues.map(getValue => getValue())),
])(
  `dpa is as fast as or faster than Promise.allSettled`,
  async (context, getAwaitableValues) => {
    const allSettledNow = Date.now()
    const allSettledPromise = Promise.allSettled(getAwaitableValues())
    vi.runAllTimers()
    await allSettledPromise
    const allSettledElapsed = Date.now() - allSettledNow

    const dpaNow = Date.now()
    const dpaPromise = dpa(getAwaitableValues()).catch(() => {})
    while (promiseStateSync(dpaPromise) === `pending`) {
      vi.advanceTimersToNextTimer()
      await Promise.resolve()
    }
    const dpaElapsed = Date.now() - dpaNow

    context.log(`${dpaElapsed} <= ${allSettledElapsed}`)
    expect(dpaElapsed).toBeLessThanOrEqual(allSettledElapsed)
  },
)

test(`dpa all resolving`, async () => {
  const promises = [
    delay(5).then(() => 1),
    delay(10).then(() => 2),
    delay(3).then(() => 3),
  ] as const
  const now = Date.now()

  const resultsPromise = dpa(promises)
  vi.runAllTimers()
  const results = await resultsPromise

  const elapsed = Date.now() - now
  expectTypeOf(results).toEqualTypeOf<[number, number, number]>()
  expect(results).toStrictEqual([1, 2, 3])
  expect(elapsed).toBe(10)
})

test(`dpa one rejecting`, async () => {
  const promises = [
    delay(5).then(() => 1),
    delay(3).then(() => {
      throw 2
    }),
    delay(10).then(() => 3),
  ]
  const now = Date.now()

  const resultsPromise = dpa(promises)
  let error
  try {
    vi.advanceTimersByTime(5)
    await resultsPromise
  } catch (error_: unknown) {
    error = error_
  }

  const elapsed = Date.now() - now
  expect(error).toBe(2)
  expect(elapsed).toBe(5)
})

test(`dpa multiple rejecting, higher first`, async () => {
  const promises = [
    delay(5).then(() => 1),
    delay(3).then(() => {
      throw 2
    }),
    delay(10).then(() => 3),
    delay(1).then(() => {
      throw 4
    }),
  ]
  const now = Date.now()

  const resultsPromise = dpa(promises)
  let error
  try {
    vi.advanceTimersByTime(5)
    await resultsPromise
  } catch (error_: unknown) {
    error = error_
  }

  const elapsed = Date.now() - now
  expect(error).toBe(2)
  expect(elapsed).toBe(5)
})

test(`dpa multiple rejecting, lower first`, async () => {
  const promises = [
    delay(5).then(() => 1),
    delay(1).then(() => {
      throw 2
    }),
    delay(10).then(() => 3),
    delay(15).then(() => {
      throw 4
    }),
  ]
  const now = Date.now()

  const resultsPromise = dpa(promises)
  let error
  try {
    vi.advanceTimersByTime(5)
    await resultsPromise
  } catch (error_: unknown) {
    error = error_
  }

  const elapsed = Date.now() - now
  expect(error).toBe(2)
  expect(elapsed).toBe(5)
})

const delay = (ms: number): Promise<void> =>
  new Promise(resolve => {
    setTimeout(resolve, ms)
  })
