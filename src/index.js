const dpa = async iterable => {
  // Prevent UnhandledPromiseRejection
  Promise.all(iterable).catch(() => {})

  const results = []

  for (const value of iterable) {
    results.push(await value)
  }

  return results
}

export default dpa
