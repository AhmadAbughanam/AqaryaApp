import {useEffect} from 'react';
import {Navigate, useNavigate} from 'react-router-dom';
import {AppImages} from '../../assets/images';
import {useAuth} from '../../store/AuthContext';

const TEXT = {
  heading: 'Choose how to enter',
  sanad: 'Login with SANAD',
  sanadNote: 'Continue as a citizen.',
  admin: 'Admin access',
  adminNote: 'Government operations console.',
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

        <div className="auth-card">
          <h1>{TEXT.heading}</h1>

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
        </div>
      </div>
    </div>
  );
}
