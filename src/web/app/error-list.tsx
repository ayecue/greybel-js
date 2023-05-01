import React from 'react';

export interface ErrorEntry {
  id: string;
  msg: string;
  onClick: () => void;
}

export interface ErrorsOptions {
  errors: ErrorEntry[];
}

export default function ErrorList({ errors }: ErrorsOptions) {
  return (
    <div id="editor-errors">
      {errors.map(({ id, msg, onClick }) => {
        return (
          <ul key={id} onClick={() => onClick()}>
            {msg.split('\n').map((item, index) => {
              return <li key={index}>{item}</li>
            })}
          </ul>
        );
      })}
    </div>
  );
}