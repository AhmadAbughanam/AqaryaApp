import {useState, type FormEvent} from 'react';
import {Link, useParams} from 'react-router-dom';
import {
  anchorProperty,
  freezeProperty,
  getAdminInvestmentOpportunities,
  getAdminInvestmentOpportunityDetails,
  getAdminProperties,
  getAdminPropertyDetails,
  getAdminUserDetail,
  getAdminUsers,
  getAnalytics,
  getAuditLogs,
  getDashboardSummary,
  rejectProperty,
  requestPropertyChanges,
  reviewInvestmentOpportunity,
  reviewProviderAccount,
  verifyProperty,
  type InvestmentReviewAction,
  type ProviderReviewAction,
} from '../../api/admin';
import {
  archiveAnnouncement,
  createAnnouncement,
  getAdminContentBlocks,
  getAnnouncements,
  upsertContentBlock,
  type AnnouncementAudience,
  type AnnouncementType,
} from '../../api/cms';
import {getModerationReportDetail, getModerationReports, moderateReport, type ModerateAction} from '../../api/moderation';
import {EmptyState, ErrorState, LoadingState, PageHeader, StatCard, StatusBadge, formatDate, formatJod} from '../ui';
import {useAsyncData} from '../useAsyncData';

export function AdminDashboardPage() {
  const result = useAsyncData(getDashboardSummary);
  return (
    <>
      <PageHeader eyebrow="Government operations" title="Command center" />
      {result.loading ? <LoadingState /> : null}
      {result.error ? <ErrorState message={result.error} retry={result.refresh} /> : null}
      {result.data ? <><div className="stats-grid"><StatCard label="Pending listings" value={result.data.pendingListings} /><StatCard label="Investment reviews" value={result.data.pendingOpportunities} /><StatCard label="Provider reviews" value={result.data.pendingProviders} /><StatCard label="Open reports" value={result.data.openReports} /></div><div className="admin-queue-grid"><QueueLink count={result.data.pendingListings} label="Property verification" to="/admin/properties" /><QueueLink count={result.data.pendingOpportunities} label="Investment approvals" to="/admin/investments" /><QueueLink count={result.data.pendingProviders} label="Provider verification" to="/admin/users" /><QueueLink count={result.data.flaggedItems} label="Quality flags" to="/admin/moderation" /></div><section className="panel"><div className="section-heading"><div><span className="eyebrow">Recent activity</span><h2>Audit highlights</h2></div><Link to="/admin/audit">View full log</Link></div><div className="activity-list">{result.data.recentAuditHighlights.map(item => <div className="activity" key={item.id}><span className="activity__mark" /><div><strong>{item.actionType.replaceAll('_', ' ')}</strong><p>{item.actorName} · {item.actorRole}</p></div><time>{formatDate(item.timestamp)}</time></div>)}</div></section></> : null}
    </>
  );
}

function QueueLink({count, label, to}: {count: number; label: string; to: string}) {
  return <Link className="queue-card" to={to}><span>{label}</span><strong>{count}</strong><small>Open queue →</small></Link>;
}

export function AdminPropertiesPage() {
  const [status, setStatus] = useState('all');
  const result = useAsyncData(() => getAdminProperties(status as Parameters<typeof getAdminProperties>[0]), [status]);
  return (
    <><PageHeader eyebrow="Registry review" title="Property listings" action={<select onChange={event => setStatus(event.target.value)} value={status}><option value="all">All statuses</option><option value="pending_verification">Pending</option><option value="needs_changes">Needs changes</option><option value="verified">Verified</option><option value="rejected">Rejected</option><option value="frozen">Frozen</option></select>} />{result.loading ? <LoadingState /> : null}{result.error ? <ErrorState message={result.error} retry={result.refresh} /> : null}{result.data && !result.data.length ? <EmptyState title="Queue is clear" description="No listings match this status." /> : null}<div className="table-panel"><table><thead><tr><th>Property</th><th>Owner</th><th>Submitted</th><th>Identity</th><th>Status</th><th /></tr></thead><tbody>{result.data?.map(item => <tr key={item.id}><td><strong>{item.title}</strong><small>{item.location}</small></td><td>{item.ownerName}</td><td>{formatDate(item.submissionDate)}</td><td><StatusBadge status={item.identityVerificationStatus} /></td><td><StatusBadge status={item.verificationStatus} /></td><td><Link className="table-link" to={`/admin/properties/${item.id}`}>Review →</Link></td></tr>)}</tbody></table></div></>
  );
}

