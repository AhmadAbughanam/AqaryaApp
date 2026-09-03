import {useState, type FormEvent} from 'react';
import {getTransactionHistory, getWalletBalance, requestDeposit, requestWithdrawal} from '../../api/wallet';
import {ErrorState, LoadingState, PageHeader, StatCard, StatusBadge, formatDate, formatJod} from '../ui';
import {useAsyncData} from '../useAsyncData';

export function WalletPage() {
  const result = useAsyncData(async () => {
    const [balance, transactions] = await Promise.all([getWalletBalance(), getTransactionHistory()]);
    return {balance, transactions};
  });
  const [mode, setMode] = useState<'deposit' | 'withdrawal'>('deposit');
  const [notice, setNotice] = useState('');
  const [working, setWorking] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const payload = {amount: Number(data.get('amount')), cliqAlias: String(data.get('cliqAlias'))};
    setWorking(true);
    setNotice('');
    try {
      const response = mode === 'deposit' ? await requestDeposit(payload) : await requestWithdrawal(payload);
      setNotice(`Request submitted. Reference: ${response.reference}`);
      event.currentTarget.reset();
      result.refresh();
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'Request failed.');
    } finally {
      setWorking(false);
    }
  }

  return (
    <>
      <PageHeader eyebrow="eJOD smart wallet" title="Wallet" description="Manage your JOD-pegged balance and review property transactions." />
      {result.loading ? <LoadingState /> : null}
      {result.error ? <ErrorState message={result.error} retry={result.refresh} /> : null}
      {result.data ? (
        <>
          <div className="wallet-hero">
            <div><span>Available balance</span><strong>{formatJod(result.data.balance.availableBalance)}</strong><small>eJOD · pegged 1:1 to JOD</small></div>
            <div className="wallet-hero__mark">eJOD</div>
          </div>
          <div className="stats-grid stats-grid--three">
            <StatCard label="Total balance" value={formatJod(result.data.balance.ejodBalance)} />
            <StatCard label="Pending deposits" value={formatJod(result.data.balance.pendingDeposits)} />
            <StatCard label="Locked in escrow" value={formatJod(result.data.balance.lockedAmount)} />
          </div>
          <div className="two-column">
            <section className="panel">
              <div className="segmented-control"><button className={mode === 'deposit' ? 'active' : ''} onClick={() => setMode('deposit')} type="button">Deposit</button><button className={mode === 'withdrawal' ? 'active' : ''} onClick={() => setMode('withdrawal')} type="button">Withdraw</button></div>
              <form className="stack-form" onSubmit={submit}>
                <label>Amount (JOD)<input min="1" name="amount" required type="number" /></label>
                <label>CliQ alias or IBAN<input name="cliqAlias" required /></label>
                {notice ? <div className="inline-alert inline-alert--success">{notice}</div> : null}
                <button className="button button--primary" disabled={working} type="submit">{working ? 'Submitting…' : `Request ${mode}`}</button>
              </form>
            </section>
            <section className="panel"><div className="section-heading"><div><h2>Recent transactions</h2></div></div><div className="transaction-list">{result.data.transactions.items.map(item => <div className="transaction" key={item.id}><span className={`transaction__icon transaction__icon--${item.amount >= 0 ? 'in' : 'out'}`}>{item.amount >= 0 ? '↓' : '↑'}</span><div><strong>{item.description}</strong><small>{formatDate(item.createdAt)}</small></div><div><strong>{formatJod(item.amount)}</strong><StatusBadge status={item.status} /></div></div>)}</div></section>
          </div>
        </>
      ) : null}
    </>
  );
}
