import React from 'react';
import { createRoot } from 'react-dom/client';

import App from './web/app.js';

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
    initContent: content,
    externalLinks: [
      {
        label: 'GreyScript Documentation',
        href: 'https://documentation.greyscript.org'
      },
      {
        label: 'Greybel VS',
        href: 'https://github.com/ayecue/greybel-vs'
      },
      {
        label: 'GreyScript Meta',
        href: 'https://github.com/ayecue/greyscript-meta'
      },
      {
        label: 'greyrepo.xyz',
        href: 'https://www.greyrepo.xyz'
      },
      {
        label: 'Grey Hack TUTORIALS',
        href: 'https://www.youtube.com/@Greyhacktutorials'
      },
      {
        label: 'Grey Hack Gaming',
        href: 'https://www.youtube.com/@greyhackgaming'
      }
    ]
  })
);
