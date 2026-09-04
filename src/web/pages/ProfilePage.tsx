import {useState, type ReactNode} from 'react';
import {Link} from 'react-router-dom';
import {getMyProfile, updateMyPreference} from '../../api/profile';
import {AppImages} from '../../assets/images';
import {useAuth} from '../../store/AuthContext';
import {ErrorState, LoadingState, formatJod} from '../ui';
import {useAsyncData} from '../useAsyncData';

type ProfileIconName =
  | 'arrow'
  | 'bell'
  | 'check'
  | 'copy'
  | 'globe'
  | 'help'
  | 'lock'
  | 'logout'
  | 'message'
  | 'shield';

export function ProfilePage() {
  const result = useAsyncData(getMyProfile);
  const {signOut} = useAuth();
  const [notificationOverride, setNotificationOverride] = useState<boolean | null>(null);
  const [preferenceState, setPreferenceState] = useState<'idle' | 'saving' | 'error'>('idle');
  const [copyState, setCopyState] = useState<'idle' | 'copied' | 'error'>('idle');

  if (result.loading) return <LoadingState label="Loading your profile" />;
  if (result.error) return <ErrorState message={result.error} retry={result.refresh} />;
  if (!result.data) return null;

  const profile = result.data;
  const notificationsEnabled = notificationOverride ?? profile.preference.notificationsEnabled;
  const initials = profile.user.username
    .split(/\s+/)
    .slice(0, 2)
    .map(part => part[0])
    .join('')
    .toUpperCase();
  const verifiedRecords = profile.ownedProperties.filter(
    property =>
      property.verificationStatus === 'verified' &&
      property.identityVerificationStatus === 'verified',
  ).length;

  const toggleNotifications = async () => {
    const previous = notificationsEnabled;
    const next = !previous;
    setNotificationOverride(next);
    setPreferenceState('saving');
    try {
      const saved = await updateMyPreference({notificationsEnabled: next});
      setNotificationOverride(saved.notificationsEnabled);
      setPreferenceState('idle');
    } catch {
      setNotificationOverride(previous);
      setPreferenceState('error');
    }
  };

  const copyAccountReference = async () => {
    try {
      await navigator.clipboard.writeText(profile.user.id);
      setCopyState('copied');
      window.setTimeout(() => setCopyState('idle'), 1800);
    } catch {
      setCopyState('error');
    }
  };

  return (
    <div className="citizen-profile">
      <header className="profile-titlebar">
        <div>
          <span className="eyebrow">Citizen account</span>
          <h1>Your profile</h1>
          <p>Identity, property activity and account preferences in one place.</p>
        </div>
        <span className="profile-titlebar__secure">
          <ProfileIcon name="lock" /> Secure session
        </span>
      </header>

      <div className="profile-layout">
        <aside className="profile-sidebar" aria-label="Citizen identity">
          <section className="profile-identity-card">
            <div
              aria-hidden="true"
              className="profile-identity-card__cover"
              style={{backgroundImage: `url(${AppImages.backgrounds.profileHero})`}}
            />
            <div className="profile-identity-card__body">
              <div className="profile-avatar" aria-hidden="true">{initials}</div>
              <span className="profile-verified-pill">
                <ProfileIcon name="check" /> SANAD connected
              </span>
              <h2>{profile.user.username}</h2>
              <p>Individual citizen account</p>

              <dl className="profile-identity-details">
                <div>
                  <dt>Account reference</dt>
                  <dd className="mono">{profile.user.id}</dd>
                  <button
                    aria-label="Copy account reference"
                    className="profile-copy"
                    onClick={copyAccountReference}
                    title="Copy account reference"
                    type="button">
                    <ProfileIcon name={copyState === 'copied' ? 'check' : 'copy'} />
                  </button>
                </div>
                <div><dt>Account type</dt><dd>Citizen</dd></div>
                <div><dt>Service region</dt><dd>Jordan</dd></div>
              </dl>
              <p className={`profile-copy-status ${copyState === 'error' ? 'is-error' : ''}`} aria-live="polite">
                {copyState === 'copied' ? 'Account reference copied.' : copyState === 'error' ? 'Unable to copy. Please try again.' : ''}
              </p>
            </div>
            <div className="profile-trust-note">
              <span><ProfileIcon name="shield" /></span>
              <div><strong>Identity protected</strong><p>Your account is linked to your government identity provider.</p></div>
            </div>
          </section>
        </aside>

        <main className="profile-content">
          <section className="profile-portfolio" aria-labelledby="portfolio-heading">
            <div className="profile-portfolio__head">
              <div>
                <span>Property portfolio</span>
                <h2 id="portfolio-heading">{formatJod(profile.aggregates.totalOwnedValue)}</h2>
                <p>Total recorded property value</p>
              </div>
              <Link aria-label="Open my properties" to="/app/my-properties">
                <ProfileIcon name="arrow" />
              </Link>
            </div>
            <div className="profile-portfolio__metrics">
              <div><strong>{profile.aggregates.ownedPropertyCount}</strong><span>Properties</span></div>
              <div><strong>{verifiedRecords}</strong><span>Verified records</span></div>
              <div><strong>{profile.aggregates.savedCount}</strong><span>Saved</span></div>
            </div>
            <Link className="profile-portfolio__link" to="/app/my-properties">
              Review your portfolio <ProfileIcon name="arrow" />
            </Link>
          </section>

          <section className="profile-section" aria-labelledby="preferences-heading">
            <div className="profile-section__heading">
              <div><span className="eyebrow">Preferences</span><h2 id="preferences-heading">Stay in control</h2></div>
              <span>Saved automatically</span>
            </div>
            <div className="profile-setting-row">
              <span className="profile-setting-row__icon"><ProfileIcon name="bell" /></span>
              <div>
                <strong>Activity notifications</strong>
                <p>Get updates about listings, records and new messages.</p>
                <small aria-live="polite">
                  {preferenceState === 'saving' ? 'Saving preference…' : preferenceState === 'error' ? 'Could not save. Try again.' : notificationsEnabled ? 'Notifications are on' : 'Notifications are off'}
                </small>
              </div>
              <button
                aria-checked={notificationsEnabled}
                aria-label="Activity notifications"
                className={`profile-switch ${notificationsEnabled ? 'is-on' : ''}`}
                disabled={preferenceState === 'saving'}
                onClick={toggleNotifications}
                role="switch"
                type="button">
                <span />
              </button>
            </div>
            <div className="profile-setting-row profile-setting-row--static">
              <span className="profile-setting-row__icon"><ProfileIcon name="globe" /></span>
              <div><strong>Language &amp; currency</strong><p>English · Jordanian dinar (JOD)</p></div>
              <span className="profile-setting-value">Jordan</span>
            </div>
          </section>

          <section className="profile-section" aria-labelledby="activity-heading">
            <div className="profile-section__heading">
              <div><span className="eyebrow">Account</span><h2 id="activity-heading">Activity &amp; support</h2></div>
            </div>
            <nav className="profile-links" aria-label="Account and support">
              <ProfileLink
                description="Review listing and record updates"
                icon="bell"
                label="Notifications"
                to="/app/notifications"
              />
              <ProfileLink
                description="Continue conversations securely"
                icon="message"
                label="Messages"
                to="/app/messages"
              />
              <ProfileLink
                description="Guides, answers and contact options"
                icon="help"
                label="Help center"
                to="/app/help"
              />
            </nav>
          </section>

          <section className="profile-signout">
            <div><strong>Finished for now?</strong><p>Sign out on shared or public devices.</p></div>
            <button className="profile-signout__button" onClick={signOut} type="button">
              <ProfileIcon name="logout" /> Sign out
            </button>
          </section>
        </main>
      </div>
    </div>
  );
}

