import {getActiveContentBlocks} from '../../api/cms';
import {EmptyState, ErrorState, LoadingState, PageHeader} from '../ui';
import {useAsyncData} from '../useAsyncData';

export function HelpPage() {
  const result = useAsyncData(getActiveContentBlocks);
  return (
    <>
      <PageHeader eyebrow="Support center" title="How can we help?" description="Guidance for property verification, wallet transactions, and platform services." />
      {result.loading ? <LoadingState /> : null}
      {result.error ? <ErrorState message={result.error} retry={result.refresh} /> : null}
      {result.data && !result.data.length ? <EmptyState title="No help articles" description="Help content will appear here when published." /> : null}
      <div className="help-grid">{result.data?.map(block => <article className="panel" key={block.id}><span className="help-icon">{block.icon || '?'}</span><h2>{block.title}</h2><p>{block.body}</p></article>)}</div>
    </>
  );
}
