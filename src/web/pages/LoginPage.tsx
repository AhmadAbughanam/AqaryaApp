import {useEffect} from 'react';
import {Navigate, useNavigate} from 'react-router-dom';
import {AppImages} from '../../assets/images';
import {useLanguage} from '../../i18n';
import {useAuth} from '../../store/AuthContext';

const TEXT = {
  en: {
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
  },
  ar: {
    orientation:
      'طبقة رقمية للثقة والتشغيل للعقار في الأردن — التحقق أولاً، ثم النشر والتعاقد.',
    heading: 'اختر طريقة الدخول',
    subheading: 'هذه نسخة عرض تجريبية. لا حاجة لكلمة مرور.',
    sanad: 'الدخول عبر سند',
    sanadNote: 'ادخل كمواطن باستخدام هويتك الرقمية في سند.',
    admin: 'دخول المشرف',
    adminNote: 'افتح لوحة العمليات الحكومية.',
    footer:
      'يرتبط عقاريا بهوية سند ودائرة الأراضي والمساحة عبر تكاملات مصرّح بها. ويبقى السجل الرسمي هو المرجع القانوني.',
  },
} as const;

export function LoginPage() {
  const {role, signIn} = useAuth();
  const {language, setLanguage} = useLanguage();
  const navigate = useNavigate();
  const text = TEXT[language];

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
        <div className="auth-lang">
          <button
            className={language === 'en' ? 'auth-lang__pill is-active' : 'auth-lang__pill'}
            onClick={() => setLanguage('en')}
            type="button">
            EN
          </button>
          <button
            className={language === 'ar' ? 'auth-lang__pill is-active' : 'auth-lang__pill'}
            onClick={() => setLanguage('ar')}
            type="button">
            AR
          </button>
        </div>

        <p className="auth-wordmark">Aqarya&nbsp;&nbsp;|&nbsp;&nbsp;عقاريا</p>
        <p className="auth-orientation">{text.orientation}</p>

        <div className="auth-card">
          <h1>{text.heading}</h1>
          <p className="auth-card__sub">{text.subheading}</p>

          <button
            className="auth-btn auth-btn--primary"
            onClick={() => enterAs('citizen')}
            type="button">
            <span>{text.sanad}</span>
            <img src={AppImages.logos.sanad} alt="SANAD" />
          </button>
          <p className="auth-btn__note">{text.sanadNote}</p>

          <button
            className="auth-btn auth-btn--ghost"
            onClick={() => enterAs('admin')}
            type="button">
            {text.admin}
          </button>
          <p className="auth-btn__note">{text.adminNote}</p>

          <p className="auth-card__footer">{text.footer}</p>
        </div>
      </div>
    </div>
  );
}
