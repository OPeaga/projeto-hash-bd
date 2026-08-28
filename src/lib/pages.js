// Divide as palavras em páginas de tamanho fixo
export function splitIntoPages(words, pageSize) {
  const pages = []
  for (let i = 0; i < words.length; i += pageSize) {
    pages.push({
      number: pages.length,
      records: words.slice(i, i + pageSize),
    })
  }
  return pages
}
