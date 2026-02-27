import React, { useState, useEffect } from 'react'

interface PaymentRequest {
  serverIdentityKey: string
  derivationPrefix: string
  derivationSuffix: string
  satoshis: number
  memo?: string
}

export function FundingPage() {
  const [status, setStatus] = useState<'idle' | 'connecting' | 'requesting' | 'funding' | 'sending' | 'done' | 'error'>('idle')
  const [error, setError] = useState<string | null>(null)
  const [satoshis, setSatoshis] = useState(50000)
  const [txid, setTxid] = useState<string | null>(null)
  const [balance, setBalance] = useState<number | null>(null)

  const loadBalance = () => {
    fetch('/api/wallet/balance')
      .then(r => r.json())
      .then(d => setBalance(d.satoshis))
      .catch(() => {})
  }

  useEffect(() => {
    loadBalance()
    const interval = setInterval(loadBalance, 30000)
    return () => clearInterval(interval)
  }, [])

  const fund = async () => {
    setError(null)
    setStatus('connecting')

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

      setTxid(result.txid)
      setStatus('done')
      loadBalance()
    } catch (err: any) {
      console.error('Funding error:', err)
      setError(err.message || 'Unknown error')
      setStatus('error')
    }
  }

  return (
    <div style={styles.container}>
      <h2 style={styles.heading}>Fund Server Wallet</h2>

      {balance !== null && (
        <div style={styles.balanceCard}>
          <div style={styles.balanceValue}>{balance.toLocaleString()}</div>
          <div style={styles.balanceLabel}>satoshis remaining</div>
        </div>
      )}

      <p style={styles.description}>
        Fund the HeadlineAnchor server wallet to keep headlines anchored on-chain.
        Connect any{' '}
        <a href="https://bsv.brc.dev/wallet/0100" target="_blank" rel="noopener noreferrer" style={{ color: '#4a9eff' }}>
          BRC-100
        </a>{' '}
        compatible wallet. BRC-100 is a universal wallet interface standard — any wallet that
        implements it can seamlessly interact with any app, no vendor lock-in, no platform-specific SDKs.
      </p>

      <div style={styles.inputRow}>
        <label style={styles.label}>Amount (satoshis)</label>
        <input
          type="number"
          value={satoshis}
          onChange={(e) => setSatoshis(Math.max(1, parseInt(e.target.value) || 0))}
          style={styles.input}
          disabled={status !== 'idle' && status !== 'error' && status !== 'done'}
        />
      </div>

      {status === 'idle' || status === 'error' || status === 'done' ? (
        <button onClick={fund} style={styles.button}>
          {status === 'done' ? 'Fund Again' : 'Connect Wallet & Fund'}
        </button>
      ) : (
        <div style={styles.statusBox}>
          <span style={styles.spinner} />
          <span>{statusMessages[status]}</span>
        </div>
      )}

      {error && (
        <div style={styles.errorBox}>
          {error}
        </div>
      )}

      {txid && status === 'done' && (
        <div style={styles.successBox}>
          Funded successfully!{' '}
          <a
            href={`https://whatsonchain.com/tx/${txid}`}
            target="_blank"
            rel="noopener noreferrer"
            style={styles.txLink}
          >
            {txid.slice(0, 12)}...
          </a>
        </div>
      )}
    </div>
  )
}

const statusMessages: Record<string, string> = {
  connecting: 'Connecting to wallet...',
  requesting: 'Creating payment request...',
  funding: 'Awaiting wallet approval...',
  sending: 'Sending to server...',
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    maxWidth: 480,
    margin: '0 auto',
    padding: '1.5rem 0',
  },
  balanceCard: {
    background: '#111',
    border: '1px solid #222',
    borderRadius: '8px',
    padding: '1.5rem',
    textAlign: 'center',
    marginBottom: '1.5rem',
  },
  balanceValue: {
    fontSize: '2.5rem',
    fontWeight: 700,
    color: '#4ade80',
    fontFamily: 'monospace',
  },
  balanceLabel: {
    color: '#888',
    fontSize: '0.85rem',
    marginTop: '0.25rem',
  },
  heading: {
    fontSize: '1.3rem',
    fontWeight: 700,
    color: '#fff',
    marginBottom: '0.5rem',
  },
  description: {
    color: '#888',
    fontSize: '0.85rem',
    lineHeight: 1.6,
    marginBottom: '1.5rem',
  },
  inputRow: {
    marginBottom: '1rem',
  },
  label: {
    display: 'block',
    color: '#aaa',
    fontSize: '0.8rem',
    marginBottom: '0.3rem',
  },
  input: {
    width: '100%',
    padding: '0.6rem 0.8rem',
    background: '#111',
    border: '1px solid #333',
    borderRadius: '6px',
    color: '#fff',
    fontSize: '1rem',
    fontFamily: 'monospace',
  },
  button: {
    width: '100%',
    padding: '0.75rem',
    background: '#1a1a2e',
    border: '1px solid #4a9eff',
    borderRadius: '6px',
    color: '#4a9eff',
    fontSize: '0.95rem',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.15s',
  },
  statusBox: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    padding: '0.75rem 1rem',
    background: '#111',
    border: '1px solid #333',
    borderRadius: '6px',
    color: '#aaa',
    fontSize: '0.9rem',
  },
  spinner: {
    display: 'inline-block',
    width: 16,
    height: 16,
    border: '2px solid #333',
    borderTopColor: '#4a9eff',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
  },
  errorBox: {
    marginTop: '1rem',
    padding: '0.75rem 1rem',
    background: '#2d1215',
    border: '1px solid #7f1d1d',
    borderRadius: '6px',
    color: '#f87171',
    fontSize: '0.85rem',
  },
  successBox: {
    marginTop: '1rem',
    padding: '0.75rem 1rem',
    background: '#0d2818',
    border: '1px solid #166534',
    borderRadius: '6px',
    color: '#4ade80',
    fontSize: '0.85rem',
  },
  txLink: {
    color: '#4ade80',
    fontFamily: 'monospace',
  },
}
