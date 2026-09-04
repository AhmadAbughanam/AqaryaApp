import {NavLink, Outlet} from 'react-router-dom';
import {AppImages} from '../assets/images';
import {useAuth} from '../store/AuthContext';
import {copy} from './copy';

const citizenItems = [
  {to: '/app', key: 'home', icon: '⌂', end: true},
  {to: '/app/map', key: 'map', icon: '⌖'},
  {to: '/app/my-properties', key: 'properties', icon: '▦'},
  {to: '/app/messages', key: 'messages', icon: '◌'},
  {to: '/app/profile', key: 'profile', icon: '◎'},
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

export function AppLayout({variant}: {variant: 'citizen' | 'admin'}) {
  const {signOut} = useAuth();

  if (variant === 'citizen') {
    return (
      <div className="mobile-shell">
        <header className="mobile-topbar">
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
        </header>
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
              <span aria-hidden="true">{item.icon}</span>
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
