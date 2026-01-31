import React, { JSX } from 'react';
import { FaTerminal, FaReact } from 'react-icons/fa6';
import { HiCodeBracket } from 'react-icons/hi2';
import {
  SiTypescript,
  SiTerraform,
  SiMarkdown,
  SiPhp,
  SiRuby,
  SiYaml,
  SiJavascript,
  SiPython,
  SiKotlin,
  SiGo,
  SiRust,
} from 'react-icons/si';
import { TbTxt } from 'react-icons/tb';
import { VscJson } from 'react-icons/vsc';

/**
 * Props for the CodeBlockIcon component.
 */
export type CodeBlockIconProps = {
  /**
   * Language identifier used for icon selection (lowercase recommended).
   * Examples: 'typescript', 'bash', 'json'
   */
  language: string;
};

/**
 * A component that returns an icon corresponding to the specified programming language.
 *
 * Maps common language identifiers to appropriate icons from react-icons.
 * Falls back to a generic code bracket icon for unrecognized languages.
 *
 * @example
 * ```tsx
 * <CodeBlockIcon language="typescript" />
 * ```
 *
 * @remarks
 * Supported languages include (non-exhaustive):
 * - 'bash' | 'sh' - Terminal icon
 * - 'typescript' - TypeScript icon
 * - 'tsx' - React icon
 * - 'json' - JSON icon
 * - 'markdown' - Markdown icon
 * - 'hcl' - Terraform icon
 * - 'php', 'ruby', 'yaml', 'text', etc.
 *
 * @param props - The component props
 * @param props.language - Lowercase language name for icon selection
 * @returns JSX element containing the selected icon
 */
export default function CodeBlockIcon({ language }: CodeBlockIconProps): JSX.Element {
  switch (language) {
    case 'sh':
    case 'bash':
      return <FaTerminal />;
    case 'js':
    case 'javascript':
      return <SiJavascript />;
    case 'py':
    case 'python':
      return <SiPython />;
    case 'kotlin':
      return <SiKotlin />;
    case 'go':
      return <SiGo />;
    case 'rust':
      return <SiRust />;
    case 'hcl':
      return <SiTerraform />;
    case 'typescript':
      return <SiTypescript />;
    case 'tsx':
      return <FaReact />;
    case 'markdown':
      return <SiMarkdown />;
    case 'php':
      return <SiPhp />;
    case 'ruby':
      return <SiRuby />;
    case 'yaml':
      return <SiYaml />;
    case 'json':
      return <VscJson />;
    case 'text':
      return <TbTxt />;
    default:
      return <HiCodeBracket />;
  }
}
