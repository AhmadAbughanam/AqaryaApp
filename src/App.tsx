import {lazy, Suspense} from 'react';
import {Navigate, Outlet, Route, Routes} from 'react-router-dom';
import type {UserRole} from './api/auth';
import {useAuth} from './store/AuthContext';
import {AppLayout} from './web/Layout';
import {LandingPage} from './web/pages/LandingPage';
import {LoginPage} from './web/pages/LoginPage';
import {DiscoverPage} from './web/pages/DiscoverPage';
import {MessagesPage} from './web/pages/MessagesPage';
import {MyPropertiesPage} from './web/pages/MyPropertiesPage';
import {NotificationsPage} from './web/pages/NotificationsPage';
import {ProfilePage} from './web/pages/ProfilePage';
import {PropertyDetailPage} from './web/pages/PropertyDetailPage';
import {OfferPage} from './web/pages/OfferPage';
import {SellPropertyPage} from './web/pages/SellPropertyPage';
import {HelpPage} from './web/pages/HelpPage';
import {
  AdminAnalyticsPage,
  AdminAuditPage,
  AdminContentPage,
  AdminDashboardPage,
  AdminInvestmentDetailPage,
  AdminInvestmentsPage,
  AdminModerationDetailPage,
  AdminModerationPage,
  AdminPropertiesPage,
  AdminPropertyDetailPage,
  AdminUserDetailPage,
  AdminUsersPage,
} from './web/pages/AdminPages';

const MapPage = lazy(() =>
  import('./web/pages/MapPage').then(module => ({default: module.MapPage})),
);

function RequireRole({role}: {role: UserRole}) {
  const auth = useAuth();
  if (!auth.role) return <Navigate replace to="/login" />;
  if (auth.role !== role) return <Navigate replace to={auth.role === 'admin' ? '/admin' : '/app'} />;
  return <Outlet />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route element={<RequireRole role="citizen" />}>
        <Route path="/app" element={<AppLayout variant="citizen" />}>
          <Route index element={<DiscoverPage />} />
          <Route
            path="map"
            element={
              <Suspense fallback={<div aria-label="Loading map" className="map-route-loading"><span /></div>}>
                <MapPage />
              </Suspense>
            }
          />
          <Route path="property/:id" element={<PropertyDetailPage />} />
          <Route path="property/:id/offer" element={<OfferPage />} />
          <Route path="my-properties" element={<MyPropertiesPage />} />
          <Route path="sell" element={<SellPropertyPage />} />
          <Route path="messages" element={<MessagesPage />} />
          <Route path="messages/:threadId" element={<MessagesPage />} />
          <Route path="notifications" element={<NotificationsPage />} />
          <Route path="profile" element={<ProfilePage />} />
          <Route path="help" element={<HelpPage />} />
        </Route>
      </Route>
      <Route element={<RequireRole role="admin" />}>
        <Route path="/admin" element={<AppLayout variant="admin" />}>
          <Route index element={<AdminDashboardPage />} />
          <Route path="properties" element={<AdminPropertiesPage />} />
          <Route path="properties/:id" element={<AdminPropertyDetailPage />} />
          <Route path="investments" element={<AdminInvestmentsPage />} />
          <Route path="investments/:id" element={<AdminInvestmentDetailPage />} />
          <Route path="users" element={<AdminUsersPage />} />
          <Route path="users/:id" element={<AdminUserDetailPage />} />
          <Route path="moderation" element={<AdminModerationPage />} />
          <Route path="moderation/:id" element={<AdminModerationDetailPage />} />
          <Route path="content" element={<AdminContentPage />} />
          <Route path="audit" element={<AdminAuditPage />} />
          <Route path="analytics" element={<AdminAnalyticsPage />} />
        </Route>
      </Route>
      <Route path="*" element={<div className="not-found"><span>404</span><h1>Page not found</h1><a href="/">Return to Aqarya</a></div>} />
    </Routes>
  );
}
