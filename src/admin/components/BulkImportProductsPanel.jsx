import { useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { CheckCircle2, ChevronDown, ChevronUp, FileSpreadsheet, Upload, XCircle } from 'lucide-react'
import * as adminService from '../../services/adminService.js'

const STATES = {
  IDLE: 'IDLE',
  UPLOADING: 'UPLOADING',
  SAVING: 'SAVING',
  DONE: 'DONE',
  ERROR: 'ERROR',
}

function ProgressBar({ pct }) {
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-steel/40">
      <motion.div
        className="h-full rounded-full bg-accent"
        initial={{ width: 0 }}
        animate={{ width: `${pct}%` }}
        transition={{ ease: 'linear', duration: 0.2 }}
      />
    </div>
  )
}

function PulseRing() {
  return (
    <span className="relative flex h-5 w-5 items-center justify-center">
      <motion.span
        className="absolute inline-flex h-full w-full rounded-full bg-accent opacity-40"
        animate={{ scale: [1, 2], opacity: [0.4, 0] }}
        transition={{ duration: 1.2, repeat: Infinity, ease: 'easeOut' }}
      />
      <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-accent" />
    </span>
  )
}

function StatusBadge({ status }) {
  if (status === 'CREATED')
    return (
      <span className="inline-flex rounded-full bg-accent-muted px-2 py-0.5 font-mono text-[9px] uppercase tracking-wide text-accent">
        Created
      </span>
    )
  if (status === 'SKIPPED_EMPTY' || status === 'SKIPPED_DIVIDER')
    return (
      <span className="inline-flex rounded-full bg-steel/50 px-2 py-0.5 font-mono text-[9px] uppercase tracking-wide text-mist">
        Skipped
      </span>
    )
  return (
    <span className="inline-flex rounded-full bg-flare-muted px-2 py-0.5 font-mono text-[9px] uppercase tracking-wide text-flare">
      {status}
    </span>
  )
}

