import {useState} from 'react';
import {Link, useParams} from 'react-router-dom';
import {
  getOpportunityDetail,
  investOpportunityWithWallet,
  simulateOpportunityInvestment,
  type OpportunitySimulationResult,
} from '../../api/investmentOpportunities';
import {AppImages} from '../../assets/images';
import {ErrorState, LoadingState, PageHeader, ProgressBar, StatusBadge, formatJod} from '../ui';
import {useAsyncData} from '../useAsyncData';

export function OpportunityDetailPage() {
  const {id = ''} = useParams();
  const result = useAsyncData(() => getOpportunityDetail(id), [id]);
  const [shares, setShares] = useState(10);
  const [simulation, setSimulation] = useState<OpportunitySimulationResult | null>(null);
  const [notice, setNotice] = useState('');
  const [working, setWorking] = useState(false);

  async function simulate() {
    setWorking(true);
    setNotice('');
    try {
      setSimulation(await simulateOpportunityInvestment({opportunityId: id, shares}));
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'Simulation failed.');
    } finally {
      setWorking(false);
    }
  }

  async function invest() {
    if (!window.confirm(`Invest in ${shares} shares using your eJOD wallet?`)) return;
    setWorking(true);
    try {
      const response = await investOpportunityWithWallet(id, {shares});
      setSimulation(response);
      setNotice(response.message || 'Investment completed.');
      result.refresh();
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'Investment failed.');
    } finally {
      setWorking(false);
    }
  }

  if (result.loading) return <LoadingState label="Loading opportunity…" />;
  if (result.error) return <ErrorState message={result.error} retry={result.refresh} />;
  const item = result.data;
  if (!item) return null;

  return (
    <>
      <PageHeader
        eyebrow={`${item.assetClass} · ${item.stage}`}
        title={item.title}
        description={`${item.location} · Sponsored by ${item.sponsorName}`}
        action={<Link className="button button--secondary" to="/app">Back to opportunities</Link>}
      />
      <div className="detail-layout">
        <section>
          <div className="detail-hero detail-hero--dark">
            <img src={item.imageUrls[0] || AppImages.property.investment.opportunityHero} alt={item.title} />
            <StatusBadge status={item.trustBadge || item.status} />
          </div>
          <div className="stats-grid stats-grid--four">
            <article className="stat-card"><span>Target IRR</span><strong>{item.targetIrr}%</strong></article>
            <article className="stat-card"><span>Cash yield</span><strong>{item.targetCashYield}%</strong></article>
            <article className="stat-card"><span>Hold period</span><strong>{item.targetHoldYears} yrs</strong></article>
            <article className="stat-card"><span>Trust score</span><strong>{item.trustScore ?? '—'}</strong></article>
          </div>
          <article className="panel prose-panel">
            <h2>Investment thesis</h2>
            <p>{item.description}</p>
            <div className="feature-grid">
              <div><span>Ownership</span><strong>{item.ownershipStructure}</strong></div>
              <div><span>Distributions</span><strong>{item.distributionModel}</strong></div>
              <div><span>Exit model</span><strong>{item.exitModel}</strong></div>
              <div><span>Risk band</span><strong>{item.riskBand}</strong></div>
            </div>
          </article>
        </section>
        <aside className="purchase-card panel">
          <span>Price per share</span>
          <strong>{formatJod(item.pricePerShare)}</strong>
          <ProgressBar value={item.fundingProgress} />
          <small>{formatJod(item.fundedAmount)} of {formatJod(item.fundingGoal)} funded</small>
          <label>Number of shares
            <input min={item.minimumShares} max={item.availableShares} onChange={event => setShares(Number(event.target.value))} type="number" value={shares} />
          </label>
          <div className="total-line"><span>Investment</span><strong>{formatJod(shares * item.pricePerShare)}</strong></div>
          {notice ? <div className="inline-alert inline-alert--success">{notice}</div> : null}
          <button className="button button--secondary button--wide" disabled={working || shares < item.minimumShares} onClick={() => void simulate()} type="button">Simulate return</button>
          <button className="button button--primary button--wide" disabled={working || shares < item.minimumShares} onClick={() => void invest()} type="button">Invest with eJOD</button>
          {simulation ? (
            <div className="simulation-result">
              <span>Projected profit</span><strong>{formatJod(simulation.projectedProfit)}</strong>
              <span>Equity multiple</span><strong>{simulation.equityMultiple.toFixed(2)}×</strong>
            </div>
          ) : null}
        </aside>
      </div>
    </>
  );
}
