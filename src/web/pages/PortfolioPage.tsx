import {getOpportunityPortfolio} from '../../api/investmentOpportunities';
import {getMyProfile} from '../../api/profile';
import {EmptyState, ErrorState, LoadingState, PageHeader, StatCard, StatusBadge, formatDate, formatJod} from '../ui';
import {useAsyncData} from '../useAsyncData';

export function PortfolioPage() {
  const result = useAsyncData(async () => {
    const [profile, opportunities] = await Promise.all([
      getMyProfile(),
      getOpportunityPortfolio().catch(() => []),
    ]);
    return {profile, opportunities};
  });

  if (result.loading) return <LoadingState label="Building your portfolio view…" />;
  if (result.error) return <ErrorState message={result.error} retry={result.refresh} />;
  if (!result.data) return null;
  const {profile, opportunities} = result.data;

  return (
    <>
      <PageHeader eyebrow="Wealth overview" title="Your property portfolio" description="Track owned property, investments, and projected returns in one place." />
      <div className="stats-grid">
        <StatCard label="Owned property value" value={formatJod(profile.aggregates.totalOwnedValue)} />
        <StatCard label="Total invested" value={formatJod(profile.aggregates.totalInvested)} />
        <StatCard label="Owned properties" value={profile.aggregates.ownedPropertyCount} />
        <StatCard label="Active investments" value={profile.aggregates.investmentCount + opportunities.length} />
      </div>
      <section className="section-heading"><div><span className="eyebrow">Holdings</span><h2>Investment positions</h2></div></section>
      {!profile.investments.length && !opportunities.length ? (
        <EmptyState title="No investments yet" description="Explore verified opportunities to start building your portfolio." />
      ) : (
        <div className="table-panel">
          <table>
            <thead><tr><th>Position</th><th>Shares</th><th>Invested</th><th>Expected annual return</th><th>Date</th></tr></thead>
            <tbody>
              {profile.investments.map(item => (
                <tr key={item.simulationId}>
                  <td><strong>{item.propertyTitle}</strong><small>{item.propertyLocation}</small></td>
                  <td>{item.sharesOwned}</td><td>{formatJod(item.totalAmount)}</td><td>{formatJod(item.expectedAnnualReturn)}</td><td>{formatDate(item.createdAt)}</td>
                </tr>
              ))}
              {opportunities.map(item => (
                <tr key={item.simulationId}>
                  <td><strong>{item.opportunityTitle}</strong><small>{item.location}</small></td>
                  <td>{item.sharesOwned}</td><td>{formatJod(item.totalAmount)}</td><td>{formatJod(item.annualIncomeEstimate)}</td><td><StatusBadge status={item.opportunityStatus} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