export function AdminPropertyDetailPage() {
  const {id = ''} = useParams();
  const result = useAsyncData(() => getAdminPropertyDetails(id), [id]);
  const [notice, setNotice] = useState('');
  const [working, setWorking] = useState(false);
  async function act(action: 'verify' | 'freeze' | 'anchor' | 'reject' | 'changes') {
    const note = action === 'reject' || action === 'changes' ? window.prompt(action === 'reject' ? 'Reason for rejection' : 'Requested changes') : null;
    if ((action === 'reject' || action === 'changes') && !note) return;
    setWorking(true); setNotice('');
    try {
      if (action === 'verify') await verifyProperty(id);
      if (action === 'freeze') await freezeProperty(id);
      if (action === 'anchor') await anchorProperty(id);
      if (action === 'reject') await rejectProperty(id, note || '');
      if (action === 'changes') await requestPropertyChanges(id, note || '');
      setNotice('Property record updated.'); result.refresh();
    } catch (error) { setNotice(error instanceof Error ? error.message : 'Action failed.'); }
    finally { setWorking(false); }
  }
  if (result.loading) return <LoadingState />;
  if (result.error) return <ErrorState message={result.error} retry={result.refresh} />;
  const item = result.data; if (!item) return null;
  return <><PageHeader eyebrow="Listing review" title={item.title} description={`${item.ownerName} · ${item.location}`} action={<Link className="button button--secondary" to="/admin/properties">Back to queue</Link>} /><div className="detail-layout"><section><article className="panel prose-panel"><div className="record-title"><StatusBadge status={item.verificationStatus} /><span>Submitted {formatDate(item.submissionDate)}</span></div><h2>Property evidence</h2><p>{item.description}</p><div className="feature-grid"><div><span>Property value</span><strong>{formatJod(item.propertyValue)}</strong></div><div><span>Asking price</span><strong>{formatJod(item.price)}</strong></div><div><span>Ownership</span><strong>{item.ownershipType}</strong></div><div><span>Proof type</span><strong>{item.ownershipProofType}</strong></div><div><span>Proof number</span><strong>{item.ownershipProofNumber}</strong></div><div><span>Seller account</span><strong>{item.seller?.username || '—'}</strong></div></div></article><article className="panel"><h2>Audit history</h2><div className="activity-list">{item.auditEvents.map(event => <div className="activity" key={event.id}><span className="activity__mark" /><div><strong>{event.actionType.replaceAll('_', ' ')}</strong><p>{event.actorName}</p></div><time>{formatDate(event.timestamp)}</time></div>)}</div></article></section><aside className="purchase-card panel"><span className="eyebrow">Decision</span><h2>Verification controls</h2><StatusBadge status={item.blockchainStatus} />{notice ? <div className="inline-alert inline-alert--success">{notice}</div> : null}<button className="button button--primary button--wide" disabled={working} onClick={() => void act('verify')} type="button">Approve & verify</button><button className="button button--secondary button--wide" disabled={working} onClick={() => void act('anchor')} type="button">Anchor record</button><button className="button button--secondary button--wide" disabled={working} onClick={() => void act('changes')} type="button">Request changes</button><button className="button button--danger button--wide" disabled={working} onClick={() => void act('reject')} type="button">Reject listing</button><button className="button button--ghost button--wide" disabled={working} onClick={() => void act('freeze')} type="button">Freeze listing</button></aside></div></>;
}

