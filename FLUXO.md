# Fluxo do código — Índice Hash Estático

Este documento explica como as peças do projeto se encaixam, do arquivo `.txt` carregado até o
resultado de uma busca na tela. Serve como roteiro pra explicar o código na apresentação.

## Visão geral

```
App.jsx
  │
  ├── (sem dados ainda) ──► LoadScreen.jsx  ──► onLoaded(database) ──┐
  │                                                                    │
  └── (dados carregados) ─► SearchScreen.jsx  ◄────────────────────────┘
```

`App.jsx` só decide qual tela mostrar, com base em um único estado:

```jsx
const [database, setDatabase] = useState(null);

if (!database) return <LoadScreen onLoaded={setDatabase} />;
return <SearchScreen database={database} onReset={() => setDatabase(null)} />;
```

`database` é o objeto que sai da tela de carga e alimenta a tela de busca:

```js
{
  (pages, index, pageSize, wordCount);
}
```

Enquanto `database` é `null`, o app está na tela 1 (carga). Assim que `LoadScreen` chama
`onLoaded(...)`, o React re-renderiza e troca pra tela 2 (busca) — não tem roteador, é só esse
`if`.

## Módulos de lógica ([src/lib/](src/lib/))

Cada arquivo faz uma única coisa, sem depender de UI — são funções puras, testáveis isoladamente
e fáceis de explicar em separado na apresentação.

### `parseWords.js`

Transforma o texto bruto do arquivo em um array de palavras:

```js
export function parseWords(text) {
  return text
    .split(/\r?\n/) // quebra por linha
    .map((line) => line.trim())
    .filter(Boolean); // descarta linhas vazias
}
```

### `pages.js`

Fatia o array de palavras em páginas de tamanho fixo (definido pelo usuário na tela 1):

```js
export function splitIntoPages(words, pageSize) {
  const pages = [];
  for (let i = 0; i < words.length; i += pageSize) {
    pages.push({ number: pages.length, records: words.slice(i, i + pageSize) });
  }
  return pages;
}
```

Cada página é `{ number, records: [...] }`. Isso simula blocos de disco: os dados "reais" moram
aqui, não no índice.

### `config.js`

Uma única constante: `BUCKET_CAPACITY_FR = 4` — a capacidade de cada bucket (FR). É decidida pela
equipe no código, diferente do tamanho de página, que é input do usuário.

### `hash.js`

A função hash própria (obrigatória pelo enunciado — não pode usar hash pronto da linguagem).
Hash polinomial pelo método de Horner:

```js
const HASH_PRIME = 131;

export function hashKey(key, bucketCount) {
  let hash = 0;
  for (let i = 0; i < key.length; i++) {
    hash = (hash * HASH_PRIME + key.charCodeAt(i)) % bucketCount;
  }
  return hash;
}
```

Percorre a palavra caractere a caractere, cada passo usa o `hash` acumulado do passo anterior. O
`% bucketCount` no final de cada iteração garante que o resultado nunca ultrapasse `NB - 1` e
evita que o número cresça demais (overflow numérico). Determinística: a mesma string sempre
produz o mesmo número pro mesmo `bucketCount`.

### `hashIndex.js` — o coração do índice

**`computeBucketCount(recordCount, fr)`** calcula NB:

```js
export function computeBucketCount(recordCount, fr) {
  return Math.floor(recordCount / fr) + 1; // garante NB > NR/FR
}
```

**`buildIndex(pages, fr)`** constrói o índice percorrendo página por página, registro por
registro:

```js
for (const page of pages) {
  for (const key of page.records) {
    const bucketIndex = hashKey(key, nb); // 1. aplica o hash
    const bucket = buckets[bucketIndex]; // 2. acha o bucket
    const entry = { key, pageNumber: page.number };

    if (bucket.primary.length < fr) {
      bucket.primary.push(entry); // 3a. cabe na área primária
    } else {
      collisions++;
      bucket.overflow.push(entry); // 3b. bucket cheio → overflow (colisão)
    }
  }
}
```

Cada bucket é `{ primary: [], overflow: [] }`. `primary` é a área com capacidade FR; `overflow` é
onde vai o que não coube — essa é a estratégia de resolução de overflow (encadeamento dentro do
próprio bucket). Uma inserção só conta como **colisão** quando a área primária já estava cheia.

No final, `buildIndex` também calcula as métricas pedidas pelo enunciado:

```js
collisionRate = (collisions / recordCount) * 100;
overflowRate = (overflowBuckets / nb) * 100; // buckets com overflow.length > 0
```

**`searchByIndex(index, key)`** faz o caminho inverso: aplica o mesmo hash na chave buscada,
acha o bucket, procura a chave primeiro em `primary`, depois em `overflow`. Se achar, retorna a
página onde o registro está e `pagesRead: 1` (o único acesso a disco simulado — ler aquela
página pra confirmar). Se não achar em nenhuma lista do bucket, retorna `pagesRead: 0`, porque o
índice já disse que a chave não existe, sem precisar ler nenhuma página.

