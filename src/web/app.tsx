import React from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';

import { AppExternalLink } from './app/common/external-links';
import Root from './app/root';

export interface AppOptions {
  initContent?: string;
  externalLinks: AppExternalLink[];
}

export default function (options: AppOptions) {
  const initContent =
    options.initContent ||
    localStorage.getItem('ide-content') ||
    'print("Hello world")';

  return (
    <Root initContent={initContent} externalLinks={options.externalLinks} />
  );
  /*
  return (
    <>
      <BrowserRouter>
        <Routes>
          <Route path="*">
            <Route index element={<Root initContent={options.initContent} externalLinks={options.externalLinks} />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </>
  ); */
}