export function AdminInvestmentsPage() {
  const [status, setStatus] = useState('all');
  const result = useAsyncData(() => getAdminInvestmentOpportunities(status as Parameters<typeof getAdminInvestmentOpportunities>[0]), [status]);
  return <><PageHeader eyebrow="Investment governance" title="Investment opportunities" action={<select onChange={event => setStatus(event.target.value)} value={status}><option value="all">All statuses</option><option value="submitted">Submitted</option><option value="under_review">Under review</option><option value="approved">Approved</option><option value="published">Published</option><option value="rejected">Rejected</option></select>} />{result.loading ? <LoadingState /> : null}{result.error ? <ErrorState message={result.error} retry={result.refresh} /> : null}<div className="table-panel"><table><thead><tr><th>Opportunity</th><th>Sponsor</th><th>Target IRR</th><th>Risk</th><th>Status</th><th /></tr></thead><tbody>{result.data?.map(item => <tr key={item.id}><td><strong>{item.title}</strong><small>{item.location} · {item.assetClass}</small></td><td>{item.sponsorName}</td><td>{item.targetIrr}%</td><td>{item.riskBand}</td><td><StatusBadge status={item.status} /></td><td><Link className="table-link" to={`/admin/investments/${item.id}`}>Review →</Link></td></tr>)}</tbody></table></div></>;
}

export function AdminInvestmentDetailPage() {
  const {id = ''} = useParams(); const result = useAsyncData(() => getAdminInvestmentOpportunityDetails(id), [id]); const [notice, setNotice] = useState(''); const [working, setWorking] = useState(false);
  async function act(action: InvestmentReviewAction) { const notes = action === 'reject' ? window.prompt('Reason for rejection') || undefined : undefined; if (action === 'reject' && !notes) return; setWorking(true); try { await reviewInvestmentOpportunity(id, action, notes); setNotice('Opportunity updated.'); result.refresh(); } catch (error) { setNotice(error instanceof Error ? error.message : 'Action failed.'); } finally { setWorking(false); } }
  if (result.loading) return <LoadingState />; if (result.error) return <ErrorState message={result.error} retry={result.refresh} />; const item = result.data; if (!item) return null;
  return <><PageHeader eyebrow="Opportunity review" title={item.title} description={`${item.sponsorName} · ${item.location}`} action={<Link className="button button--secondary" to="/admin/investments">Back to queue</Link>} /><div className="detail-layout"><article className="panel prose-panel"><div className="record-title"><StatusBadge status={item.status} /><StatusBadge status={item.blockchainStatus} /></div><h2>Investment evidence</h2><p>{item.description}</p><div className="stats-grid stats-grid--three"><StatCard label="Target IRR" value={`${item.targetIrr}%`} /><StatCard label="Cash yield" value={`${item.targetCashYield}%`} /><StatCard label="Funding goal" value={formatJod(item.fundingGoal)} /></div><div className="feature-grid"><div><span>Asset class</span><strong>{item.assetClass}</strong></div><div><span>Risk band</span><strong>{item.riskBand}</strong></div><div><span>Ownership</span><strong>{item.ownershipStructure}</strong></div><div><span>Exit model</span><strong>{item.exitModel}</strong></div></div></article><aside className="purchase-card panel"><span className="eyebrow">Decision</span><h2>Review controls</h2>{notice ? <div className="inline-alert inline-alert--success">{notice}</div> : null}<button className="button button--primary button--wide" disabled={working} onClick={() => void act('approve')} type="button">Approve</button><button className="button button--secondary button--wide" disabled={working} onClick={() => void act('publish')} type="button">Publish</button><button className="button button--secondary button--wide" disabled={working} onClick={() => void act('unpublish')} type="button">Unpublish</button><button className="button button--danger button--wide" disabled={working} onClick={() => void act('reject')} type="button">Reject</button></aside></div></>;
}

export function AdminUsersPage() {
  const result = useAsyncData(() => getAdminUsers());
  return <><PageHeader eyebrow="Identity and providers" title="User management" />{result.loading ? <LoadingState /> : null}{result.error ? <ErrorState message={result.error} retry={result.refresh} /> : null}<div className="table-panel"><table><thead><tr><th>User</th><th>Role</th><th>Account type</th><th>Provider status</th><th>Activity</th><th /></tr></thead><tbody>{result.data?.map(item => <tr key={item.id}><td><strong>{item.username}</strong><small>Joined {formatDate(item.createdAt)}</small></td><td>{item.role}</td><td>{item.providerProfile?.accountType || 'individual'}</td><td><StatusBadge status={item.providerProfile?.providerVerificationStatus || 'citizen'} /></td><td>{item.counts.properties} properties · {item.counts.threads} threads</td><td><Link className="table-link" to={`/admin/users/${item.id}`}>Open →</Link></td></tr>)}</tbody></table></div></>;
}

