import {NavLink, Outlet} from 'react-router-dom';
import {AppImages} from '../assets/images';
import {useAuth} from '../store/AuthContext';
import {useLanguage} from '../i18n';
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
  const {language, setLanguage} = useLanguage();
  const text = copy[language];

  if (variant === 'citizen') {
    return (
      <div className="mobile-shell">
        <header className="mobile-topbar">
          <span className="mobile-wordmark">Aqarya</span>
          <div className="mobile-topbar__actions">
            <button
              className="text-button"
              onClick={() => setLanguage(language === 'en' ? 'ar' : 'en')}
              type="button">
              {text.language}
            </button>
            <button className="text-button" onClick={signOut} type="button">
              {text.signOut}
            </button>
          </div>
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
              {text.citizenNav[item.key]}
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
              {text.adminNav[item.key]}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar__footer">
          <button
            className="text-button"
            onClick={() => setLanguage(language === 'en' ? 'ar' : 'en')}
            type="button">
            {text.language}
          </button>
          <button className="text-button" onClick={signOut} type="button">
            {text.signOut}
          </button>
        </div>
      </aside>
      <main className="app-main">
        <Outlet />
      </main>
    </div>
  );
}
