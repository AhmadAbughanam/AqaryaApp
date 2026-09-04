import {NavLink, Outlet, useLocation} from 'react-router-dom';
import {AppImages} from '../assets/images';
import {useAuth} from '../store/AuthContext';
import {copy} from './copy';

const citizenItems = [
  {to: '/app', key: 'home', icon: 'home', end: true},
  {to: '/app/map', key: 'map', icon: 'map'},
  {to: '/app/my-properties', key: 'properties', icon: 'properties'},
  {to: '/app/messages', key: 'messages', icon: 'messages'},
  {to: '/app/profile', key: 'profile', icon: 'profile'},
] as const;

const adminItems = [
  {to: '/admin', key: 'dashboard', icon: '⌂', end: true},
  {to: '/admin/properties', key: 'properties', icon: '▤'},
  {to: '/admin/investments', key: 'investments', icon: '◫'},
  {to: '/admin/users', key: 'users', icon: '◎'},
  {to: '/admin/moderation', key: 'moderation', icon: '⚑'},
  {to: '/admin/content', key: 'content', icon: '✎'},
  {to: '/admin/audit', key: 'audit', icon: '≡'},
  {to: '/admin/analytics', key: 'analytics', icon: '↗'},
] as const;

function CitizenIcon({name}: {name: (typeof citizenItems)[number]['icon']}) {
  const line = {
    fill: 'none',
    stroke: 'currentColor',
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    strokeWidth: 1.7,
  };
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      {name === 'home' ? <><path {...line} d="m3 11 9-7 9 7" /><path {...line} d="M5.5 9.5V20h13V9.5M9.5 20v-6h5v6" /></> : null}
      {name === 'map' ? <><path {...line} d="m3 6 5-2 8 3 5-2v13l-5 2-8-3-5 2V6Z" /><path {...line} d="M8 4v13M16 7v13" /><circle cx="12" cy="11" fill="currentColor" r="1.6" /></> : null}
      {name === 'properties' ? <><rect {...line} x="3.5" y="3.5" width="7" height="7" rx="1" /><rect {...line} x="13.5" y="3.5" width="7" height="7" rx="1" /><rect {...line} x="3.5" y="13.5" width="7" height="7" rx="1" /><rect {...line} x="13.5" y="13.5" width="7" height="7" rx="1" /></> : null}
      {name === 'messages' ? <path {...line} d="M20 15.5a3 3 0 0 1-3 3H9l-5 2v-14a3 3 0 0 1 3-3h10a3 3 0 0 1 3 3v9Z" /> : null}
      {name === 'profile' ? <><circle {...line} cx="12" cy="8" r="3.5" /><path {...line} d="M5 20c.5-4 2.8-6 7-6s6.5 2 7 6" /></> : null}
    </svg>
  );
}

export function AppLayout({variant}: {variant: 'citizen' | 'admin'}) {
  const {signOut} = useAuth();
  const location = useLocation();

  if (variant === 'citizen') {
    const mapIsImmersive = location.pathname === '/app/map';
    const portfolioIsWide = location.pathname === '/app/my-properties';
    const messagesIsWide = location.pathname.startsWith('/app/messages');
    const shellClass = mapIsImmersive
      ? 'mobile-shell mobile-shell--map'
      : portfolioIsWide
        ? 'mobile-shell mobile-shell--portfolio'
        : messagesIsWide
          ? 'mobile-shell mobile-shell--messages'
          : 'mobile-shell';
    return (
      <div className={shellClass}>
        {!mapIsImmersive ? <header className="mobile-topbar">
          <NavLink aria-label="Aqarya home" className="mobile-brand-link" end to="/app">
            <span aria-hidden="true" className="mobile-brand-mark">A</span>
            <span className="mobile-wordmark">Aqarya</span>
          </NavLink>
          <nav aria-label="Account actions" className="mobile-topbar__actions">
            <NavLink
              aria-label="Notifications"
              className={({isActive}) => (isActive ? 'icon-button is-active' : 'icon-button')}
              title="Notifications"
              to="/app/notifications">
              <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
                <path
                  d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 0 1-3.4 0"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.7"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </NavLink>
            <button
              aria-label={copy.signOut}
              className="icon-button icon-button--signout"
              onClick={signOut}
              title={copy.signOut}
              type="button">
              <svg viewBox="0 0 24 24" width="19" height="19" aria-hidden="true">
                <path
                  d="M10 5H6.8A1.8 1.8 0 0 0 5 6.8v10.4A1.8 1.8 0 0 0 6.8 19H10m4-3 4-4-4-4m4 4H9"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.7"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </nav>
        </header> : null}
        <main className="mobile-main">
          <Outlet />
        </main>
        <nav className="mobile-tabbar" aria-label="Primary navigation">
          {citizenItems.map(item => (
            <NavLink
              className={({isActive}) => (isActive ? 'mobile-tab active' : 'mobile-tab')}
              end={'end' in item ? item.end : false}
              key={item.to}
              to={item.to}>
              <span><CitizenIcon name={item.icon} /></span>
              {copy.citizenNav[item.key]}
            </NavLink>
          ))}
        </nav>
      </div>
    );
  }

  return (
    <div className="app-shell app-shell--admin">
      <aside className="sidebar">
        <div className="brand">
          <img src={AppImages.logos.aqarya} alt="Aqarya" />
          <div>
            <strong>Aqarya</strong>
            <span>Government operations</span>
          </div>
        </div>
        <nav aria-label="Primary navigation">
          {adminItems.map(item => (
            <NavLink
              className={({isActive}) => (isActive ? 'nav-link active' : 'nav-link')}
              end={'end' in item ? item.end : false}
              key={item.to}
              to={item.to}>
              <span aria-hidden="true">{item.icon}</span>
              {copy.adminNav[item.key]}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar__footer">
          <button className="text-button" onClick={signOut} type="button">
            {copy.signOut}
          </button>
        </div>
      </aside>
      <main className="app-main">
        <Outlet />
      </main>
    </div>
  );
}