function ProfileLink({description, icon, label, to}: {description: string; icon: ProfileIconName; label: string; to: string}) {
  return (
    <Link className="profile-link" to={to}>
      <span className="profile-link__icon"><ProfileIcon name={icon} /></span>
      <span><strong>{label}</strong><small>{description}</small></span>
      <ProfileIcon name="arrow" />
    </Link>
  );
}

function ProfileIcon({name}: {name: ProfileIconName}) {
  const paths: Record<ProfileIconName, ReactNode> = {
    arrow: <><path d="M5 12h14" /><path d="m14 7 5 5-5 5" /></>,
    bell: <><path d="M18 8a6 6 0 1 0-12 0c0 6-2.5 8.5-2.5 8.5h17S18 14 18 8Z" /><path d="M14 20a2.2 2.2 0 0 1-4 0" /></>,
    check: <path d="m5 12 4 4L19 6" />,
    copy: <><rect x="8" y="8" width="11" height="11" rx="2" /><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2" /></>,
    globe: <><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3c2.2 2.5 3.3 5.5 3.3 9S14.2 18.5 12 21M12 3c-2.2 2.5-3.3 5.5-3.3 9S9.8 18.5 12 21" /></>,
    help: <><circle cx="12" cy="12" r="9" /><path d="M9.8 9a2.4 2.4 0 1 1 3.3 2.2c-.9.4-1.1 1-1.1 1.8M12 17h.01" /></>,
    lock: <><rect x="5" y="10" width="14" height="11" rx="2" /><path d="M8 10V7a4 4 0 0 1 8 0v3" /></>,
    logout: <><path d="M10 5H6.8A1.8 1.8 0 0 0 5 6.8v10.4A1.8 1.8 0 0 0 6.8 19H10" /><path d="m14 8 4 4-4 4m4-4H9" /></>,
    message: <path d="M20 15.5a3 3 0 0 1-3 3H9l-5 2v-14a3 3 0 0 1 3-3h10a3 3 0 0 1 3 3v9Z" />,
    shield: <><path d="M12 3 5 6v5c0 4.8 2.8 8.1 7 10 4.2-1.9 7-5.2 7-10V6l-7-3Z" /><path d="m9 12 2 2 4-4" /></>,
  };

  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <g fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7">{paths[name]}</g>
    </svg>
  );
}
