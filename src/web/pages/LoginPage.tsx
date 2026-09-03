import {useEffect} from 'react';
import {Navigate, useNavigate} from 'react-router-dom';
import {AppImages} from '../../assets/images';
import {useAuth} from '../../store/AuthContext';

const TEXT = {
  orientation:
    'A digital trust and operations layer for property in Jordan — verify first, then publish and contract.',
  heading: 'Choose how to enter',
  subheading: 'This is a demonstration build. No password is required.',
  sanad: 'Login with SANAD',
  sanadNote: 'Enter as a citizen using your SANAD digital identity.',
  admin: 'Admin access',
  adminNote: 'Open the government operations console.',
  footer:
    'Aqarya links to SANAD identity and the Department of Lands and Survey through authorised integrations. The land registry stays authoritative.',
};

export function LoginPage() {
  const {role, signIn} = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    document.title = 'Sign in | Aqarya';
  }, []);

  if (role) {
    return <Navigate replace to={role === 'admin' ? '/admin' : '/app'} />;
  }

  function enterAs(nextRole: 'citizen' | 'admin') {
    signIn(nextRole);
    navigate(nextRole === 'admin' ? '/admin' : '/app', {replace: true});
  }

  return (
    <div className="auth-screen">
      <img
        aria-hidden="true"
        className="auth-screen__map"
        src={AppImages.backgrounds.jordanMap}
        alt=""
      />
      <div className="auth-screen__inner">
        <p className="auth-wordmark">Aqarya</p>
        <p className="auth-orientation">{TEXT.orientation}</p>

        <div className="auth-card">
          <h1>{TEXT.heading}</h1>
          <p className="auth-card__sub">{TEXT.subheading}</p>

          <button
            className="auth-btn auth-btn--primary"
            onClick={() => enterAs('citizen')}
            type="button">
            <span>{TEXT.sanad}</span>
            <img src={AppImages.logos.sanad} alt="SANAD" />
          </button>
          <p className="auth-btn__note">{TEXT.sanadNote}</p>

          <button
            className="auth-btn auth-btn--ghost"
            onClick={() => enterAs('admin')}
            type="button">
            {TEXT.admin}
          </button>
          <p className="auth-btn__note">{TEXT.adminNote}</p>

          <p className="auth-card__footer">{TEXT.footer}</p>
        </div>
      </div>
    </div>
  );
}
