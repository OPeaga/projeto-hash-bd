import { formatInt } from '../lib/format'

// Exibe uma página de dados e seus registros
function PageView({ page, previewCount, maxRecords = 50, highlightKey }) {
  const shown = previewCount ? page.records.slice(0, previewCount) : page.records.slice(0, maxRecords)
  const hiddenCount = page.records.length - shown.length

  return (
    <div className="page-view">
      <div className="page-view-header">
        <strong>Página {page.number}</strong>
        <span className="muted">{formatInt(page.records.length)} registros</span>
      </div>
      <ul className="record-list">
        {shown.map((record, i) => (
          <li key={i} className={record === highlightKey ? 'highlight' : undefined}>
            {record}
          </li>
        ))}
      </ul>
      {hiddenCount > 0 && <p className="muted small">+{formatInt(hiddenCount)} registros não exibidos</p>}
    </div>
  )
}

export default PageView
