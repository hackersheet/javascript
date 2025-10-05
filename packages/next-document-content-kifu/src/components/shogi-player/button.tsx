import React, { MouseEventHandler, PropsWithChildren } from 'react';

export type ButtonProps = {
  onClick?: MouseEventHandler<HTMLButtonElement>;
} & PropsWithChildren;

export default function Button({ children, onClick }: ButtonProps) {
  return (
    <button
      className="border-2 text-black p-2 border-black rounded-lg hover:bg-amber-100 cursor-pointer"
      onClick={onClick}
    >
      {children}
    </button>
  );
}
