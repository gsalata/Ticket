import { useEffect, useMemo, useState } from 'react'
import Plot from 'react-plotly.js'

const API_BASE = 'http://localhost:5001'

const SAMPLE_MIAMI_CONCERTS = [
  { artist: 'FISHER', venue: 'Factory Town', city: 'Miami', event_date: '2026-03-28T22:00:00Z' },
  { artist: 'John Summit', venue: 'Factory Town', city: 'Miami', event_date: '2026-03-29T21:00:00Z' },
  { artist: 'Dom Dolla', venue: 'Factory Town', city: 'Miami', event_date: '2026-03-30T21:00:00Z' },
]

const ui = {
  page: { background: '#0a0f1a', color: '#eaf0ff', fontFamily: 'Inter, system-ui, sans-serif', minHeight: '100vh' },
  wrap: { maxWidth: 1400, margin: '0 auto', padding: 24 },
  card: { background: 'linear-gradient(180deg, #121a2a, #101625)', border: '1px solid #202b42', borderRadius: 12, padding: 16 },
  kpiCard: { background: 'linear-gradient(180deg, #121a2a, #0f1626)', border: '1px solid #27344f', borderRadius: 10, padding: 12 },
  button: { background: '#1d4ed8', color: 'white', border: 'none', borderRadius: 8, padding: '8px 12px', cursor: 'pointer' },
  muted: { color: '#9cb0da' },
}

