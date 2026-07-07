import ResultViewer from '../components/ResultViewer'
import { useStore } from '../state/store'

function ResultsPage() {
  const { results, agentStatus } = useStore()

  return (
    <section className="page">
      <header className="page-header">
        <div>
          <p className="eyebrow">Results</p>
          <h2>Inspect responses, logs, and errors</h2>
        </div>
        <p>Agent status: {agentStatus}. Review recent activity from every action, workflow, and connection event.</p>
      </header>

      <ResultViewer results={results} />
    </section>
  )
}

export default ResultsPage
