import { useState } from 'react'
import { searchByIndex } from '../lib/hashIndex'
import { tableScan } from '../lib/tableScan'
import { formatInt, formatPercent, formatMs } from '../lib/format'
import PageView from '../components/PageView'
import BucketView from '../components/BucketView'

function SearchScreen({ database, onReset }) {
  const { pages, index, wordCount } = database
  const [searchKey, setSearchKey] = useState('')
  const [indexResult, setIndexResult] = useState(null)
  const [scanResult, setScanResult] = useState(null)

  function handleKeyChange(e) {
    setSearchKey(e.target.value)
    setIndexResult(null)
    setScanResult(null)
  }

  function handleSearchIndex() {
    const key = searchKey.trim()
    if (!key) return
    setIndexResult(searchByIndex(index, key))
  }

  function handleTableScan() {
    const key = searchKey.trim()
    if (!key) return
    setScanResult(tableScan(pages, key))
  }

  const canSearch = searchKey.trim().length > 0
  const both = indexResult && scanResult
  const timeDiffMs = both ? scanResult.timeMs - indexResult.timeMs : null
  const costDiffPercent =
    both && scanResult.pagesRead > 0
      ? ((scanResult.pagesRead - indexResult.pagesRead) / scanResult.pagesRead) * 100
      : null

  const indexedPage = indexResult?.found ? pages[indexResult.pageNumber] : null
  const scannedPage = scanResult?.found ? pages[scanResult.pageNumber] : null

  return (
    <div className="screen">
      <div className="screen-header">
        <div>
          <h1>Pesquisa</h1>
          <p className="muted">Busca por índice hash vs. table scan</p>
        </div>
        <button type="button" className="secondary" onClick={onReset}>
          Carregar outro arquivo
        </button>
      </div>

      <section className="card">
        <h2>Estatísticas do índice</h2>
        <div className="stats-grid">
          <div className="stat">
            <span className="stat-label">Registros (NR)</span>
            <span className="stat-value">{formatInt(wordCount)}</span>
          </div>
          <div className="stat">
            <span className="stat-label">Páginas</span>
            <span className="stat-value">{formatInt(pages.length)}</span>
          </div>
          <div className="stat">
            <span className="stat-label">Buckets (NB)</span>
            <span className="stat-value">{formatInt(index.nb)}</span>
          </div>
          <div className="stat">
            <span className="stat-label">Capacidade do bucket (FR)</span>
            <span className="stat-value">{formatInt(index.fr)}</span>
          </div>
          <div className="stat">
            <span className="stat-label">Taxa de colisões</span>
            <span className="stat-value">{formatPercent(index.collisionRate)}</span>
          </div>
          <div className="stat">
            <span className="stat-label">Taxa de overflow</span>
            <span className="stat-value">{formatPercent(index.overflowRate)}</span>
          </div>
        </div>
      </section>

      <section className="card">
        <h2>Buscar chave</h2>
        <div className="form-row">
          <input
            type="text"
            placeholder="Digite uma palavra..."
            value={searchKey}
            onChange={handleKeyChange}
          />
          <button type="button" className="primary" onClick={handleSearchIndex} disabled={!canSearch}>
            Buscar (índice)
          </button>
          <button type="button" className="secondary" onClick={handleTableScan} disabled={!canSearch}>
            Table Scan
          </button>
        </div>

        <div className="result-grid">
          {indexResult && (
            <div className="result-card">
              <h3>Busca por índice</h3>
              {indexResult.found ? (
                <p className="found">Encontrada na página {indexResult.pageNumber}</p>
              ) : (
                <p className="not-found">Não encontrada</p>
              )}
              <p className="muted small">
                Custo: {formatInt(indexResult.pagesRead)} página(s) lida(s) · {formatMs(indexResult.timeMs)}
              </p>
              <BucketView
                bucketIndex={indexResult.bucketIndex}
                bucket={indexResult.bucket}
                highlightKey={searchKey.trim()}
              />
              {indexedPage && <PageView page={indexedPage} highlightKey={searchKey.trim()} previewCount={20} />}
            </div>
          )}

          {scanResult && (
            <div className="result-card">
              <h3>Table scan</h3>
              {scanResult.found ? (
                <p className="found">Encontrada na página {scanResult.pageNumber}</p>
              ) : (
                <p className="not-found">Não encontrada</p>
              )}
              <p className="muted small">
                Custo: {formatInt(scanResult.pagesRead)} página(s) lida(s) · {formatMs(scanResult.timeMs)}
              </p>
              <p className="muted small">{formatInt(scanResult.recordsRead.length)} registros lidos</p>
              <ul className="record-list scroll">
                {scanResult.recordsRead.slice(0, 200).map((record, i) => (
                  <li key={i} className={record === searchKey.trim() ? 'highlight' : undefined}>
                    {record}
                  </li>
                ))}
                {scanResult.recordsRead.length > 200 && (
                  <li className="muted small">
                    +{formatInt(scanResult.recordsRead.length - 200)} registros não exibidos
                  </li>
                )}
              </ul>
              {scannedPage && <PageView page={scannedPage} highlightKey={searchKey.trim()} previewCount={20} />}
            </div>
          )}
        </div>

        {both && (
          <div className="comparison">
            <h3>Comparação</h3>
            <p>
              Diferença de tempo: table scan foi {timeDiffMs >= 0 ? 'mais lento' : 'mais rápido'} em{' '}
              {formatMs(Math.abs(timeDiffMs))}
            </p>
            <p>
              Diferença de custo: índice leu {formatPercent(costDiffPercent)} menos páginas que o table scan (
              {formatInt(indexResult.pagesRead)} vs {formatInt(scanResult.pagesRead)})
            </p>
          </div>
        )}
      </section>
    </div>
  )
}

export default SearchScreen
