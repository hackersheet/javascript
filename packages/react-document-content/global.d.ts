import 'react';
import { ReactNode } from 'react';
import { ExtraProps } from 'react-markdown';

type DirectiveProps = { children?: ReactNode } & ExtraProps;

declare module 'react' {
  namespace JSX {
    interface IntrinsicElements {
      'kifu-to': DirectiveProps;
      'link-card': DirectiveProps;
      'x-post': DirectiveProps;
      youtube: DirectiveProps;
      gist: DirectiveProps;
    }
  }
}
