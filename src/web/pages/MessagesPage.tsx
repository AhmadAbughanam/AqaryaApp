import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent,
} from 'react';
import {Link, useParams} from 'react-router-dom';
import {
  getThreadDetail,
  getThreads,
  sendMessage,
  type MessageItem,
  type ThreadDetail,
  type ThreadListItem,
} from '../../api/messages';
import {ErrorState, PropertyCover, formatJod} from '../ui';
import {useAsyncData} from '../useAsyncData';

type InboxView = 'all' | 'reply';
type IconName = 'arrow' | 'back' | 'building' | 'check' | 'message' | 'pin' | 'search' | 'send' | 'shield';

const QUICK_REPLIES = ['Thanks, understood.', 'What is the next step?', 'Can you confirm the timeline?'];

function Icon({name}: {name: IconName}) {
  const line = {
    fill: 'none',
    stroke: 'currentColor',
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    strokeWidth: 1.8,
  };
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      {name === 'search' ? <><circle {...line} cx="10.5" cy="10.5" r="6.5" /><path {...line} d="m15.5 15.5 4.5 4.5" /></> : null}
      {name === 'back' ? <path {...line} d="m15 5-7 7 7 7M8 12h12" /> : null}
      {name === 'arrow' ? <path {...line} d="m9 5 7 7-7 7" /> : null}
      {name === 'send' ? <path {...line} d="m3 4 18 8-18 8 3-8-3-8Zm3 8h15" /> : null}
      {name === 'pin' ? <><path {...line} d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" /><circle {...line} cx="12" cy="10" r="2.5" /></> : null}
      {name === 'message' ? <path {...line} d="M20 15.5a3 3 0 0 1-3 3H9l-5 2v-14a3 3 0 0 1 3-3h10a3 3 0 0 1 3 3v9Z" /> : null}
      {name === 'shield' ? <><path {...line} d="M12 3 20 6v5c0 5-3.4 8.2-8 10-4.6-1.8-8-5-8-10V6l8-3Z" /><path {...line} d="m8.5 12 2.2 2.2 4.8-5" /></> : null}
      {name === 'check' ? <path {...line} d="m5 12 4 4L19 6" /> : null}
      {name === 'building' ? <><path {...line} d="M4 21h16M6 21V8h8v13M14 12h4v9M9 11h2M9 15h2" /></> : null}
    </svg>
  );
}

const isSameDay = (left: Date, right: Date) =>
  left.getFullYear() === right.getFullYear() &&
  left.getMonth() === right.getMonth() &&
  left.getDate() === right.getDate();

const inboxTime = (value: string) => {
  const date = new Date(value);
  const now = new Date();
  if (isSameDay(date, now)) return new Intl.DateTimeFormat('en-JO', {hour: 'numeric', minute: '2-digit'}).format(date);
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (isSameDay(date, yesterday)) return 'Yesterday';
  return new Intl.DateTimeFormat('en-JO', {day: 'numeric', month: 'short'}).format(date);
};

const messageTime = (value: string) =>
  new Intl.DateTimeFormat('en-JO', {hour: 'numeric', minute: '2-digit'}).format(new Date(value));

const dayLabel = (value: string) => {
  const date = new Date(value);
  const now = new Date();
  if (isSameDay(date, now)) return 'Today';
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (isSameDay(date, yesterday)) return 'Yesterday';
  return new Intl.DateTimeFormat('en-JO', {day: 'numeric', month: 'long', year: date.getFullYear() === now.getFullYear() ? undefined : 'numeric'}).format(date);
};

const needsReply = (thread: ThreadListItem) => thread.lastMessage?.senderRole === 'admin';

function ThreadArtwork({thread}: {thread: ThreadListItem}) {
  if (!thread.listingId || !thread.listingMarketType) {
    return <span className="inbox-thread__support"><Icon name="message" /></span>;
  }
  return (
    <PropertyCover property={{
      id: thread.listingId,
      imageUrls: thread.listingImageUrls,
      marketType: thread.listingMarketType,
      propertyType: thread.listingPropertyType,
    }} />
  );
}

function MessagesLoading() {
  return (
    <div aria-label="Loading conversations" className="messages-loading" role="status">
      <aside><span /><span /><span /></aside>
      <section><span /><div /><div /></section>
    </div>
  );
}

