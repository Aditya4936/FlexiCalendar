import { useEffect, useMemo, useState } from 'react'
import { FlexiCalendar } from './components/FlexiCalendar/index.js'
import { defaultTheme } from './theme/defaultTheme.js'
import { defaultDarkTheme } from './theme/defaultDarkTheme.js'
import './App.css'

const customTheme = {
  ...defaultTheme,
  background: '#0f172a',
  borderColor: '#1e293b',
  textColor: '#f8fafc',
  mutedTextColor: '#94a3b8',
  accentColor: '#38bdf8',
  hoverColor: 'rgba(56, 189, 248, 0.15)',
  selectedBgColor: '#38bdf8',
  selectedTextColor: '#0f172a',
  highlightColor: '#facc15',
  shadow: '0 20px 45px rgba(15, 23, 42, 0.45)'
}

const customDarkTheme = {
  ...defaultDarkTheme,
  background: '#020817',
  borderColor: '#1e293b',
  textColor: '#e2e8f0',
  mutedTextColor: '#94a3b8',
  accentColor: '#38bdf8',
  hoverColor: 'rgba(56, 189, 248, 0.18)',
  selectedBgColor: '#38bdf8',
  selectedTextColor: '#020817',
  highlightColor: '#facc15',
  shadow: '0 24px 55px rgba(2, 8, 23, 0.65)'
}

const formatter = new Intl.DateTimeFormat('en-US', {
  weekday: 'long',
  month: 'long',
  day: 'numeric',
  year: 'numeric'
})

const addDays = (base, amount) => {
  const draft = new Date(base.getTime())
  draft.setDate(draft.getDate() + amount)
  return draft
}

const today = new Date()

const upcomingEntries = [
  { date: today, label: 'Today', color: '#34d399' },
  { date: addDays(today, 2), label: 'Sprint', color: '#f97316' },
  { date: addDays(today, 5), label: 'Demo', color: '#38bdf8' }
]

const rangeConstraints = {
  minDate: addDays(today, -15),
  maxDate: addDays(today, 20)
}

const App = () => {
  const [selected, setSelected] = useState(new Date())
  const [colorScheme, setColorScheme] = useState('system')
  const [systemPrefersDark, setSystemPrefersDark] = useState(() => {
    if (typeof window !== 'undefined' && typeof window.matchMedia === 'function') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches
    }
    return false
  })
  const highlightedDates = useMemo(
    () =>
      upcomingEntries.map((entry) => ({
        date: entry.date,
        label: entry.label,
        color: entry.color
      })),
    []
  )

  useEffect(() => {
    if (colorScheme !== 'system') {
      setSystemPrefersDark(colorScheme === 'dark')
      return
    }
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return
    }
    const media = window.matchMedia('(prefers-color-scheme: dark)')
    const updatePreference = (event) => setSystemPrefersDark(event.matches)
    setSystemPrefersDark(media.matches)
    if (typeof media.addEventListener === 'function') {
      media.addEventListener('change', updatePreference)
      return () => media.removeEventListener('change', updatePreference)
    }
    media.addListener(updatePreference)
    return () => media.removeListener(updatePreference)
  }, [colorScheme])

  useEffect(() => {
    if (typeof document === 'undefined') {
      return
    }
    const resolved = colorScheme === 'system' ? (systemPrefersDark ? 'dark' : 'light') : colorScheme
    document.body.dataset.appTheme = resolved
  }, [colorScheme, systemPrefersDark])

  useEffect(() => () => {
    if (typeof document !== 'undefined') {
      delete document.body.dataset.appTheme
    }
  }, [])

  const resolvedScheme = colorScheme === 'system' ? (systemPrefersDark ? 'dark' : 'light') : colorScheme

  const renderDay = ({ date, isCurrentMonth }) => {
    const weekend = [0, 6].includes(date.getDay())
    const classes = weekend ? 'app-day-content app-day-content--weekend' : 'app-day-content'
    return (
      <span className={classes}>
        <span>{date.getDate()}</span>
        {!isCurrentMonth ? <small>*</small> : null}
      </span>
    )
  }

  return (
    <div className="app-shell">
      <header className="app-header">
        <h1>FlexiCalendar</h1>
        <p>
          A flexible, themeable React calendar you can drop into any project and customize in minutes.
        </p>
        <div className="app-toolbar" role="group" aria-label="Color scheme">
          <label htmlFor="color-scheme">Color scheme</label>
          <select
            id="color-scheme"
            value={colorScheme}
            onChange={(event) => setColorScheme(event.target.value)}
          >
            <option value="system">System</option>
            <option value="light">Light</option>
            <option value="dark">Dark</option>
          </select>
        </div>
      </header>
      <main className="app-content">
        <section className="app-panel">
          <h2>Default Theme</h2>
          <FlexiCalendar
            initialDate={selected}
            selectedDate={selected}
            onDateSelect={setSelected}
            highlightedDates={highlightedDates}
            colorScheme={colorScheme}
          />
        </section>
      
        <section className="app-panel">
          <h2>Localized & Bounded</h2>
          <FlexiCalendar
            initialDate={selected}
            selectedDate={selected}
            onDateSelect={setSelected}
            highlightedDates={highlightedDates}
            locale="fr-FR"
            weekStartsOn={1}
            showAdjacentDays={false}
            allowOutsideDaysNavigation={false}
            minDate={rangeConstraints.minDate}
            maxDate={rangeConstraints.maxDate}
            size="sm"
            colorScheme={colorScheme}
          />
        </section>
        <aside className="app-sidebar">
          <h3>Selected Date</h3>
          <p>{formatter.format(selected)}</p>
          <h3>Upcoming</h3>
          <ul className="app-sidebar__upcoming">
            {upcomingEntries.map((entry) => (
              <li key={entry.label}>
                <span className="app-tag" style={{ background: entry.color }} />
                {formatter.format(entry.date)} - {entry.label}
              </li>
            ))}
          </ul>
          <h3>Tips</h3>
          <ul className="app-sidebar__tips">
            <li>Use arrow keys or Page Up and Page Down to explore quickly.</li>
            <li>Press T to jump directly back to today.</li>
          </ul>
          <h3>Active Scheme</h3>
          <p className="app-sidebar__scheme">Currently using {resolvedScheme} mode.</p>
        </aside>
      </main>
    </div>
  )
}

export default App
