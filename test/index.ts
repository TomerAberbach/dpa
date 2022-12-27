/**
 * Copyright 2022 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/* eslint-disable typescript/no-throw-literal */

import { expectTypeOf, fc, jest, testProp } from 'tomer'
import { promiseStateSync } from 'p-state'
import dpa from '../src/index.js'

jest.useFakeTimers()

testProp(
  `dpa behaves like Promise.all for resolved promises`,
  [
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
  ],
  async getResolvingValues => {
    const now1 = Date.now()
    const values1Promise = Promise.all(getResolvingValues())
    jest.runAllTimers()
    const values1 = await values1Promise
    const elapsed1 = Date.now() - now1

    const now2 = Date.now()
    const values2Promise = dpa(getResolvingValues())
    jest.runAllTimers()
    const values2 = await values2Promise
    const elapsed2 = Date.now() - now2

    expect(values2).toStrictEqual(values1)
    expect(elapsed2).toBe(elapsed1)
  },
)

testProp(
  `dpa is as fast as or faster than Promise.allSettled`,
  [
    fc.context(),
    fc
      .array(
        fc.tuple(fc.integer({ min: 1 }), fc.anything(), fc.boolean()).map(
          ([ms, value, shouldResolve]) =>
            () =>
              delay(ms).then(() =>
                shouldResolve ? value : Promise.reject(value),
              ),
        ),
      )
      .map(getValues => () => getValues.map(getValue => getValue())),
  ],
  async (context, getAwaitableValues) => {
    const allSettledNow = Date.now()
    const allSettledPromise = Promise.allSettled(getAwaitableValues())
    jest.runAllTimers()
    await allSettledPromise
    const allSettledElapsed = Date.now() - allSettledNow

    const dpaNow = Date.now()
    // eslint-disable-next-line typescript/no-empty-function
    const dpaPromise = dpa(getAwaitableValues()).catch(() => {})
    while (promiseStateSync(dpaPromise) === `pending`) {
      jest.advanceTimersToNextTimer()
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
  jest.runAllTimers()
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
    jest.advanceTimersByTime(5)
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
    jest.advanceTimersByTime(5)
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
    jest.advanceTimersByTime(5)
    await resultsPromise
  } catch (error_: unknown) {
    error = error_
  }

  const elapsed = Date.now() - now
  expect(error).toBe(2)
  expect(elapsed).toBe(5)
})

const delay = (ms: number): Promise<void> =>
  new Promise(resolve => setTimeout(resolve, ms))
