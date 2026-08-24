# projeto-hash-bd

Trabalho acadêmico (UNIFOR, Banco de Dados) em equipe (até 5 pessoas), valendo 15% da nota. A
implementação será apresentada e o código-fonte explicado à banca — logo o código deve ser
legível e a equipe deve conseguir justificar cada decisão de implementação.

## O que é o projeto

Simular o funcionamento de um **índice hash estático** sobre uma tabela de dados armazenada em
"páginas" na memória, com interface gráfica (obrigatória — nada de terminal/popup) mostrando as
estruturas e o funcionamento passo a passo.

Dataset: arquivo `.txt` com ~466 mil palavras em inglês (uma por linha, cada palavra é uma chave
única) — fonte: https://github.com/dwyl/english-words. Já está em [src/data/words.txt](src/data/words.txt).

## Stack atual

Scaffold padrão `npm create vite` (React 19 + Vite 8, React Compiler habilitado, oxlint). Ainda **não
implementado** — [src/App.jsx](src/App.jsx) é o boilerplate default do template e precisa ser
substituído pela aplicação real. `npm run dev` / `npm run build` / `npm run lint` / `npm run preview`.

## Regra inegociável: função hash própria

A função hash **deve ser escrita pela equipe**, do zero. Não usar `hashCode`, `Object.hash`,
crypto hashes (MD5/SHA), bibliotecas de hashing, nem qualquer função hash pronta da linguagem ou
de terceiros. Deve ser determinística (mesma chave → mesmo bucket sempre) e retornar sempre um
valor no intervalo válido `[0, NB-1]`.

## Conceitos e nomenclatura (usar esses termos exatos na UI e no código)

- **Registro/Tupla**: uma palavra do arquivo.
- **Página**: agrupamento lógico de registros (simula bloco de disco). Tamanho definido pelo
  usuário na UI (deve ser > 0).
- **Bucket**: entrada do índice, guarda pares (chave → endereço da página). Capacidade **FR**
  (definida pela equipe/código, não pelo usuário).
- **NB**: número total de buckets. Regra obrigatória: `NB > NR / FR` (NR = número de registros).
  A UI deve calcular NB automaticamente e impedir `NB <= NR/FR`.
- **Colisão**: só conta quando o bucket já está cheio (excedeu FR) e uma nova chave ainda mapeia
  pra ele — colisão dentro da capacidade do bucket não é contabilizada.
- **Overflow**: quando um bucket excede FR, precisa de estratégia de transbordamento (a equipe
  escolhe o algoritmo — ex.: overflow chaining/bucket encadeado — e deve saber explicar).
- **Table Scan**: leitura sequencial de páginas até achar a chave, usado como baseline de
  comparação contra a busca indexada.

## Fluxo funcional obrigatório (ordem importa)

**Carga:**
1. Usuário seleciona o `.txt` e informa o tamanho de página → sistema valida, cria páginas
   vazias, depois popula.
2. Exibe total de palavras carregadas, total de páginas, e mostra a **primeira e a última página**
   (número + primeiros 5 registros de cada).
3. Calcula NB (dado FR fixado no código) e cria os buckets.
4. Constrói o índice percorrendo página por página: para cada chave, aplica a função hash e
   insere `(chave, endereço da página)` no bucket. Exibe tempo de construção.

**Busca:**
5. Usuário digita uma chave → busca via índice: hash → bucket → página → localizar tupla.
   Mostra: encontrada?, página, custo estimado (nº de leituras de página).
6. Botão de table scan (habilita após digitar a chave) → lê página por página até achar a chave
   (ou esgotar), lista os registros lidos, mostra página onde achou e custo (páginas lidas).
7. Mostra diferença de tempo e de custo (%) entre busca indexada e table scan.

**Estatísticas (após construir o índice):**
- Taxa de colisões (%).
- Taxa de overflow (%) — quantos buckets entraram em overflow.

**Interface gráfica deve, visualmente:**
- Mostrar primeira/última página e seus registros.
- Mostrar os buckets e seu conteúdo.
- Durante uma busca, destacar visualmente o bucket e a página acessados.

## Requisitos não funcionais

- Suportar as ~466 mil palavras sem travar a UI (cuidado com renderizar listas gigantes direto —
  paginar/virtualizar o que for exibido).
- Determinístico: mesma chave sempre cai no mesmo bucket entre execuções.
- Interface web ou desktop, sempre visual (esse requisito já está satisfeito pela escolha
  React+Vite).

## Onde a nota é ganha (não perder pontos de graça)

Cada item abaixo é avaliado separadamente e várias exigem explicar o código-fonte na apresentação:
carga de dados em páginas, input de tamanho de página, cálculo de nº de páginas, função hash
própria, cálculo de NB, busca via índice, taxa de colisões, taxa de overflow, execução do table
scan, comparação de custo/tempo entre índice e table scan. Ao implementar qualquer uma dessas
partes, manter o código organizado por responsabilidade (ex.: módulo de páginas, módulo de hash,
módulo de índice, módulo de table scan) para facilitar a explicação individual de cada trecho.

## Documento de referência completo

O PDF original com todas as User Stories (HU01–HU14), regras de negócio (RN01–RN27) e critérios
de aceitação (CA01–CA29) foi fornecido pelo usuário na conversa, não está salvo no repo. Se precisar
revisitar critérios específicos, peça ao usuário para reanexar `26.2 - Projeto 1 - Índice HASH.pdf`.