### `tableScan.js`

Ignora os buckets completamente — é o "sem índice". Varre as páginas em ordem, olhando os
registros de cada uma, até achar a chave (ou esgotar tudo):

```js
for (const page of pages) {
  pagesRead++;
  recordsRead.push(...page.records);
  if (page.records.includes(key)) {
    foundPage = page.number;
    break;
  }
}
```

Serve de baseline pra comparar tempo e custo (páginas lidas) contra a busca indexada.

### `format.js`

Só formatação de exibição (números com separador de milhar, percentual, milissegundos). Não tem
lógica de negócio.

## Tela 1 — [LoadScreen.jsx](src/screens/LoadScreen.jsx)

Fluxo de estado dentro da tela:

1. Usuário seleciona um `.txt` (ou clica "usar exemplo") → `FileReader` lê o texto →
   `parseWords` → guarda o array de palavras em `words`. Se vier vazio, mostra erro (arquivo
   vazio/ilegível).
2. Usuário digita o tamanho de página → `pageSize` (validado > 0 e inteiro no clique de
   construir).
3. Clique em "Carregar e construir índice" → `handleBuild()`:
   - valida `words` e `pageSize`
   - `splitIntoPages(words, size)` → `pages`
   - `buildIndex(pages, BUCKET_CAPACITY_FR)` → `index` (com todas as métricas já calculadas)
   - guarda tudo em `preview` → a UI mostra o resumo (NR, páginas, NB, FR, taxas, tempo de
     construção) e a primeira/última página com os 5 primeiros registros de cada
     ([PageView.jsx](src/components/PageView.jsx))
4. Clique em "Ir para pesquisa" → chama `onLoaded(preview)`, que sobe pro `App.jsx` e troca de
   tela.

O `await new Promise((resolve) => setTimeout(resolve, 0))` antes de rodar `splitIntoPages`/
`buildIndex` existe só pra deixar o React pintar o estado "Construindo índice..." antes do
trabalho síncrono pesado (que trava a thread principal enquanto roda).

## Tela 2 — [SearchScreen.jsx](src/screens/SearchScreen.jsx)

Recebe `database = { pages, index, pageSize, wordCount }` como prop, fixo (não recalcula nada,
só consulta).

- **Estatísticas** (topo): lidas direto de `index` — NR, páginas, NB, FR, taxa de colisão, taxa
  de overflow. Sempre visíveis.
- **Campo de busca**: `searchKey`. Toda vez que muda, os resultados anteriores são limpos
  (`setIndexResult(null)`, `setScanResult(null)`), pra não misturar resultado de uma chave com
  outra.
- **Botão "Buscar (índice)"** → `searchByIndex(index, key)` → guarda em `indexResult`. Mostra:
  encontrada?, página, custo (páginas lidas), tempo, e o bucket acessado
  ([BucketView.jsx](src/components/BucketView.jsx), destacando a chave dentro dele) + a página
  onde caiu, se encontrada.
- **Botão "Table Scan"** → `tableScan(pages, key)` → guarda em `scanResult`. Mostra: encontrada?,
  página, custo, tempo, e a lista de registros lidos durante a varredura (limitada a 200 na tela
  pra não travar o navegador — o dado completo fica em memória, só a exibição é cortada).
- **Comparação**: só aparece quando os dois resultados existem ao mesmo tempo
  (`indexResult && scanResult`). Calcula a diferença de tempo (`scanResult.timeMs -
indexResult.timeMs`) e a diferença percentual de custo em páginas lidas.

## Componentes de visualização

- **`PageView.jsx`**: mostra uma página e seus registros. Aceita `previewCount` (mostra só os N
  primeiros, usado na tela de carga) ou lista tudo até um teto (`maxRecords`, usado na tela de
  busca pra mostrar a página inteira onde a chave foi encontrada). Aceita `highlightKey` pra
  pintar o registro buscado.
- **`BucketView.jsx`**: mostra o conteúdo de um bucket — área primária e, se houver, área de
  overflow — com a chave buscada destacada. É o que implementa o requisito de "destacar o bucket
  acessado durante a busca".

## Resumo do ciclo completo

```
arquivo.txt
   │  parseWords
   ▼
words[]
   │  splitIntoPages(pageSize)
   ▼
pages[]  ──────────────────┐
   │  buildIndex(FR)         │ (tableScan usa direto)
   ▼                         │
index { buckets[], nb, fr,   │
        collisionRate,       │
        overflowRate }       │
   │                         │
   │  searchByIndex(key)     │  tableScan(pages, key)
   ▼                         ▼
indexResult              scanResult
   └──────────┬──────────────┘
              ▼
        comparação (tempo / custo)
```
