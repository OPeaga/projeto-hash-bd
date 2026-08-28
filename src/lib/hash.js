// Função hash própria (RN10/RN11) — hash polinomial pelo método de Horner.
// Não usa nenhuma função hash pronta da linguagem (sem hashCode, crypto, etc).
// Determinística: a mesma chave sempre produz o mesmo valor em [0, bucketCount - 1].
const HASH_PRIME = 131;

export function hashKey(key, bucketCount) {
  let hash = 0;
  for (let i = 0; i < key.length; i++) {
    hash = (hash * HASH_PRIME + key.charCodeAt(i)) % bucketCount;
  }
  return hash;
}
