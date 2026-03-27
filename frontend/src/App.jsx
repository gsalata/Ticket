import { useEffect, useMemo, useState } from 'react'

const API_BASE = 'http://localhost:5001'

const SAMPLE_MIAMI_CONCERTS = [
  {
    artist: 'FISHER',
    venue: 'Factory Town',
    city: 'Miami',
    event_date: '2026-03-28T22:00:00Z',
  },
  {
    artist: 'John Summit',
    venue: 'Factory Town',
    city: 'Miami',
    event_date: '2026-03-29T21:00:00Z',
  },
  {
    artist: 'Dom Dolla',
    venue: 'Factory Town',
    city: 'Miami',
    event_date: '2026-03-30T21:00:00Z',
  },
]

export default function App() {
  const [concerts, setConcerts] = useState([])
  const [selectedConcertId, setSelectedConcertId] = useState('')
  const [history, setHistory] = useState([])
  const [signal, setSignal] = useState(null)
  const [loading, setLoading] = useState(false)

  const [formData, setFormData] = useState({
    artist: SAMPLE_MIAMI_CONCERTS[0].artist,
    venue: SAMPLE_MIAMI_CONCERTS[0].venue,
    city: SAMPLE_MIAMI_CONCERTS[0].city,
    event_date: SAMPLE_MIAMI_CONCERTS[0].event_date,
  })

  const selectedConcert = useMemo(
    () => concerts.find((c) => c.id === selectedConcertId),
    [concerts, selectedConcertId]
  )

  useEffect(() => {
    refreshDashboard()
  }, [])

  async function refreshDashboard() {
    const response = await fetch(`${API_BASE}/api/dashboard`)
    const data = await response.json()
    setConcerts(data)
    if (!selectedConcertId && data.length > 0) {
      setSelectedConcertId(data[0].id)
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
    const historyData = await historyResp.json()
    const signalData = await signalResp.json()
    setHistory(historyData)
    setSignal(signalData)
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
    <main style={{ fontFamily: 'sans-serif', padding: 24, maxWidth: 1100, margin: '0 auto' }}>
      <h1>Concert Ticket Sales Tracker</h1>
      <p>Miami Music Week + Factory Town use-case dashboard.</p>

      <section style={{ border: '1px solid #ddd', borderRadius: 8, padding: 16, marginBottom: 16 }}>
        <h2>Add Concert</h2>
        <form onSubmit={addConcert} style={{ display: 'grid', gap: 8, gridTemplateColumns: 'repeat(2, 1fr)' }}>
          <input
            placeholder='Artist'
            value={formData.artist}
            onChange={(e) => setFormData({ ...formData, artist: e.target.value })}
          />
          <input
            placeholder='Venue'
            value={formData.venue}
            onChange={(e) => setFormData({ ...formData, venue: e.target.value })}
          />
          <input
            placeholder='City'
            value={formData.city}
            onChange={(e) => setFormData({ ...formData, city: e.target.value })}
          />
          <input
            placeholder='Event date (ISO)'
            value={formData.event_date}
            onChange={(e) => setFormData({ ...formData, event_date: e.target.value })}
          />
          <button type='submit' disabled={loading}>Add Concert</button>
          <button type='button' onClick={seedMiamiMusicWeek} disabled={loading}>Seed Miami Music Week</button>
        </form>
      </section>

      <section style={{ border: '1px solid #ddd', borderRadius: 8, padding: 16, marginBottom: 16 }}>
        <h2>Tracked Concerts</h2>
        <div style={{ display: 'grid', gap: 12 }}>
          {concerts.map((c) => (
            <div key={c.id} style={{ border: '1px solid #eee', padding: 12, borderRadius: 8 }}>
              <strong>{c.name}</strong>
              <div>Date: {c.event_date}</div>
              <div>Get-In: ${c.get_in_price ?? '—'} | Median: ${c.median_price ?? '—'} | Listings: {c.listings_count ?? '—'}</div>
              <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                <button type='button' onClick={() => loadHistoryAndSignal(c.id)}>View Details</button>
                <button type='button' onClick={() => refreshPrices(c.id)}>Refresh Price Snapshot</button>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section style={{ border: '1px solid #ddd', borderRadius: 8, padding: 16 }}>
        <h2>Concert Detail + Signal + Export</h2>
        {selectedConcert ? (
          <>
            <p><strong>{selectedConcert.name}</strong> ({selectedConcert.city})</p>
            <button type='button' onClick={exportWorkbook}>Export Excel</button>
            <h3>Latest Signal</h3>
            <pre>{JSON.stringify(signal, null, 2)}</pre>
            <h3>Price History</h3>
            <pre>{JSON.stringify(history, null, 2)}</pre>
          </>
        ) : (
          <p>Select a concert to view detail.</p>
        )}
      </section>
    </main>
  )
}
