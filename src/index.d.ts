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
