import { hashKey } from './hash'

// NB deve obedecer NB > NR / FR (RN08). +1 garante a desigualdade estrita mesmo quando
// NR é múltiplo exato de FR.
export function computeBucketCount(recordCount, fr) {
  return Math.floor(recordCount / fr) + 1
}

// Constrói o índice percorrendo página por página (RN12/RN13). Cada bucket tem uma área
// primária de capacidade FR; ao encher, as chaves seguintes vão para a área de overflow
// (encadeamento) do próprio bucket — essa é a estratégia de resolução de overflow (RN16/RN17).
// Uma inserção só conta como colisão quando o bucket já estava cheio (RN14).
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

// Busca via índice (RN19): aplica o hash, localiza o bucket, e só lê a página de dados
// se o bucket indicar que a chave está lá — daí o custo de 1 leitura de página quando
// encontrada, e 0 quando o próprio índice já informa que a chave não existe.
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
