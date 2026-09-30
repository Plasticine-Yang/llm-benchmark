import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';

import './styles/fonts.css';
import './styles/tokens.css';
import './styles/base.css';
import './styles/nav.css';
import './styles/hero.css';
import './styles/sections.css';
import './styles/footer.css';
import './styles/panel.css';
import './styles/story.css';

const container = document.getElementById('root');
if (!container) throw new Error('Root container #root was not found');

createRoot(container).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
