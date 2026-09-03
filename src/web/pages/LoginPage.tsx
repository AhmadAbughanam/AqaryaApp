import {useEffect, useState, type FormEvent} from 'react';
import {Navigate} from 'react-router-dom';
import {login} from '../../api/auth';
import {AppImages} from '../../assets/images';
import {useLanguage} from '../../i18n';
import {useAuth} from '../../store/AuthContext';

const USERNAME_KEY = 'aqarya.login.username';

export function LoginPage() {
  const {token, role, signIn} = useAuth();
  const {language, setLanguage} = useLanguage();
  const [username, setUsername] = useState(() => localStorage.getItem(USERNAME_KEY) || '');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(Boolean(localStorage.getItem(USERNAME_KEY)));
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    document.title = 'Sign in | Aqarya';
  }, []);

  if (token && role) {
    return <Navigate replace to={role === 'admin' ? '/admin' : '/app'} />;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const result = await login({username: username.trim(), password});
      if (remember) localStorage.setItem(USERNAME_KEY, username.trim());
      else localStorage.removeItem(USERNAME_KEY);
      await signIn(result.token, result.role, remember);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Unable to sign in.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="login-page">
      <section className="login-story">
        <img className="login-story__image" src={AppImages.backgrounds.introSplash} alt="Amman skyline" />
        <div className="login-story__overlay" />
        <div className="login-story__content">
          <span className="eyebrow">Jordan's trusted property platform</span>
          <h1>Property decisions with a verified digital record.</h1>
          <p>
            Buy, rent, invest, and manage property through one transparent service,
            with identity-aware workflows and government oversight.
          </p>
          <div className="trust-row">
            <span>✓ Verified listings</span>
            <span>✓ Transparent audit trail</span>
            <span>✓ Bilingual access</span>
          </div>
        </div>
      </section>
      <section className="login-panel">
        <button
          className="language-toggle"
          onClick={() => setLanguage(language === 'en' ? 'ar' : 'en')}
          type="button">
          {language === 'en' ? 'العربية' : 'English'}
        </button>
        <div className="login-card">
          <div className="brand brand--login">
            <img src={AppImages.logos.aqarya} alt="" />
            <div>
              <strong>Aqarya</strong>
              <span>Verified property services</span>
            </div>
          </div>
          <div className="login-card__heading">
            <span className="eyebrow">Secure access</span>
            <h2>Welcome back</h2>
            <p>Sign in to continue to your property workspace.</p>
          </div>
          <form onSubmit={handleSubmit}>
            <label>
              Username
              <input
                autoComplete="username"
                autoFocus
                onChange={event => setUsername(event.target.value)}
                placeholder="Enter your username"
                required
                value={username}
              />
            </label>
            <label>
              Password
              <input
                autoComplete="current-password"
                minLength={6}
                onChange={event => setPassword(event.target.value)}
                placeholder="Enter your password"
                required
                type="password"
                value={password}
              />
            </label>
            <label className="checkbox-row">
              <input
                checked={remember}
                onChange={event => setRemember(event.target.checked)}
                type="checkbox"
              />
              Keep me signed in on this device
            </label>
            {error ? <div className="inline-alert" role="alert">{error}</div> : null}
            <button className="button button--primary button--wide" disabled={submitting} type="submit">
              {submitting ? 'Signing in…' : 'Sign in securely'}
            </button>
          </form>
          <p className="login-card__note">
            Aqarya uses SANAD-style identity and DLS-style verification workflows.
          </p>
        </div>
      </section>
    </div>
  );
}
