import React from 'react';

import { AppExternalLink } from './app/common/external-links';
import { Root, RootWithId } from './app/root';

export interface AppOptions {
  externalLinks: AppExternalLink[];
}

export default function (options: AppOptions) {
  const urlSearchParams = new URLSearchParams(location.search);
  const getContent = () => {
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

    if (!content) {
      content = localStorage.getItem('ide-content') || 'print("Hello world")';
    }

    return content;
  };
  const id = urlSearchParams.get('id');

  if (id) {
    return (
      <RootWithId
        id={id}
        initContent={getContent()}
        externalLinks={options.externalLinks}
      />
    );
  }

  return (
    <Root initContent={getContent()} externalLinks={options.externalLinks} />
  );
}
