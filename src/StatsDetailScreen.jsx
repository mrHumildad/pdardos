import { useState } from 'react'
import { shortOf } from './players'
import { STAT_VARIANTS, summarize } from './stats'

function StatsDetailScreen({ player, matches, onBack }) {
  const [variant, setVariant] = useState('all')
  const summary = summarize(matches, player.id, variant)

  // One line per readout, in the order a match is read: results, then the
  // working behind them.
  const rows = [
    { label: 'Matches', value: summary.matches },
    { label: 'Wins', value: summary.wins },
    { label: 'Win %', value: `${summary.winPct}%` },
    { label: 'Darts', value: summary.darts },
    { label: 'MPD', value: summary.mpd.toFixed(2) },
    { label: 'Doubles', value: summary.doubles },
    { label: 'Triples', value: summary.triples },
    { label: 'Bulls', value: summary.bulls },
  ]

  return (
    <main className="stats-detail">
      <div className="stats-detail__header">
        <h1 className="stats-detail__name">{player.name}</h1>
        <span className="stats-detail__short">({shortOf(player)})</span>
      </div>

      {/* Standard, Cut-Throat and No Score pay points differently, so the record
          is read one variant at a time; All is every match together. */}
      <div className="stats-detail__filter" role="group" aria-label="Cricket variant">
        {STAT_VARIANTS.map((option) => (
          <button
            key={option.id}
            type="button"
            className="stats-detail__filter-button"
            aria-pressed={variant === option.id}
            onClick={() => setVariant(option.id)}
          >
            <span className="stats-detail__filter-label">{option.name}</span>
          </button>
        ))}
      </div>

      <div className="stats-detail__rows">
        {rows.map((row) => (
          <div key={row.label} className="stats-detail__row">
            <span className="stats-detail__label">
              <span>{row.label}</span>
            </span>
            <span className="stats-detail__value">{row.value}</span>
          </div>
        ))}
      </div>

      <button type="button" className="stats-detail__back" aria-label="Back" onClick={onBack}>
        <svg
          className="stats-detail__back-icon"
          viewBox="-2.4 -1.4 48.8 27.8"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <path d="M0 12.5 16 0v8h28v9H16V25z" fill="currentColor" stroke="none" />
        </svg>
      </button>
    </main>
  )
}

export default StatsDetailScreen
