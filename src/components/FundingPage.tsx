import React, { useState } from 'react'
import { formatNumber } from '../format'
import { LiveDot } from './ui'
import { IconX, IconCheck, Spinner } from '../icons'

interface PaymentRequest {
  serverIdentityKey: string
  derivationPrefix: string
  derivationSuffix: string
  satoshis: number
  memo?: string
}

type Status = 'idle' | 'connecting' | 'requesting' | 'funding' | 'sending' | 'done' | 'error'

const STEP_DEFS: [string, Status][] = [
  ['Connecting wallet', 'connecting'],
  ['Requesting invoice', 'requesting'],
  ['Funding on-chain', 'funding'],
  ['Broadcasting tx', 'sending'],
]
const ORDER: Record<Status, number> = { idle: -1, connecting: 0, requesting: 1, funding: 2, sending: 3, done: 4, error: -1 }

// The funding modal. Presentation is redesigned; the wallet flow is the exact
// original: dynamic import('@bsv/simple/browser') -> GET /api/wallet/request ->
// wallet.fundServerWallet -> POST /api/wallet/receive, with the same state machine.
export function FundModal({ balance, onClose, onFunded }: { balance: number | null; onClose: () => void; onFunded: () => void }) {
  const [status, setStatus] = useState<Status>('idle')
  const [error, setError] = useState<string | null>(null)
  const [satoshis, setSatoshis] = useState(50000)
  const [fundedAmt, setFundedAmt] = useState(0)

  const fund = async () => {
    setError(null)
    setStatus('connecting')
    setFundedAmt(satoshis)
    try {
      // Dynamic import so the page still loads without the extension
      const { createWallet } = await import('@bsv/simple/browser')
      const wallet = await createWallet()
      setStatus('requesting')

      // Get payment request from server
      const reqRes = await fetch(`/api/wallet/request?satoshis=${satoshis}`)
      if (!reqRes.ok) throw new Error('Failed to get payment request')
      const request: PaymentRequest = await reqRes.json()

      setStatus('funding')

      // Browser wallet creates the funding tx
      const result = await wallet.fundServerWallet(request, 'server-funding')

      setStatus('sending')

      // Send the tx back to the server
      const receiveRes = await fetch('/api/wallet/receive', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tx: Array.from(result.tx),
          senderIdentityKey: wallet.getIdentityKey(),
          derivationPrefix: request.derivationPrefix,
          derivationSuffix: request.derivationSuffix,
          outputIndex: 0,
        }),
      })

      if (!receiveRes.ok) {
        const body = await receiveRes.json()
        throw new Error(body.error || 'Server failed to receive payment')
      }

      setStatus('done')
      onFunded()
    } catch (err: any) {
      console.error('Funding error:', err)
      setError(err.message || 'Unknown error')
      setStatus('error')
    }
  }

  const working = status === 'connecting' || status === 'requesting' || status === 'funding' || status === 'sending'
  const done = status === 'done'
  const cur = ORDER[status]

  const balanceLabel = balance == null ? '—' : formatNumber(balance)

  return (
    <div
      onClick={onClose}
      style={{ position: 'fixed', inset: 0, zIndex: 70, background: 'rgba(6,7,9,.66)', backdropFilter: 'blur(5px)', WebkitBackdropFilter: 'blur(5px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, animation: 'ha-fade .2s ease' }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ position: 'relative', width: 'min(480px,94vw)', maxHeight: '88vh', overflow: 'auto', background: 'var(--surface)', border: '1px solid var(--border2)', borderTop: '4px solid var(--accent)', boxShadow: 'var(--shadow)', animation: 'ha-pop .3s cubic-bezier(.2,.8,.2,1)' }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, padding: '22px 22px 0' }}>
          <div>
            <div style={{ font: "800 8.5px 'Archivo'", letterSpacing: '2px', color: 'var(--accent)', marginBottom: 9 }}>SERVER WALLET</div>
            <h2 style={{ font: "700 24px/1.1 'Newsreader',serif", letterSpacing: '-.3px', color: 'var(--text)', margin: 0 }}>Keep the record honest</h2>
          </div>
          <button onClick={onClose} style={{ width: 34, height: 34, flex: 'none', display: 'grid', placeItems: 'center', background: 'var(--raised)', border: '1px solid var(--border2)', borderRadius: 2, color: 'var(--text2)', cursor: 'pointer' }}>
            <IconX size={15} strokeWidth={2.4} />
          </button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', margin: '18px 22px 4px', padding: '13px 15px', background: 'var(--surface2)', border: '1px solid var(--border)' }}>
          <span style={{ font: "700 9.5px 'Archivo'", letterSpacing: '1.3px', color: 'var(--text2)' }}>CURRENT BALANCE</span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            <LiveDot />
            <span style={{ font: "800 20px/1 'Archivo'", color: 'var(--ok)' }}>{balanceLabel}</span>
            <span style={{ font: "600 11px 'Archivo'", color: 'var(--text2)' }}>sats</span>
          </span>
        </div>

        <div style={{ padding: '14px 22px 24px' }}>
          {done && (
            <div style={{ background: 'var(--okBg)', border: '1px solid var(--okBorder)', padding: '24px 22px', textAlign: 'center' }}>
              <div style={{ width: 54, height: 54, borderRadius: '50%', background: 'var(--surface)', border: '2px solid var(--ok)', display: 'grid', placeItems: 'center', margin: '0 auto 14px' }}>
                <IconCheck size={26} color="var(--ok)" />
              </div>
              <div style={{ font: "700 19px 'Newsreader',serif", color: 'var(--text)' }}>Wallet funded</div>
              <div style={{ font: "400 13px 'Archivo'", color: 'var(--text2)', marginTop: 6 }}>{formatNumber(fundedAmt)} satoshis broadcast and confirmed on BSV.</div>
              <button onClick={() => setStatus('idle')} style={{ marginTop: 18, font: "700 11px 'Archivo'", textTransform: 'uppercase', letterSpacing: '.6px', color: 'var(--accent)', background: 'none', border: '1px solid var(--accentBorder)', borderRadius: 2, padding: '11px 18px', cursor: 'pointer' }}>Fund again</button>
            </div>
          )}

          {working && (
            <>
              <div style={{ font: "800 10px 'Archivo'", letterSpacing: '1.5px', color: 'var(--accent)', marginBottom: 16 }}>FUNDING IN PROGRESS</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
                {STEP_DEFS.map(([label], i) => {
                  const state = i < cur ? 'done' : i === cur ? 'active' : 'todo'
                  return (
                    <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      {state === 'done' && (
                        <span style={{ width: 24, height: 24, borderRadius: '50%', background: 'var(--okBg)', border: '1.5px solid var(--ok)', display: 'grid', placeItems: 'center', flex: 'none' }}>
                          <IconCheck size={13} color="var(--ok)" strokeWidth={3.4} />
                        </span>
                      )}
                      {state === 'active' && <Spinner size={24} color="var(--accent)" />}
                      {state === 'todo' && <span style={{ width: 24, height: 24, borderRadius: '50%', border: '1.5px solid var(--border2)', flex: 'none' }} />}
                      <span style={{ font: `${state === 'active' ? 700 : 500} 13.5px 'Archivo'`, color: state === 'todo' ? 'var(--muted)' : 'var(--text)' }}>{label}</span>
                    </div>
                  )
                })}
              </div>
            </>
          )}

          {!working && !done && (
            <>
              <p style={{ font: "400 13.5px/1.65 'Archivo'", color: 'var(--text2)', margin: '0 0 20px', textWrap: 'pretty' as never }}>
                Connect any <a href="https://bsv.brc.dev/wallet/0100" target="_blank" rel="noopener noreferrer">BRC-100</a> compatible wallet. BRC-100 is a universal wallet interface: any wallet that implements it works here, with no vendor lock-in or platform-specific SDKs.
              </p>
              {error && (
                <div style={{ background: 'var(--editBg)', border: '1px solid var(--edit)', borderRadius: 2, padding: '11px 13px', marginBottom: 16, font: "400 12.5px 'Archivo'", color: 'var(--editText)' }}>{error}</div>
              )}
              <label style={{ font: "700 9.5px 'Archivo'", letterSpacing: '1.3px', color: 'var(--text2)', display: 'block', marginBottom: 8 }}>AMOUNT (SATOSHIS)</label>
              <input
                type="number"
                value={satoshis}
                onChange={(e) => setSatoshis(Math.max(1, parseInt(e.target.value) || 0))}
                style={{ width: '100%', font: "600 16px 'JetBrains Mono',monospace", color: 'var(--text)', background: 'var(--inputBg)', border: '1px solid var(--border2)', borderRadius: 2, padding: '13px 14px', outline: 'none' }}
              />
              <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                {([['10k', 10000], ['50k', 50000], ['100k', 100000]] as [string, number][]).map(([label, val]) => (
                  <button
                    key={label}
                    onClick={() => setSatoshis(val)}
                    style={{ flex: 1, font: "600 12px 'Archivo'", color: 'var(--text2)', background: 'var(--raised)', border: '1px solid var(--border)', borderRadius: 2, padding: 9, cursor: 'pointer', transition: 'all .15s' }}
                  >{label}</button>
                ))}
              </div>
              <button onClick={fund} style={{ width: '100%', marginTop: 16, font: "800 13px 'Archivo'", textTransform: 'uppercase', letterSpacing: '.8px', color: 'var(--bg)', background: 'var(--accent)', border: 'none', borderRadius: 2, padding: 15, cursor: 'pointer', transition: 'filter .15s' }}>Connect wallet &amp; fund</button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
