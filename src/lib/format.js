export function formatInt(n) {
  return n.toLocaleString('pt-BR')
}

export function formatPercent(n) {
  return `${n.toFixed(2)}%`
}

export function formatMs(n) {
  return `${n.toFixed(3)} ms`
}
