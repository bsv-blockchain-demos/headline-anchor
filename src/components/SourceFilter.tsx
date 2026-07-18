import React from 'react'

// Squared uppercase source chips. Active chip = ink fill. 'All' clears the filter.
export function SourceFilter({
  names, selected, onChange,
}: { names: string[]; selected: string; onChange: (name: string) => void }) {
  const chips = ['All', ...names]
  return (
    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', margin: '18px 0 6px' }}>
      {chips.map((name) => {
        const active = selected === name
        return (
          <button
            key={name}
            onClick={() => onChange(name)}
            style={{
              font: `${active ? 700 : 600} 10.5px 'Archivo'`,
              textTransform: 'uppercase', letterSpacing: '.6px', cursor: 'pointer',
              borderRadius: 2, padding: '6px 11px', transition: 'all .15s',
              ...(active
                ? { background: 'var(--text)', color: 'var(--bg)', border: '1px solid var(--text)' }
                : { background: 'transparent', color: 'var(--text2)', border: '1px solid var(--border)' }),
            }}
          >
            {name}
          </button>
        )
      })}
    </div>
  )
}
