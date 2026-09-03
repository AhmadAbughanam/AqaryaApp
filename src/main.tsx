import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import {BrowserRouter} from 'react-router-dom';
import App from './App';
import {LanguageProvider} from './i18n';
import {AuthProvider} from './store/AuthContext';
import './styles.css';

const root = document.getElementById('root');
if (!root) throw new Error('Root element was not found.');

createRoot(root).render(
  <StrictMode>
    <BrowserRouter>
      <LanguageProvider>
        <AuthProvider>
          <App />
        </AuthProvider>
      </LanguageProvider>
    </BrowserRouter>
  </StrictMode>,
);
