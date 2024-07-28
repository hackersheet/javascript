import React from 'react';

import { HeadingComponentProps } from '../../component-resolvers/heading-component-resolver';

export default function Heading({ HeadingTag, id, children }: HeadingComponentProps) {
  return <HeadingTag id={id}>{children}</HeadingTag>;
}