export function AdminUserDetailPage() {
  const {id = ''} = useParams(); const result = useAsyncData(() => getAdminUserDetail(id), [id]); const [notice, setNotice] = useState(''); const [working, setWorking] = useState(false);
  async function act(action: ProviderReviewAction) { const notes = window.prompt('Review notes (optional)') || undefined; setWorking(true); try { await reviewProviderAccount(id, action, notes); setNotice('Provider account updated.'); result.refresh(); } catch (error) { setNotice(error instanceof Error ? error.message : 'Action failed.'); } finally { setWorking(false); } }
  if (result.loading) return <LoadingState />; if (result.error) return <ErrorState message={result.error} retry={result.refresh} />; const user = result.data; if (!user) return null;
  return <><PageHeader eyebrow="Account review" title={user.username} description={`${user.role} · joined ${formatDate(user.createdAt)}`} action={<Link className="button button--secondary" to="/admin/users">Back to users</Link>} /><div className="detail-layout"><article className="panel prose-panel"><h2>Provider profile</h2>{user.providerProfile ? <div className="feature-grid"><div><span>Business</span><strong>{user.providerProfile.businessName || '—'}</strong></div><div><span>Account type</span><strong>{user.providerProfile.accountType}</strong></div><div><span>Registration</span><strong>{user.providerProfile.registrationNumber || '—'}</strong></div><div><span>License</span><strong>{user.providerProfile.licenseNumber || '—'}</strong></div><div><span>Email</span><strong>{user.providerProfile.email || '—'}</strong></div><div><span>Status</span><strong><StatusBadge status={user.providerProfile.providerVerificationStatus} /></strong></div></div> : <EmptyState title="Citizen account" description="This user has no provider profile." />}<div className="stats-grid stats-grid--three"><StatCard label="Properties" value={user.counts.properties} /><StatCard label="Threads" value={user.counts.threads} /><StatCard label="Notifications" value={user.counts.notifications} /></div></article>{user.providerProfile ? <aside className="purchase-card panel"><span className="eyebrow">Provider decision</span>{notice ? <div className="inline-alert inline-alert--success">{notice}</div> : null}<button className="button button--primary button--wide" disabled={working} onClick={() => void act('verify')} type="button">Verify provider</button><button className="button button--secondary button--wide" disabled={working} onClick={() => void act('under_review')} type="button">Mark under review</button><button className="button button--danger button--wide" disabled={working} onClick={() => void act('reject')} type="button">Reject</button><button className="button button--ghost button--wide" disabled={working} onClick={() => void act('suspend')} type="button">Suspend</button></aside> : null}</div></>;
}

export function AdminModerationPage() {
  const result = useAsyncData(() => getModerationReports({limit: 100}));
  return <><PageHeader eyebrow="Trust and safety" title="Moderation queue" />{result.loading ? <LoadingState /> : null}{result.error ? <ErrorState message={result.error} retry={result.refresh} /> : null}{result.data && !result.data.items.length ? <EmptyState title="Queue is clear" description="There are no reports to review." /> : null}<div className="table-panel"><table><thead><tr><th>Reported record</th><th>Reason</th><th>Reporter</th><th>Created</th><th>Status</th><th /></tr></thead><tbody>{result.data?.items.map(item => <tr key={item.id}><td><strong>{item.entityTitle || item.targetId}</strong><small>{item.targetType} · {item.entityLocation || '—'}</small></td><td>{item.reason.replaceAll('_', ' ')}</td><td>{item.reporter.username}</td><td>{formatDate(item.createdAt)}</td><td><StatusBadge status={item.status} /></td><td><Link className="table-link" to={`/admin/moderation/${item.id}`}>Investigate →</Link></td></tr>)}</tbody></table></div></>;
}