export default function App() {
  const [concerts, setConcerts] = useState([])
  const [selectedConcertId, setSelectedConcertId] = useState('')
  const [history, setHistory] = useState([])
  const [signal, setSignal] = useState(null)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState(SAMPLE_MIAMI_CONCERTS[0])

  const selectedConcert = useMemo(() => concerts.find((c) => c.id === selectedConcertId), [concerts, selectedConcertId])

  const series = useMemo(() => {
    const sorted = [...history].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
    const x = sorted.map((d) => d.timestamp)
    const getIn = sorted.map((d) => d.get_in_price ?? null)
    const median = sorted.map((d) => d.median_price ?? null)
    const listings = sorted.map((d) => d.listings_count ?? 0)
    const spread = sorted.map((d) => (d.median_price ?? 0) - (d.get_in_price ?? 0))
    const rollingVol = getIn.map((_, i) => {
      const chunk = getIn.slice(Math.max(0, i - 5), i + 1).filter((v) => typeof v === 'number')
      if (chunk.length < 2) return 0
      const mean = chunk.reduce((acc, v) => acc + v, 0) / chunk.length
      const variance = chunk.reduce((acc, v) => acc + (v - mean) ** 2, 0) / chunk.length
      return Math.sqrt(variance)
    })
    return { x, getIn, median, listings, spread, rollingVol }
  }, [history])

  const kpis = useMemo(() => {
    if (!history.length) {
      return {
        lastGetIn: '—',
        lastMedian: '—',
        spreadPct: '—',
        listings: '—',
        snapshots: 0,
      }
    }

    const latest = history[history.length - 1]
    const spreadPct = latest.median_price && latest.get_in_price
      ? (((latest.median_price - latest.get_in_price) / latest.get_in_price) * 100).toFixed(1)
      : '0.0'

    return {
      lastGetIn: `$${(latest.get_in_price ?? 0).toFixed(2)}`,
      lastMedian: `$${(latest.median_price ?? 0).toFixed(2)}`,
      spreadPct: `${spreadPct}%`,
      listings: latest.listings_count ?? 0,
      snapshots: history.length,
    }
  }, [history])

  useEffect(() => {
    refreshDashboard()
  }, [])

  async function refreshDashboard() {
    const response = await fetch(`${API_BASE}/api/dashboard`)
    const data = await response.json()
    setConcerts(data)
    if (!selectedConcertId && data.length) {
      await loadHistoryAndSignal(data[0].id)
    }
  }

  async function addConcert(e) {
    e.preventDefault()
    setLoading(true)
    await fetch(`${API_BASE}/api/concerts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
    })
    await refreshDashboard()
    setLoading(false)
  }

  async function seedMiamiMusicWeek() {
    setLoading(true)
    for (const concert of SAMPLE_MIAMI_CONCERTS) {
      await fetch(`${API_BASE}/api/concerts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(concert),
      })
    }
    await refreshDashboard()
    setLoading(false)
  }

  async function loadHistoryAndSignal(concertId) {
    setSelectedConcertId(concertId)
    const [historyResp, signalResp] = await Promise.all([
      fetch(`${API_BASE}/api/concerts/${concertId}/price-history`),
      fetch(`${API_BASE}/api/concerts/${concertId}/signal`),
    ])
    setHistory(await historyResp.json())
    setSignal(await signalResp.json())
  }

  async function refreshPrices(concertId) {
    setLoading(true)
    await fetch(`${API_BASE}/api/concerts/${concertId}/refresh`, { method: 'POST' })
    await refreshDashboard()
    await loadHistoryAndSignal(concertId)
    setLoading(false)
  }

  async function exportWorkbook() {
    if (!selectedConcertId) return
    const response = await fetch(`${API_BASE}/api/export`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ concert_id: selectedConcertId }),
    })
    const blob = await response.blob()
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `ticket_tracker_${selectedConcertId}.xlsx`
    link.click()
    window.URL.revokeObjectURL(url)
  }

  return (
    <div style={ui.page}>
      <main style={ui.wrap}>
        <header style={{ marginBottom: 16 }}>
          <h1 style={{ margin: 0 }}>Ticket Quant Dashboard</h1>
          <p style={{ ...ui.muted, marginTop: 8 }}>
            Quant-style dashboard for Miami Factory Town Music Week pricing, liquidity, spread, and volatility monitoring.
          </p>
        </header>

        <section style={{ ...ui.card, marginBottom: 16 }}>
          <h2 style={{ marginTop: 0 }}>Add / Seed Concerts</h2>
          <form onSubmit={addConcert} style={{ display: 'grid', gap: 8, gridTemplateColumns: 'repeat(4, minmax(0, 1fr))' }}>
            <input value={formData.artist} onChange={(e) => setFormData({ ...formData, artist: e.target.value })} placeholder='Artist' />
            <input value={formData.venue} onChange={(e) => setFormData({ ...formData, venue: e.target.value })} placeholder='Venue' />
            <input value={formData.city} onChange={(e) => setFormData({ ...formData, city: e.target.value })} placeholder='City' />
            <input value={formData.event_date} onChange={(e) => setFormData({ ...formData, event_date: e.target.value })} placeholder='ISO Event Date' />
            <button type='submit' disabled={loading} style={ui.button}>Add Concert</button>
            <button type='button' disabled={loading} onClick={seedMiamiMusicWeek} style={{ ...ui.button, background: '#0f766e' }}>
              Seed Miami Week
            </button>
            <button type='button' disabled={loading} onClick={refreshDashboard} style={{ ...ui.button, background: '#374151' }}>
              Refresh Dashboard
            </button>
            <button type='button' disabled={!selectedConcertId} onClick={exportWorkbook} style={{ ...ui.button, background: '#6d28d9' }}>
              Export Excel
            </button>
          </form>
        </section>

        <section style={{ display: 'grid', gridTemplateColumns: '360px 1fr', gap: 16 }}>
          <aside style={{ ...ui.card, alignSelf: 'start' }}>
            <h2 style={{ marginTop: 0 }}>Tracked Concerts</h2>
            <div style={{ display: 'grid', gap: 10 }}>
              {concerts.map((c) => (
                <div key={c.id} style={{ ...ui.kpiCard }}>
                  <strong>{c.name}</strong>
                  <div style={ui.muted}>{c.city} • {c.event_date}</div>
                  <div style={{ marginTop: 6 }}>
                    Get-In: ${c.get_in_price ?? '—'} | Listings: {c.listings_count ?? '—'}
                  </div>
                  <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
                    <button style={ui.button} onClick={() => loadHistoryAndSignal(c.id)}>Analyze</button>
                    <button style={{ ...ui.button, background: '#334155' }} onClick={() => refreshPrices(c.id)}>Refresh</button>
                  </div>
                </div>
              ))}
            </div>
          </aside>

          <section style={{ display: 'grid', gap: 16 }}>
            <div style={{ display: 'grid', gap: 10, gridTemplateColumns: 'repeat(5, 1fr)' }}>
              <KpiCard title='Get-In' value={kpis.lastGetIn} />
              <KpiCard title='Median' value={kpis.lastMedian} />
              <KpiCard title='Spread %' value={kpis.spreadPct} />
              <KpiCard title='Listings' value={String(kpis.listings)} />
              <KpiCard title='Snapshots' value={String(kpis.snapshots)} />
            </div>

            {selectedConcert && (
              <div style={{ ...ui.card }}>
                <h2 style={{ marginTop: 0 }}>{selectedConcert.name} Analytics</h2>
                <p style={ui.muted}>Signal: <strong>{signal?.signal ?? 'N/A'}</strong> — {signal?.rationale ?? 'No rationale yet'}</p>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <ChartCard title='Price Trend (Get-In vs Median)'>
                    <Plot
                      data={[
                        { x: series.x, y: series.getIn, type: 'scatter', mode: 'lines+markers', name: 'Get-In', line: { color: '#4ade80' } },
                        { x: series.x, y: series.median, type: 'scatter', mode: 'lines+markers', name: 'Median', line: { color: '#60a5fa' } },
                      ]}
                      layout={quantLayout('Price ($)')}
                      config={{ displayModeBar: false, responsive: true }}
                      style={{ width: '100%', height: 260 }}
                    />
                  </ChartCard>

                  <ChartCard title='Liquidity (Listings Over Time)'>
                    <Plot
                      data={[{ x: series.x, y: series.listings, type: 'bar', name: 'Listings', marker: { color: '#f59e0b' } }]}
                      layout={quantLayout('Listings')}
                      config={{ displayModeBar: false, responsive: true }}
                      style={{ width: '100%', height: 260 }}
                    />
                  </ChartCard>

                  <ChartCard title='Spread Monitor (Median - Get-In)'>
                    <Plot
                      data={[{ x: series.x, y: series.spread, type: 'scatter', fill: 'tozeroy', name: 'Spread', line: { color: '#a78bfa' } }]}
                      layout={quantLayout('Spread ($)')}
                      config={{ displayModeBar: false, responsive: true }}
                      style={{ width: '100%', height: 260 }}
                    />
                  </ChartCard>

                  <ChartCard title='Short-Horizon Volatility (Rolling StdDev)'>
                    <Plot
                      data={[{ x: series.x, y: series.rollingVol, type: 'scatter', mode: 'lines', name: 'Volatility', line: { color: '#f43f5e' } }]}
                      layout={quantLayout('Volatility')}
                      config={{ displayModeBar: false, responsive: true }}
                      style={{ width: '100%', height: 260 }}
                    />
                  </ChartCard>

                  <ChartCard title='Price vs Liquidity Scatter'>
                    <Plot
                      data={[{
                        x: series.getIn,
                        y: series.listings,
                        type: 'scatter',
                        mode: 'markers',
                        marker: { size: 10, color: series.spread, colorscale: 'Viridis', showscale: true },
                        name: 'State Points',
                      }]}
                      layout={{
                        ...quantLayout('Listings'),
                        xaxis: { title: 'Get-In Price', color: '#9fb2dd', gridcolor: '#243149' },
                      }}
                      config={{ displayModeBar: false, responsive: true }}
                      style={{ width: '100%', height: 260 }}
                    />
                  </ChartCard>
                </div>
              </div>
            )}
          </section>
        </section>
      </main>
    </div>
  )
}

function KpiCard({ title, value }) {
  return (
    <div style={ui.kpiCard}>
      <div style={{ ...ui.muted, fontSize: 12 }}>{title}</div>
      <div style={{ fontSize: 24, fontWeight: 700 }}>{value}</div>
    </div>
  )
}

function ChartCard({ title, children }) {
  return (
    <div style={{ ...ui.kpiCard }}>
      <h3 style={{ marginTop: 0, marginBottom: 6 }}>{title}</h3>
      {children}
    </div>
  )
}

function quantLayout(yTitle) {
  return {
    autosize: true,
    margin: { l: 50, r: 20, t: 10, b: 40 },
    paper_bgcolor: '#0f1729',
    plot_bgcolor: '#0f1729',
    font: { color: '#d8e4ff' },
    xaxis: { title: 'Time', color: '#9fb2dd', gridcolor: '#243149' },
    yaxis: { title: yTitle, color: '#9fb2dd', gridcolor: '#243149' },
    legend: { orientation: 'h' },
  }
}
