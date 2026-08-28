// Função de hash polinomial para calcular o bucket da chave
const HASH_PRIME = 131;

export function hashKey(key, bucketCount) {
  let hash = 0;
  for (let i = 0; i < key.length; i++) {
    hash = (hash * HASH_PRIME + key.charCodeAt(i)) % bucketCount;
  }
  return hash;
}
