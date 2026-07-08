import { useEffect, useRef, useState } from 'react'
import { Button, Callout, Card, Classes, FormGroup, H2, HTMLSelect, InputGroup } from '@blueprintjs/core'
import { getManualAgentHttpUrl, resolveAgentHttpUrl, setManualAgentHttpUrl } from '../api/client'
import { exportConfig, getConfigPath, importConfig } from '../api/config'
import { listConnections } from '../api/connections'
import { listWorkflows } from '../api/workflows'
import { useStore } from '../state/store'

const THEME_KEY = 'wynbench.theme'

type SaveState = 'idle' | 'saved'

function SettingsPage() {
  const { colorMode, setColorMode, setConnections, setWorkflows, appendResult } = useStore()
  const [manualUrl, setManualUrlInput] = useState('')
  const [activeUrl, setActiveUrl] = useState('')
  const [savedState, setSavedState] = useState<SaveState>('idle')
  const [theme, setTheme] = useState('slate')
  const [configPath, setConfigPath] = useState('')
  const [isImporting, setIsImporting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setManualUrlInput(getManualAgentHttpUrl() ?? '')
    void resolveAgentHttpUrl().then((url) => setActiveUrl(url))
    void getConfigPath()
      .then((path) => setConfigPath(path))
      .catch(() => setConfigPath(''))

    const storedTheme = globalThis.localStorage.getItem(THEME_KEY) ?? 'slate'
    setTheme(storedTheme)
    document.documentElement.setAttribute('data-console-theme', storedTheme)
  }, [])

  function handleSave() {
    setManualAgentHttpUrl(manualUrl)
    setSavedState('saved')
    void resolveAgentHttpUrl().then((url) => setActiveUrl(url))
  }

  function handleAuto() {
    setManualAgentHttpUrl('')
    setManualUrlInput('')
    setSavedState('saved')
    void resolveAgentHttpUrl().then((url) => setActiveUrl(url))
  }

  function handleThemeChange(nextTheme: string) {
    setTheme(nextTheme)
    globalThis.localStorage.setItem(THEME_KEY, nextTheme)
    document.documentElement.setAttribute('data-console-theme', nextTheme)
  }

  async function handleExport() {
    try {
      const snapshot = await exportConfig()
      const blob = new Blob([JSON.stringify(snapshot, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = 'wynbench-config.json'
      link.click()
      URL.revokeObjectURL(url)
      appendResult({
        id: crypto.randomUUID(),
        source: 'connection',
        status: 'success',
        summary: 'Exported configuration',
        response: snapshot,
        logs: [],
        timestamp: new Date().toISOString(),
      })
    } catch (error) {
      appendResult({
        id: crypto.randomUUID(),
        source: 'connection',
        status: 'error',
        summary: 'Failed to export configuration',
        response: null,
        logs: [],
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      })
    }
  }

  function handleImportClick() {
    fileInputRef.current?.click()
  }

  async function handleImportFile(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) {
      return
    }

    setIsImporting(true)
    try {
      const text = await file.text()
      const parsed = JSON.parse(text)
      await importConfig(parsed)
      const connections = await listConnections()
      const workflows = await listWorkflows()
      setConnections(connections)
      setWorkflows(workflows)
      appendResult({
        id: crypto.randomUUID(),
        source: 'connection',
        status: 'success',
        summary: `Imported configuration (${connections.length} connection(s), ${workflows.length} workflow(s))`,
        response: parsed,
        logs: [],
        timestamp: new Date().toISOString(),
      })
    } catch (error) {
      appendResult({
        id: crypto.randomUUID(),
        source: 'connection',
        status: 'error',
        summary: 'Failed to import configuration',
        response: null,
        logs: [],
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      })
    } finally {
      setIsImporting(false)
    }
  }

  return (
    <section className="page">
      <header className="page-header">
        <div>
          <p className={Classes.TEXT_MUTED}>Settings</p>
          <H2>Workbench settings</H2>
        </div>
        <p>Configure backend URL override and visual theme.</p>
      </header>

      <Card className="form-grid">
        <FormGroup label="Backend URL override (optional)" labelFor="backend-url">
          <InputGroup
            id="backend-url"
            value={manualUrl}
            onChange={(event) => {
              setManualUrlInput(event.target.value)
              setSavedState('idle')
            }}
            placeholder="http://localhost:8080"
          />
        </FormGroup>

        <div className="row-actions">
          <Button variant="minimal" text="Auto" onClick={handleAuto} />
          <Button intent="primary" text="Save" onClick={handleSave} />
        </div>

        <FormGroup label="Color mode" labelFor="color-mode">
          <HTMLSelect
            id="color-mode"
            fill
            value={colorMode}
            onChange={(event) => setColorMode(event.target.value === 'light' ? 'light' : 'dark')}
            options={[
              { value: 'light', label: 'Light' },
              { value: 'dark', label: 'Dark' },
            ]}
          />
        </FormGroup>

        <FormGroup label="Accent theme" labelFor="console-theme">
          <HTMLSelect
            id="console-theme"
            fill
            value={theme}
            onChange={(event) => handleThemeChange(event.target.value)}
            options={[
              { value: 'slate', label: 'Slate' },
              { value: 'midnight', label: 'Midnight' },
              { value: 'oxide', label: 'Oxide' },
            ]}
          />
        </FormGroup>

        <p className={Classes.TEXT_MUTED}>Active backend: {activeUrl || 'discovering...'}</p>
        {savedState === 'saved' ? <Callout intent="success">Saved.</Callout> : null}
      </Card>

      <Card className="form-grid">
        <div>
          <p className={Classes.TEXT_MUTED}>Configuration</p>
        </div>
        <p className={Classes.TEXT_MUTED}>
          Connections are saved by the agent to a local config file so they survive restarts.
        </p>
        <p className={Classes.TEXT_MUTED}>Stored at: {configPath || 'unknown (agent unreachable)'}</p>

        <div className="row-actions">
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json"
            className="visually-hidden"
            onChange={handleImportFile}
          />
          <Button variant="outlined" icon="import" text="Import" loading={isImporting} onClick={handleImportClick} />
          <Button intent="primary" icon="export" text="Export" onClick={handleExport} />
        </div>
      </Card>
    </section>
  )
}

export default SettingsPage
