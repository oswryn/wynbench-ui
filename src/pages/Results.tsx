import { Button, Classes, H2 } from '@blueprintjs/core'
import ResultViewer from '../components/ResultViewer'
import { useStore } from '../state/store'

function ResultsPage() {
  const { results, agentStatus, clearResults } = useStore()

  return (
    <section className="page">
      <header className="page-header">
        <div>
          <p className={Classes.TEXT_MUTED}>Results</p>
          <H2>Inspect responses, logs, and errors</H2>
        </div>
        <div className="row-actions">
          <Button intent="primary" text="Clear results" onClick={clearResults} disabled={results.length === 0} />
        </div>
      </header>
      <p>Backend status: {agentStatus}. Review recent action, workflow, and connection activity.</p>

      <ResultViewer results={results} />
    </section>
  )
}

export default ResultsPage
