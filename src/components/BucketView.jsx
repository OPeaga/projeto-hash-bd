import { formatInt } from '../lib/format'

// Mostra o conteúdo de um bucket (área primária + overflow), destacando a chave buscada.
function BucketView({ bucketIndex, bucket, highlightKey }) {
  return (
    <div className="bucket-view">
      <div className="page-view-header">
        <strong>Bucket {bucketIndex}</strong>
        <span className="muted">
          {formatInt(bucket.primary.length)} na área primária · {formatInt(bucket.overflow.length)} em overflow
        </span>
      </div>
      <div className="bucket-area">
        <span className="bucket-area-label">Primária</span>
        <ul className="record-list">
          {bucket.primary.map((entry) => (
            <li key={entry.key} className={entry.key === highlightKey ? 'highlight' : undefined}>
              {entry.key} <span className="muted small">→ página {entry.pageNumber}</span>
            </li>
          ))}
          {bucket.primary.length === 0 && <li className="muted small">(vazio)</li>}
        </ul>
      </div>
      {bucket.overflow.length > 0 && (
        <div className="bucket-area">
          <span className="bucket-area-label">Overflow</span>
          <ul className="record-list">
            {bucket.overflow.map((entry) => (
              <li key={entry.key} className={entry.key === highlightKey ? 'highlight' : undefined}>
                {entry.key} <span className="muted small">→ página {entry.pageNumber}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

export default BucketView
