import { useEffect, useState } from 'react'

export default function App() {
  const [concerts, setConcerts] = useState([])

  useEffect(() => {
    fetch('http://localhost:5001/api/concerts')
      .then((r) => r.json())
      .then(setConcerts)
      .catch(() => setConcerts([]))
  }, [])

  return (
    <main style={{ fontFamily: 'sans-serif', padding: 24 }}>
      <h1>Concert Ticket Sales Tracker</h1>
      <p>Free-first TickPick scraper + Flask + SQLite MVP.</p>
      <ul>
        {concerts.map((c) => (
          <li key={c.id}>{c.name} — {c.event_date}</li>
        ))}
      </ul>
    </main>
  )
}