export function AdminModerationDetailPage() {
  const {id = ''} = useParams(); const result = useAsyncData(() => getModerationReportDetail(id), [id]); const [notice, setNotice] = useState(''); const [working, setWorking] = useState(false);
  async function act(action: ModerateAction) { setWorking(true); try { await moderateReport(id, {action, notes: window.prompt('Review notes (optional)') || undefined}); setNotice('Report updated.'); result.refresh(); } catch (error) { setNotice(error instanceof Error ? error.message : 'Action failed.'); } finally { setWorking(false); } }
  if (result.loading) return <LoadingState />; if (result.error) return <ErrorState message={result.error} retry={result.refresh} />; const report = result.data; if (!report) return null;
  return <><PageHeader eyebrow="Report investigation" title={report.entitySummary?.title || report.targetId} description={`Reported by ${report.reporter.username} · ${formatDate(report.createdAt)}`} action={<Link className="button button--secondary" to="/admin/moderation">Back to reports</Link>} /><div className="detail-layout"><article className="panel prose-panel"><div className="record-title"><StatusBadge status={report.status} /><span>{report.reason.replaceAll('_', ' ')}</span></div><h2>Citizen report</h2><p>{report.notes || 'No additional notes were provided.'}</p><h2>Automated quality flags</h2>{report.qualityFlags.length ? <div className="record-list">{report.qualityFlags.map(flag => <div className="flag-card" key={flag.id}><StatusBadge status={flag.severity} /><div><strong>{flag.rule.replaceAll('_', ' ')}</strong><p>{flag.details}</p></div></div>)}</div> : <p>No automated flags are attached.</p>}</article><aside className="purchase-card panel"><span className="eyebrow">Decision</span>{notice ? <div className="inline-alert inline-alert--success">{notice}</div> : null}<button className="button button--secondary button--wide" disabled={working} onClick={() => void act('mark_under_review')} type="button">Mark under review</button><button className="button button--primary button--wide" disabled={working} onClick={() => void act('resolve')} type="button">Resolve report</button><button className="button button--ghost button--wide" disabled={working} onClick={() => void act('dismiss')} type="button">Dismiss report</button></aside></div></>;
}

export function AdminContentPage() {
  const result = useAsyncData(async () => { const [announcements, blocks] = await Promise.all([getAnnouncements({limit: 100}), getAdminContentBlocks()]); return {announcements, blocks}; }); const [notice, setNotice] = useState('');
  async function addAnnouncement(event: FormEvent<HTMLFormElement>) { event.preventDefault(); const form = event.currentTarget; const data = new FormData(form); try { await createAnnouncement({title: String(data.get('title')), body: String(data.get('body')), type: String(data.get('type')) as AnnouncementType, audience: String(data.get('audience')) as AnnouncementAudience}); form.reset(); setNotice('Announcement published.'); result.refresh(); } catch (error) { setNotice(error instanceof Error ? error.message : 'Could not publish announcement.'); } }
  async function saveBlock(event: FormEvent<HTMLFormElement>) { event.preventDefault(); const form = event.currentTarget; const data = new FormData(form); try { await upsertContentBlock(String(data.get('key')), {title: String(data.get('title')), body: String(data.get('body')), icon: String(data.get('icon') || ''), order: Number(data.get('order') || 0), active: true}); form.reset(); setNotice('Help content saved.'); result.refresh(); } catch (error) { setNotice(error instanceof Error ? error.message : 'Could not save content.'); } }
  return <><PageHeader eyebrow="Citizen communications" title="Content management" />{result.loading ? <LoadingState /> : null}{result.error ? <ErrorState message={result.error} retry={result.refresh} /> : null}{notice ? <div className="inline-alert inline-alert--success">{notice}</div> : null}<div className="two-column"><form className="panel stack-form" onSubmit={addAnnouncement}><h2>New announcement</h2><label>Title<input name="title" required /></label><label>Message<textarea name="body" required rows={4} /></label><label>Type<select name="type"><option value="system">System</option><option value="listing_status_change">Listing update</option><option value="investment_milestone">Investment milestone</option></select></label><label>Audience<select name="audience"><option value="all_citizens">All citizens</option><option value="all_providers">All providers</option></select></label><button className="button button--primary" type="submit">Publish announcement</button></form><form className="panel stack-form" onSubmit={saveBlock}><h2>Help-center block</h2><label>Unique key<input name="key" placeholder="wallet-help" required /></label><label>Title<input name="title" required /></label><label>Content<textarea name="body" required rows={4} /></label><div className="form-grid"><label>Icon<input name="icon" placeholder="?" /></label><label>Order<input min="0" name="order" type="number" /></label></div><button className="button button--primary" type="submit">Save content block</button></form></div>{result.data ? <><section className="section-heading"><div><h2>Active announcements</h2></div></section><div className="record-list">{result.data.announcements.items.map(item => <article className="panel content-record" key={item.id}><div><StatusBadge status={item.status} /><h3>{item.title}</h3><p>{item.body}</p><small>{item.audience.replaceAll('_', ' ')} · {formatDate(item.createdAt)}</small></div>{item.status === 'active' ? <button className="button button--ghost" onClick={() => void archiveAnnouncement(item.id).then(result.refresh)} type="button">Archive</button> : null}</article>)}</div><section className="section-heading"><div><h2>Help content</h2></div></section><div className="help-grid">{result.data.blocks.map(block => <article className="panel" key={block.id}><StatusBadge status={block.active ? 'active' : 'inactive'} /><h3>{block.title}</h3><p>{block.body}</p><small>{block.key} · order {block.order}</small></article>)}</div></> : null}</>;
}

