import React from 'react';

export interface ErrorEntry {
  id: string;
  msg: string;
  onClick: () => void;
}

interface ErrorsOptions {
  errors: ErrorEntry[];
}

export default function ErrorList({ errors }: ErrorsOptions) {
  return (
    <div id="editor-errors">
      {errors.map(({ id, msg, onClick }) => {
        return (
          <div key={id} onClick={() => onClick()}>
            {msg}
          </div>
        );
      })}
    </div>
  );
}