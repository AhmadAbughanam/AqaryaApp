import {useEffect} from 'react';
import {Navigate, useNavigate} from 'react-router-dom';
import {AppImages} from '../../assets/images';
import {useAuth} from '../../store/AuthContext';

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

        <div className="auth-lead">
          <h1>The digital land record for Jordan.</h1>
          <p>Verify · Publish · Contract</p>
        </div>

        <div className="auth-card">
          <span className="eyebrow">Choose how to enter</span>

          <button
            className="auth-btn auth-btn--primary"
            onClick={() => enterAs('citizen')}
            type="button">
            <span>Login with SANAD</span>
            <img src={AppImages.logos.sanad} alt="SANAD" />
          </button>
          <p className="auth-btn__note">Continue as a citizen.</p>

          <button
            className="auth-btn auth-btn--ghost"
            onClick={() => enterAs('admin')}
            type="button">
            Admin access
          </button>
          <p className="auth-btn__note">Government operations console.</p>
        </div>
      </div>
    </div>
  );
}
