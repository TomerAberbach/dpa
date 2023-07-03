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

/* eslint-disable no-throw-literal */
import dpa from './src/index.js'

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
