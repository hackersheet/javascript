import React, { MouseEventHandler, PropsWithChildren } from 'react';

/**
 * Props for the Button component
 * @property onClick - Click event handler
 * @property type - HTML button type attribute
 * @property children - Button content/label
 */
export type ButtonProps = {
  onClick?: MouseEventHandler<HTMLButtonElement>;
  type?: 'button' | 'submit' | 'reset';
} & PropsWithChildren;

/**
 * A styled button component for the shogi player interface
 *
 * @component
 * @param props - Component props
 * @returns A button element with consistent styling
 *
 * @example
 * ```tsx
 * <Button onClick={handleClick} type="button">
 *   Click me
 * </Button>
 * ```
 */
export default function Button({ children, onClick, type = 'button' }: ButtonProps) {
  return (
    <button
      type={type}
      className="border-2 text-xs text-black p-2 border-black rounded-lg hover:bg-amber-100 cursor-pointer"
      onClick={onClick}
    >
      {children}
    </button>
  );
}
