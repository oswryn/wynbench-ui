import type { AgentResult } from '../types'

type ResultViewerProps = {
  results: AgentResult[]
}

function ResultViewer({ results }: ResultViewerProps) {
  if (results.length === 0) {
    return (
      <section className="panel empty-state">
        <h2>No results yet</h2>
        <p>Executed actions, workflow runs, socket events, and errors will appear here.</p>
      </section>
    )
  }

  return (
    <div className="result-list">
      {results.map((result) => (
        <article key={result.id} className={`panel result-card result-${result.status}`}>
          <div className="result-header">
            <div>
              <p className="eyebrow">{result.source}</p>
              <h2>{result.summary}</h2>
            </div>
            <time dateTime={result.timestamp}>{new Date(result.timestamp).toLocaleString()}</time>
          </div>

          {result.error ? <p className="status-error">{result.error}</p> : null}

          {result.logs.length > 0 ? (
            <section>
              <h3>Logs</h3>
              <ul className="log-list">
                {result.logs.map((entry, index) => (
                  <li key={`${result.id}-log-${index}`}>{entry}</li>
                ))}
              </ul>
            </section>
          ) : null}

          <section>
            <h3>Response</h3>
            <pre>{JSON.stringify(result.response ?? null, null, 2)}</pre>
          </section>
        </article>
      ))}
    </div>
  )
}

export default ResultViewer
