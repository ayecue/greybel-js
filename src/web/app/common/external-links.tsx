import React, { useState } from 'react';

export interface AppExternalLink {
  label: string;
  href: string;
}

export interface ExternalLinksProps {
  externalLinks: AppExternalLink[];
  maxLinks?: number;
  className?: string;
}

export default function ExternalLinks({
  externalLinks,
  className,
  maxLinks = 2
}: ExternalLinksProps) {
  if (externalLinks.length <= maxLinks) {
    return (
      <ul className={className}>
        {externalLinks.map((externalLink: AppExternalLink, index) => {
          return (
            <li key={index} className="external-links">
              <a href={externalLink.href} target="_blank">
                {externalLink.label}
              </a>
            </li>
          );
        })}
      </ul>
    );
  }

  const [fullView, setFullView] = useState(false);

  if (fullView) {
    return (
      <ul className={className}>
        {externalLinks.map((externalLink: AppExternalLink, index) => {
          return (
            <li key={index} className="external-links">
              <a href={externalLink.href} target="_blank">
                {externalLink.label}
              </a>
            </li>
          );
        })}
        <li className="collapse" onClick={() => setFullView(false)}>
          less
        </li>
      </ul>
    );
  }

  return (
    <ul className={className}>
      {externalLinks
        .slice(0, maxLinks)
        .map((externalLink: AppExternalLink, index) => {
          return (
            <li key={index} className="external-links">
              <a href={externalLink.href} target="_blank">
                {externalLink.label}
              </a>
            </li>
          );
        })}
      <li className="collapse" onClick={() => setFullView(true)}>
        more
      </li>
    </ul>
  );
}
