import { useState } from 'react'
import { parseWords } from '../lib/parseWords'
import { splitIntoPages } from '../lib/pages'
import { buildIndex } from '../lib/hashIndex'
import { BUCKET_CAPACITY_FR } from '../lib/config'
import { formatInt, formatPercent, formatMs } from '../lib/format'
import PageView from '../components/PageView'
import sampleWordsRaw from '../data/words.txt?raw'

function LoadScreen({ onLoaded }) {
  const [fileName, setFileName] = useState(null)
  const [words, setWords] = useState(null)
  const [pageSize, setPageSize] = useState('1000')
  const [error, setError] = useState(null)
  const [building, setBuilding] = useState(false)
  const [preview, setPreview] = useState(null)

  function loadText(name, text) {
    const parsed = parseWords(text)
    if (parsed.length === 0) {
      setError('O arquivo está vazio ou não contém palavras legíveis.')
      setWords(null)
      setFileName(null)
      return
    }
    setError(null)
    setFileName(name)
    setWords(parsed)
    setPreview(null)
  }

  function handleFileChange(e) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => loadText(file.name, String(reader.result))
    reader.onerror = () => setError('Não foi possível ler o arquivo.')
    reader.readAsText(file)
  }

  function handleUseSample() {
    loadText('words.txt (amostra)', sampleWordsRaw)
  }

  async function handleBuild() {
    setError(null)
    if (!words) {
      setError('Selecione um arquivo .txt primeiro.')
      return
    }
    const size = Number(pageSize)
    if (!Number.isInteger(size) || size <= 0) {
      setError('O tamanho da página deve ser um número inteiro maior que zero.')
      return
    }

    setBuilding(true)
    // Permite que o React atualize a interface antes do processamento
    await new Promise((resolve) => setTimeout(resolve, 0))

    const pages = splitIntoPages(words, size)
    const index = buildIndex(pages, BUCKET_CAPACITY_FR)

    setBuilding(false)
    setPreview({ pages, index, pageSize: size, wordCount: words.length })
  }

  const firstPage = preview?.pages[0]
  const lastPage = preview?.pages[preview.pages.length - 1]

  return (
    <div className="screen">
      <h1>Índice Hash Estático</h1>
      <p className="muted">Carga e organização dos dados</p>

      <section className="card">
        <h2>1. Arquivo de palavras</h2>
        <div className="form-row">
          <input type="file" accept=".txt" onChange={handleFileChange} />
          <button type="button" className="secondary" onClick={handleUseSample}>
            Usar arquivo de exemplo
          </button>
        </div>
        {fileName && (
          <p className="muted small">
            {fileName} — {formatInt(words.length)} palavras carregadas
          </p>
        )}
      </section>

      <section className="card">
        <h2>2. Tamanho da página</h2>
        <div className="form-row">
          <label htmlFor="page-size">Registros por página</label>
          <input
            id="page-size"
            type="number"
            min="1"
            value={pageSize}
            onChange={(e) => setPageSize(e.target.value)}
          />
        </div>
      </section>

      {error && <p className="error">{error}</p>}

      <button type="button" className="primary" onClick={handleBuild} disabled={building}>
        {building ? 'Construindo índice...' : 'Carregar e construir índice'}
      </button>

      {preview && (
        <section className="card">
          <h2>Resumo da carga</h2>
          <div className="stats-grid">
            <div className="stat">
              <span className="stat-label">Registros (NR)</span>
              <span className="stat-value">{formatInt(preview.wordCount)}</span>
            </div>
            <div className="stat">
              <span className="stat-label">Páginas</span>
              <span className="stat-value">{formatInt(preview.pages.length)}</span>
            </div>
            <div className="stat">
              <span className="stat-label">Buckets (NB)</span>
              <span className="stat-value">{formatInt(preview.index.nb)}</span>
            </div>
            <div className="stat">
              <span className="stat-label">Capacidade do bucket (FR)</span>
              <span className="stat-value">{formatInt(preview.index.fr)}</span>
            </div>
            <div className="stat">
              <span className="stat-label">Taxa de colisões</span>
              <span className="stat-value">{formatPercent(preview.index.collisionRate)}</span>
            </div>
            <div className="stat">
              <span className="stat-label">Taxa de overflow</span>
              <span className="stat-value">{formatPercent(preview.index.overflowRate)}</span>
            </div>
            <div className="stat">
              <span className="stat-label">Tempo de construção</span>
              <span className="stat-value">{formatMs(preview.index.buildTimeMs)}</span>
            </div>
          </div>

          <h3>Primeira e última página</h3>
          <div className="page-preview-grid">
            <PageView page={firstPage} previewCount={5} />
            {lastPage.number !== firstPage.number && <PageView page={lastPage} previewCount={5} />}
          </div>

          <button type="button" className="primary" onClick={() => onLoaded(preview)}>
            Ir para pesquisa
          </button>
        </section>
      )}
    </div>
  )
}

export default LoadScreen
