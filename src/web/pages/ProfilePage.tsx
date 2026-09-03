import {Link} from 'react-router-dom';
import {getMyProfile} from '../../api/profile';
import {AppImages} from '../../assets/images';
import {ErrorState, LoadingState, PageHeader, StatCard, formatJod} from '../ui';
import {useAsyncData} from '../useAsyncData';

export function ProfilePage() {
  const result = useAsyncData(getMyProfile);

  if (result.loading) return <LoadingState />;
  if (result.error) return <ErrorState message={result.error} retry={result.refresh} />;
  if (!result.data) return null;
  const profile = result.data;

  return (
    <>
      <PageHeader eyebrow="Citizen account" title="Profile" description="Your verified identity, preferences, and activity." />
      <section className="profile-hero panel">
        <div className="profile-hero__cover" style={{backgroundImage: `url(${AppImages.backgrounds.profileHero})`}} />
        <img src={AppImages.placeholders.profileAvatar} alt="Profile" />
        <div><span className="eyebrow">SANAD-verified member</span><h2>{profile.user.username}</h2><p>Citizen account</p></div>
      </section>
      <div className="stats-grid stats-grid--three">
        <StatCard label="Recorded value" value={formatJod(profile.aggregates.totalOwnedValue)} />
        <StatCard label="My properties" value={profile.aggregates.ownedPropertyCount} />
        <StatCard label="Saved records" value={profile.aggregates.savedCount} />
      </div>
      <div className="two-column">
        <section className="panel settings-list">
          <div className="section-heading"><div><h2>Preferences</h2></div></div>
          <div className="setting-row">
            <div><strong>Notifications</strong><span>Listing status and messages</span></div>
            <StatusSwitch enabled={profile.preference.notificationsEnabled} />
          </div>
        </section>
        <section className="panel settings-list">
          <div className="section-heading"><div><h2>Quick links</h2></div></div>
          <Link className="setting-link" to="/app/my-properties"><span>My properties</span><strong>→</strong></Link>
          <Link className="setting-link" to="/app/notifications"><span>Notifications</span><strong>→</strong></Link>
          <Link className="setting-link" to="/app/help"><span>Help center</span><strong>→</strong></Link>
        </section>
      </div>
    </>
  );
}

function StatusSwitch({enabled}: {enabled: boolean}) {
  return <span className={`switch ${enabled ? 'active' : ''}`} aria-label={enabled ? 'Enabled' : 'Disabled'}><i /></span>;
}
