import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { LazyMotion, MotionConfig, domMax } from 'motion/react';
import '@fontsource-variable/alexandria';
import App from './App.jsx';
import { GooeyToaster } from 'goey-toast';
import 'goey-toast/styles.css';
import './styles.css';

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {/* domMax: layout animations (nav pill, switch). reducedMotion="user": transforms switch off, opacity stays. */}
    <LazyMotion features={domMax}>
      <MotionConfig reducedMotion="user">
        <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <App />
          <GooeyToaster
            position="top-center"
            offset="20px"
            duration={4000}
            visibleToasts={3}
            dir="rtl"
            theme="light"
            preset="subtle"
            spring={false}
            showTimestamp={false}
            showProgress
          />
        </BrowserRouter>
      </MotionConfig>
    </LazyMotion>
  </React.StrictMode>,
);
