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

/**
 * Returns a promise that resolves with an array of results when all of the
 * given promises resolve, or that rejects with the first rejecting promise in
 * the given iterable in iteration order.
 *
 * The described behavior ensures that for the same iteration order of resolving
 * and rejecting promises, the same promise would be returned regardless of how
 * much time it takes each promise to resolve.
 *
 * @see https://github.com/TomerAberbach/dpa#huh-what-why
 */
declare const dpa: typeof Promise.all

export default dpa
