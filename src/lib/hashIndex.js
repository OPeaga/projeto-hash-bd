import { hashKey } from './hash'

// Calcula a quantidade de buckets (NB)
export function computeBucketCount(recordCount, fr) {
  return Math.floor(recordCount / fr) + 1
}

// Constrói o índice hash a partir das páginas de dados
export function buildIndex(pages, fr) {
  const recordCount = pages.reduce((sum, page) => sum + page.records.length, 0)
  const nb = computeBucketCount(recordCount, fr)
  const buckets = Array.from({ length: nb }, () => ({ primary: [], overflow: [] }))

  let collisions = 0
  const start = performance.now()

  for (const page of pages) {
    for (const key of page.records) {
      const bucketIndex = hashKey(key, nb)
      const bucket = buckets[bucketIndex]
      const entry = { key, pageNumber: page.number }

      if (bucket.primary.length < fr) {
        bucket.primary.push(entry)
      } else {
        collisions++
        bucket.overflow.push(entry)
      }
    }
  }

  const buildTimeMs = performance.now() - start
  const overflowBuckets = buckets.filter((bucket) => bucket.overflow.length > 0).length

  return {
    buckets,
    nb,
    fr,
    recordCount,
    buildTimeMs,
    collisions,
    overflowBuckets,
    collisionRate: recordCount ? (collisions / recordCount) * 100 : 0,
    overflowRate: nb ? (overflowBuckets / nb) * 100 : 0,
  }
}

// Realiza a busca de uma chave no índice hash
export function searchByIndex(index, key) {
  const start = performance.now()
  const bucketIndex = hashKey(key, index.nb)
  const bucket = index.buckets[bucketIndex]
  const entry =
    bucket.primary.find((item) => item.key === key) ??
    bucket.overflow.find((item) => item.key === key)
  const timeMs = performance.now() - start

  return {
    found: Boolean(entry),
    pageNumber: entry ? entry.pageNumber : null,
    bucketIndex,
    bucket,
    pagesRead: entry ? 1 : 0,
    timeMs,
  }
}