export function MessagesPage() {
  const {threadId} = useParams();
  const threads = useAsyncData(getThreads);
  const [thread, setThread] = useState<ThreadDetail | null>(null);
  const [threadLoading, setThreadLoading] = useState(false);
  const [threadError, setThreadError] = useState('');
  const [sendError, setSendError] = useState('');
  const [sending, setSending] = useState(false);
  const [draft, setDraft] = useState('');
  const [query, setQuery] = useState('');
  const [inboxView, setInboxView] = useState<InboxView>('all');
  const streamRef = useRef<HTMLDivElement | null>(null);
  const composerRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    let cancelled = false;
    setThread(null);
    setThreadError('');
    setSendError('');
    setDraft('');
    if (!threadId) {
      setThreadLoading(false);
      return () => { cancelled = true; };
    }
    setThreadLoading(true);
    void getThreadDetail(threadId)
      .then(detail => {
        if (!cancelled) setThread(detail);
      })
      .catch(error => {
        if (!cancelled) setThreadError(error instanceof Error ? error.message : 'Unable to load conversation.');
      })
      .finally(() => {
        if (!cancelled) setThreadLoading(false);
      });
    return () => { cancelled = true; };
  }, [threadId]);

  useEffect(() => {
    if (!thread) return;
    requestAnimationFrame(() => streamRef.current?.scrollTo({behavior: 'smooth', top: streamRef.current.scrollHeight}));
  }, [thread]);

  const visibleThreads = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return (threads.data ?? []).filter(item => {
      if (inboxView === 'reply' && !needsReply(item)) return false;
      return !normalized || `${item.subject} ${item.listingTitle ?? ''} ${item.listingLocation ?? ''} ${item.lastMessage?.body ?? ''}`.toLowerCase().includes(normalized);
    });
  }, [inboxView, query, threads.data]);
  const replyCount = (threads.data ?? []).filter(needsReply).length;
  const selectedSummary = (threads.data ?? []).find(item => item.id === threadId) ?? null;

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const body = draft.trim();
    if (!threadId || !body || sending) return;
    setSending(true);
    setSendError('');
    try {
      const message = await sendMessage(threadId, body);
      setThread(current => current ? {...current, messages: [...current.messages, message]} : current);
      setDraft('');
      if (composerRef.current) composerRef.current.style.height = 'auto';
      threads.refresh();
    } catch (error) {
      setSendError(error instanceof Error ? error.message : 'Could not send message.');
    } finally {
      setSending(false);
    }
  }

  const onComposerKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      event.currentTarget.form?.requestSubmit();
    }
  };

  return (
    <div className={threadId ? 'messages-page has-thread' : 'messages-page'}>
      <header className="messages-page__titlebar">
        <div><span className="eyebrow">Citizen support</span><h1>Messages</h1><p>Property conversations and official guidance, kept together.</p></div>
        <Link className="messages-help" to="/app/help"><Icon name="shield" />Safety & help</Link>
      </header>

      {threads.loading ? <MessagesLoading /> : null}
      {threads.error ? <ErrorState message={threads.error} retry={threads.refresh} /> : null}

      {threads.data ? (
        <div className={threadId ? 'messages-workspace has-thread' : 'messages-workspace'}>
          <aside className="inbox-pane">
            <header className="inbox-pane__head">
              <div><h2>Inbox</h2><span>{threads.data.length} conversations</span></div>
              {replyCount ? <strong>{replyCount} to reply</strong> : null}
            </header>

            <form className="inbox-search" onSubmit={(event: FormEvent) => event.preventDefault()} role="search">
              <Icon name="search" />
              <input aria-label="Search conversations" onChange={event => setQuery(event.target.value)} placeholder="Search messages" value={query} />
              {query ? <button aria-label="Clear search" onClick={() => setQuery('')} type="button">×</button> : null}
            </form>

            <div aria-label="Filter conversations" className="inbox-tabs" role="group">
              <button aria-pressed={inboxView === 'all'} className={inboxView === 'all' ? 'is-active' : ''} onClick={() => setInboxView('all')} type="button">All <span>{threads.data.length}</span></button>
              <button aria-pressed={inboxView === 'reply'} className={inboxView === 'reply' ? 'is-active' : ''} onClick={() => setInboxView('reply')} type="button">Needs reply <span>{replyCount}</span></button>
            </div>

            <nav aria-label="Conversations" className="inbox-list">
              {visibleThreads.map(item => {
                const waiting = needsReply(item);
                return (
                  <Link aria-current={threadId === item.id ? 'page' : undefined} className={threadId === item.id ? 'inbox-thread is-active' : 'inbox-thread'} key={item.id} to={`/app/messages/${item.id}`}>
                    <span className="inbox-thread__art"><ThreadArtwork thread={item} /></span>
                    <span className="inbox-thread__body">
                      <span className="inbox-thread__top"><strong>{item.subject}</strong><time dateTime={item.updatedAt}>{inboxTime(item.updatedAt)}</time></span>
                      <span className="inbox-thread__property">{item.listingPropertyType ?? 'Aqarya support'}{item.listingMarketType ? ` · ${item.listingMarketType === 'sale' ? 'Sale' : 'Rental'}` : ''}</span>
                      <span className="inbox-thread__preview">{item.lastMessage?.senderRole === 'citizen' ? 'You: ' : ''}{item.lastMessage?.body || 'No messages yet'}</span>
                    </span>
                    {waiting ? <span aria-label="Needs your reply" className="inbox-thread__unread" /> : null}
                  </Link>
                );
              })}
              {!visibleThreads.length ? (
                <div className="inbox-empty"><Icon name="search" /><strong>No conversations found</strong><p>Try another search or view all messages.</p><button onClick={() => { setQuery(''); setInboxView('all'); }} type="button">Reset inbox</button></div>
              ) : null}
            </nav>
          </aside>

          <section aria-label="Conversation" className="chat-pane">
            {!threadId ? (
              <div className="chat-empty">
                <span><Icon name="message" /></span>
                <h2>Your conversations live here</h2>
                <p>Select a property conversation to review its history and continue securely.</p>
                <div><Icon name="shield" /><span><strong>Protected context</strong><small>Messages stay connected to the relevant property record.</small></span></div>
              </div>
            ) : null}

            {threadLoading ? (
              <div aria-label="Loading conversation" className="chat-loading" role="status"><header /><span /><span /><span /></div>
            ) : null}

            {threadError ? (
              <div className="chat-error"><Icon name="message" /><strong>Conversation unavailable</strong><p>{threadError}</p><Link to="/app/messages">Return to inbox</Link></div>
            ) : null}

            {thread ? (
              <>
                <header className="chat-header">
                  <Link aria-label="Back to inbox" className="chat-header__back" to="/app/messages"><Icon name="back" /></Link>
                  <span className="chat-header__avatar">A</span>
                  <div><h2>{thread.subject}</h2><p><i />Aqarya Support · Official conversation</p></div>
                  <span className="chat-header__count">{thread.messages.length}<small>messages</small></span>
                </header>

                {thread.listing ? (
                  <Link className="chat-property" to={`/app/property/${thread.listing.id}`}>
                    <span className="chat-property__art"><PropertyCover property={thread.listing} /></span>
                    <span className="chat-property__body"><small>Linked property</small><strong>{thread.listing.title}</strong><span><Icon name="pin" />{thread.listing.location}</span></span>
                    <span className="chat-property__value"><strong>{formatJod(thread.listing.price)}{thread.listing.marketType === 'rent' ? <small>/mo</small> : null}</strong><span className={thread.listing.verificationStatus === 'verified' ? 'is-verified' : ''}>{thread.listing.verificationStatus === 'verified' ? <Icon name="check" /> : null}{thread.listing.verificationStatus.replaceAll('_', ' ')}</span></span>
                    <Icon name="arrow" />
                  </Link>
                ) : null}

                <div aria-live="polite" className="chat-stream" ref={streamRef}>
                  <div className="chat-security"><Icon name="shield" />This conversation is securely linked to your Aqarya account.</div>
                  {thread.messages.map((message, index) => {
                    const previous = thread.messages[index - 1];
                    const showDay = !previous || !isSameDay(new Date(previous.createdAt), new Date(message.createdAt));
                    return <MessageBubble key={message.id} message={message} showDay={showDay} />;
                  })}
                </div>

                <div className="chat-composer">
                  <div aria-label="Quick replies" className="quick-replies">
                    {QUICK_REPLIES.map(reply => <button key={reply} onClick={() => { setDraft(reply); composerRef.current?.focus(); }} type="button">{reply}</button>)}
                  </div>
                  {sendError ? <div className="chat-composer__error" role="alert">{sendError}</div> : null}
                  <form onSubmit={submit}>
                    <textarea
                      aria-label="Message"
                      autoComplete="off"
                      disabled={sending}
                      maxLength={1200}
                      onChange={event => setDraft(event.target.value)}
                      onInput={event => {
                        event.currentTarget.style.height = 'auto';
                        event.currentTarget.style.height = `${Math.min(event.currentTarget.scrollHeight, 112)}px`;
                      }}
                      onKeyDown={onComposerKeyDown}
                      placeholder="Write a message…"
                      ref={composerRef}
                      rows={1}
                      value={draft}
                    />
                    <button aria-label="Send message" disabled={sending || !draft.trim()} type="submit">{sending ? <span className="chat-spinner" /> : <Icon name="send" />}</button>
                  </form>
                  <p>Enter to send · Shift + Enter for a new line</p>
                </div>
              </>
            ) : null}

            {!thread && threadLoading && selectedSummary ? <span className="visually-hidden">Loading {selectedSummary.subject}</span> : null}
          </section>
        </div>
      ) : null}
    </div>
  );
}

function MessageBubble({message, showDay}: {message: MessageItem; showDay: boolean}) {
  const fromCitizen = message.senderRole === 'citizen';
  return (
    <>
      {showDay ? <div className="chat-day"><span>{dayLabel(message.createdAt)}</span></div> : null}
      <div className={fromCitizen ? 'chat-message is-citizen' : 'chat-message is-support'}>
        {!fromCitizen ? <span className="chat-message__avatar">A</span> : null}
        <div>
          <span className="chat-message__meta"><strong>{fromCitizen ? 'You' : message.senderName}</strong><time dateTime={message.createdAt}>{messageTime(message.createdAt)}</time></span>
          <p>{message.body}</p>
        </div>
      </div>
    </>
  );
}