export function AdminAuditPage() {
  const result = useAsyncData(() => getAuditLogs({limit: 100}));
  return <><PageHeader eyebrow="Accountability" title="Audit log" />{result.loading ? <LoadingState /> : null}{result.error ? <ErrorState message={result.error} retry={result.refresh} /> : null}<div className="table-panel"><table><thead><tr><th>Action</th><th>Actor</th><th>Role</th><th>Property</th><th>Timestamp</th></tr></thead><tbody>{result.data?.items.map(item => <tr key={item.id}><td><strong>{item.actionType.replaceAll('_', ' ')}</strong></td><td>{item.actorName}</td><td>{item.actorRole}</td><td className="mono">{item.propertyId || '—'}</td><td>{formatDate(item.timestamp)}</td></tr>)}</tbody></table></div></>;
}

export function AdminAnalyticsPage() {
  const result = useAsyncData(getAnalytics);
  return <><PageHeader eyebrow="Platform intelligence" title="Analytics" />{result.loading ? <LoadingState /> : null}{result.error ? <ErrorState message={result.error} retry={result.refresh} /> : null}{result.data ? <><div className="stats-grid"><StatCard label="Total properties" value={result.data.totalProperties} /><StatCard label="Verified properties" value={result.data.verifiedProperties} /><StatCard label="Citizen users" value={result.data.totalCitizenUsers} /><StatCard label="Simulation volume" value={formatJod(result.data.totalSimulationVolume)} /></div><div className="analytics-grid"><MetricGroup title="Property pipeline" values={[['Pending', result.data.pendingVerificationProperties], ['Needs changes', result.data.needsChangesProperties], ['Rejected', result.data.rejectedProperties], ['Anchored', result.data.totalAnchored]]} /><MetricGroup title="Investment pipeline" values={[['Draft', result.data.investments.draft], ['Under review', result.data.investments.underReview], ['Published', result.data.investments.published], ['Rejected', result.data.investments.rejected]]} /><MetricGroup title="Trust & safety" values={[['Open reports', result.data.moderation.reportsOpen], ['Under review', result.data.moderation.reportsUnderReview], ['Resolved', result.data.moderation.reportsResolved], ['Quality flags', result.data.moderation.unresolvedQualityFlags]]} /><MetricGroup title="Citizen support" values={[['Threads', result.data.support.totalThreads], ['Messages', result.data.support.totalMessages], ['Recent messages', result.data.support.recentMessages], ['Announcements', result.data.cms.activeAnnouncements]]} /></div></> : null}</>;
}

function MetricGroup({title, values}: {title: string; values: Array<[string, number]>}) { return <section className="panel metric-group"><h2>{title}</h2>{values.map(([label, value]) => <div key={label}><span>{label}</span><strong>{value}</strong></div>)}</section>; }
