import {useEffect, useState, type FormEvent} from 'react';
import {Link, useParams} from 'react-router-dom';
import {getThreadDetail, getThreads, sendMessage, type ThreadDetail} from '../../api/messages';
import {EmptyState, ErrorState, LoadingState, PageHeader, formatDate} from '../ui';
import {useAsyncData} from '../useAsyncData';

export function MessagesPage() {
  const {threadId} = useParams();
  const threads = useAsyncData(getThreads);
  const [thread, setThread] = useState<ThreadDetail | null>(null);
  const [threadError, setThreadError] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    setThread(null);
    setThreadError('');
    if (!threadId) return;
    void getThreadDetail(threadId).then(setThread).catch(error => setThreadError(error instanceof Error ? error.message : 'Unable to load conversation.'));
  }, [threadId]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!threadId) return;
    const form = event.currentTarget;
    const data = new FormData(form);
    const body = String(data.get('message')).trim();
    if (!body) return;
    setSending(true);
    try {
      const message = await sendMessage(threadId, body);
      setThread(current => current ? {...current, messages: [...current.messages, message]} : current);
      form.reset();
      threads.refresh();
    } catch (error) {
      setThreadError(error instanceof Error ? error.message : 'Could not send message.');
    } finally {
      setSending(false);
    }
  }

  return (
    <>
      <PageHeader eyebrow="Secure support" title="Messages" description="Discuss listings and opportunities with the Aqarya support team." />
      {threads.loading ? <LoadingState /> : null}
      {threads.error ? <ErrorState message={threads.error} retry={threads.refresh} /> : null}
      {threads.data ? (
        <div className="messages-layout">
          <aside className="thread-list">
            {threads.data.length ? threads.data.map(item => (
              <Link className={threadId === item.id ? 'thread-preview active' : 'thread-preview'} key={item.id} to={`/app/messages/${item.id}`}>
                <div><strong>{item.subject}</strong><small>{formatDate(item.updatedAt)}</small></div>
                <p>{item.lastMessage?.body || 'No messages yet'}</p>
                <span>{item.messageCount}</span>
              </Link>
            )) : <EmptyState title="No conversations" description="Start from a listing when you need assistance." />}
          </aside>
          <section className="conversation panel">
            {!threadId ? <EmptyState title="Select a conversation" description="Choose a thread to see its message history." /> : null}
            {threadId && !thread && !threadError ? <LoadingState label="Loading conversation…" /> : null}
            {threadError ? <ErrorState message={threadError} /> : null}
            {thread ? (
              <><header className="conversation__header"><div><h2>{thread.subject}</h2><p>{thread.listing?.title || 'Aqarya support'}</p></div><span>{thread.messages.length} messages</span></header><div className="message-stream">{thread.messages.map(message => <article className={`message message--${message.senderRole}`} key={message.id}><strong>{message.senderName}</strong><p>{message.body}</p><small>{formatDate(message.createdAt)}</small></article>)}</div><form className="message-form" onSubmit={submit}><input aria-label="Message" autoComplete="off" name="message" placeholder="Write a message…" required /><button className="button button--primary" disabled={sending} type="submit">Send</button></form></>
            ) : null}
          </section>
        </div>
      ) : null}
    </>
  );
}