export function BulkImportProductsPanel({ onCompleted }) {
  const [open, setOpen] = useState(false)
  const [phase, setPhase] = useState(STATES.IDLE)
  const [uploadPct, setUploadPct] = useState(0)
  const [file, setFile] = useState(null)
  const [category, setCategory] = useState('')
  const [report, setReport] = useState(null)
  const [errorMsg, setErrorMsg] = useState(null)
  const [errorRequestId, setErrorRequestId] = useState(null)
  const [showAllRows, setShowAllRows] = useState(false)
  const [dragging, setDragging] = useState(false)
  const fileInputRef = useRef(null)

  function resetToIdle() {
    setPhase(STATES.IDLE)
    setUploadPct(0)
    setReport(null)
    setErrorMsg(null)
    setErrorRequestId(null)
    setShowAllRows(false)
  }

  function handleFileSelect(f) {
    if (!f) return
    if (!f.name.toLowerCase().endsWith('.xlsx')) {
      setErrorMsg('Only .xlsx files are supported.')
      setPhase(STATES.ERROR)
      return
    }
    setFile(f)
    setErrorMsg(null)
    setPhase(STATES.IDLE)
  }

  function onInputChange(e) {
    handleFileSelect(e.target.files?.[0] ?? null)
    e.target.value = ''
  }

  function onDragOver(e) {
    e.preventDefault()
    setDragging(true)
  }

  function onDragLeave() {
    setDragging(false)
  }

  function onDrop(e) {
    e.preventDefault()
    setDragging(false)
    handleFileSelect(e.dataTransfer.files?.[0] ?? null)
  }

  async function startImport() {
    if (!file) return
    resetToIdle()
    setPhase(STATES.UPLOADING)
    setUploadPct(0)
    try {
      const result = await adminService.bulkImportProducts(file, {
        category: category.trim() || undefined,
        onUploadProgress: (pct) => {
          setUploadPct(pct)
          if (pct >= 100) setPhase(STATES.SAVING)
        },
      })
      setReport(result)
      setPhase(STATES.DONE)
      onCompleted?.()
    } catch (err) {
      setErrorMsg(err?.message || 'Import failed.')
      setErrorRequestId(err?.requestId || null)
      setPhase(STATES.ERROR)
    }
  }

  const inputClass =
    'w-full border border-steel/80 bg-ink/40 px-3 py-2 font-sans text-sm text-fog outline-none focus:border-accent/60'

  const visibleRows = report?.rows
    ? showAllRows
      ? report.rows
      : report.rows.slice(0, 10)
    : []

  return (
    <section className="admin-card">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left font-display text-lg font-bold uppercase tracking-tight text-fog md:px-5 md:py-4"
      >
        <span className="flex items-center gap-2">
          <FileSpreadsheet className="h-5 w-5 text-accent" strokeWidth={2} />
          Bulk import products (Excel)
        </span>
        {open ? <ChevronUp className="h-5 w-5 text-mist" /> : <ChevronDown className="h-5 w-5 text-mist" />}
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="bulk-body"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="border-t border-steel/50 px-4 pb-6 pt-4 md:px-5">
              <p className="mb-4 text-xs text-mist">
                Upload an <span className="font-mono text-fog">.xlsx</span> file matching the Stock Summary format.
                All rows are imported transactionally — on any error nothing is saved to the database.
              </p>

              {/* Drop zone */}
              <div
                onDragOver={onDragOver}
                onDragLeave={onDragLeave}
                onDrop={onDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`mb-4 cursor-pointer rounded-xl border-2 border-dashed px-6 py-8 text-center transition-colors ${
                  dragging
                    ? 'border-accent bg-accent/5'
                    : 'border-steel/60 hover:border-accent/60 hover:bg-ink/30'
                }`}
              >
                <Upload className="mx-auto mb-2 h-8 w-8 text-mist" strokeWidth={1.5} />
                {file ? (
                  <p className="font-mono text-xs text-fog">
                    {file.name}{' '}
                    <span className="text-mist">({(file.size / 1024).toFixed(1)} KB)</span>
                  </p>
                ) : (
                  <p className="font-mono text-xs text-mist">
                    Drop .xlsx here or <span className="text-accent">click to browse</span>
                  </p>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx"
                  className="hidden"
                  onChange={onInputChange}
                />
              </div>

              {/* Optional category override */}
              <div className="mb-4">
                <label className="mb-1 block font-mono text-[10px] uppercase tracking-wider text-hud">
                  Category (optional — defaults to "Service Parts")
                </label>
                <input
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className={inputClass}
                  placeholder="e.g. Luxury Vehicle Parts"
                  disabled={phase === STATES.UPLOADING || phase === STATES.SAVING}
                />
              </div>

              {/* State machine UI */}
              <AnimatePresence mode="wait">
                {phase === STATES.IDLE && file && (
                  <motion.div
                    key="idle-action"
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="flex items-center gap-3"
                  >
                    <button
                      type="button"
                      onClick={startImport}
                      className="rounded-xl bg-accent px-6 py-2.5 font-display text-sm font-bold uppercase tracking-wide text-on-accent shadow-md transition-[filter] hover:brightness-95"
                    >
                      Import now
                    </button>
                    <button
                      type="button"
                      onClick={() => { setFile(null); resetToIdle() }}
                      className="rounded-xl border border-steel/60 px-4 py-2.5 font-mono text-[10px] uppercase tracking-wider text-mist hover:border-flare/50 hover:text-flare"
                    >
                      Clear
                    </button>
                  </motion.div>
                )}

                {phase === STATES.UPLOADING && (
                  <motion.div
                    key="uploading"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="space-y-2"
                  >
                    <div className="flex items-center gap-2">
                      <PulseRing />
                      <span className="font-mono text-xs text-fog">
                        Uploading… {uploadPct}%
                      </span>
                    </div>
                    <ProgressBar pct={uploadPct} />
                  </motion.div>
                )}

                {phase === STATES.SAVING && (
                  <motion.div
                    key="saving"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex items-center gap-2"
                  >
                    <PulseRing />
                    <span className="font-mono text-xs text-fog">Parsing &amp; saving to database…</span>
                  </motion.div>
                )}

                {phase === STATES.DONE && report && (
                  <motion.div
                    key="done"
                    initial={{ opacity: 0, scale: 0.97 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    className="space-y-4"
                  >
                    <div className="flex items-center gap-3 rounded-xl border border-accent/40 bg-accent-muted px-4 py-3">
                      <CheckCircle2 className="h-6 w-6 shrink-0 text-accent" strokeWidth={2} />
                      <div>
                        <p className="font-display text-sm font-bold uppercase tracking-tight text-fog">
                          Import completed
                        </p>
                        <p className="mt-0.5 text-xs text-mist">
                          <span className="font-semibold text-accent">{report.created}</span> products created
                          {report.skipped > 0 && (
                            <> · <span className="text-mist">{report.skipped}</span> rows skipped</>
                          )}
                          {report.warnings?.length > 0 && (
                            <> · <span className="text-hud">{report.warnings.length}</span> warning(s)</>
                          )}
                        </p>
                      </div>
                    </div>

                    {report.warnings?.length > 0 && (
                      <ul className="space-y-1">
                        {report.warnings.map((w, i) => (
                          <li key={i} className="rounded-lg border border-hud/30 bg-hud/10 px-3 py-1.5 font-mono text-[10px] text-hud">
                            {w}
                          </li>
                        ))}
                      </ul>
                    )}

                    {visibleRows.length > 0 && (
                      <div className="overflow-hidden rounded-xl border border-steel/50">
                        <table className="w-full text-left text-xs">
                          <thead>
                            <tr className="border-b border-steel/50 bg-ink/30 font-mono text-[9px] uppercase tracking-wider text-mist">
                              <th className="px-3 py-2">Row</th>
                              <th className="px-3 py-2">SKU</th>
                              <th className="px-3 py-2">Part Name</th>
                              <th className="px-3 py-2">Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-steel/30">
                            {visibleRows.map((r) => (
                              <tr key={r.rowNumber} className="text-mist">
                                <td className="px-3 py-1.5 font-mono text-[10px]">{r.rowNumber}</td>
                                <td className="px-3 py-1.5 font-mono text-[10px] text-fog">{r.sku}</td>
                                <td className="max-w-[200px] truncate px-3 py-1.5">{r.name}</td>
                                <td className="px-3 py-1.5">
                                  <StatusBadge status={r.status} />
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                        {report.rows.length > 10 && (
                          <button
                            type="button"
                            onClick={() => setShowAllRows((v) => !v)}
                            className="w-full border-t border-steel/40 py-2 font-mono text-[10px] uppercase tracking-wider text-mist hover:text-accent"
                          >
                            {showAllRows
                              ? 'Show less'
                              : `Show all ${report.rows.length} rows`}
                          </button>
                        )}
                      </div>
                    )}

                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => { setFile(null); resetToIdle() }}
                        className="rounded-xl border border-steel/60 px-4 py-2 font-mono text-[10px] uppercase tracking-wider text-mist hover:border-accent/50 hover:text-accent"
                      >
                        Import another file
                      </button>
                    </div>
                  </motion.div>
                )}

                {phase === STATES.ERROR && (
                  <motion.div
                    key="error"
                    initial={{ opacity: 0, x: -4 }}
                    animate={{ opacity: 1, x: [0, -6, 6, -4, 4, 0] }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.4 }}
                    className="space-y-3"
                  >
                    <div className="flex items-start gap-3 rounded-xl border border-flare/40 bg-flare-muted px-4 py-3">
                      <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-flare" strokeWidth={2} />
                      <div>
                        <p className="font-display text-sm font-bold uppercase tracking-tight text-fog">
                          Import failed
                        </p>
                        <p className="mt-0.5 text-xs text-fog">{errorMsg}</p>
                        {errorRequestId && (
                          <p className="mt-1 font-mono text-[9px] text-mist">
                            Request ID: {errorRequestId}
                          </p>
                        )}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={resetToIdle}
                      className="rounded-xl border border-steel/60 px-4 py-2 font-mono text-[10px] uppercase tracking-wider text-mist hover:border-accent/50 hover:text-accent"
                    >
                      Try again
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  )
}
