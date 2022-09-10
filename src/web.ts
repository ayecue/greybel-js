import React from 'react';
import { createRoot } from 'react-dom/client';

import App from './web/app';

const urlSearchParams = new URLSearchParams(location.search);
let content = urlSearchParams.get('c') || undefined;

if (content) {
  try {
    const decoded = decodeURIComponent(content);
    content = decodeURIComponent(atob(decoded));
  } catch (err: any) {
    content = undefined;
    console.error(err);
  }
}

const root = createRoot(document.querySelector('#container')!);
root.render(
  React.createElement(App, {
    initContent: content
  })
);