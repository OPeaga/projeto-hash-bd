// Realiza a busca sequencial (table scan) nas páginas
export function tableScan(pages, key) {
  const start = performance.now()
  const recordsRead = []
  let foundPage = null
  let pagesRead = 0

  for (const page of pages) {
    pagesRead++
    recordsRead.push(...page.records)
    if (page.records.includes(key)) {
      foundPage = page.number
      break
    }
  }

  const timeMs = performance.now() - start

  return {
    found: foundPage !== null,
    pageNumber: foundPage,
    pagesRead,
    recordsRead,
    timeMs,
  }
}
