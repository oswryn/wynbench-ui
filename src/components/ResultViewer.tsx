import { Callout, Card, Classes, H4, NonIdealState, Pre, Tag, type IntentProps } from '@blueprintjs/core'
import type { AgentResult, ResultStatus } from '../types'

type ResultViewerProps = {
  results: AgentResult[]
}

const intentByStatus: Record<ResultStatus, IntentProps['intent']> = {
  success: 'success',
  error: 'danger',
  info: 'primary',
}

function ResultViewer({ results }: ResultViewerProps) {
  if (results.length === 0) {
    return (
      <NonIdealState
        icon="th-list"
        title="No results yet"
        description="Executed actions, workflow runs, connection events, and errors will appear here."
      />
    )
  }

  return (
    <div className="result-list">
      {results.map((result) => (
        <Card key={result.id}>
          <div className="page-header">
            <div>
              <div className="error-tag">
                <Tag minimal intent={intentByStatus[result.status]}>
                  {result.source}
                </Tag>
              </div>
              <H4>{result.summary}</H4>
            </div>
            <time className={Classes.TEXT_MUTED} dateTime={result.timestamp}>
              {new Date(result.timestamp).toLocaleString()}
            </time>
          </div>

          {result.error ? <Callout intent="danger">{result.error}</Callout> : null}

          {result.logs.length > 0 ? (
            <section>
              <H4>Logs</H4>
              <ul className="log-list">
                {result.logs.map((entry, index) => (
                  <li key={`${result.id}-log-${index}`}>
                    {entry.includes('\n') ? <pre>{entry}</pre> : entry}
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          <section>
            <H4>Response</H4>
            <Pre>{JSON.stringify(result.response ?? null, null, 2)}</Pre>
          </section>
        </Card>
      ))}
    </div>
  )
}

export default ResultViewer
