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
 * CodeBlockIcon コンポーネントの props 型定義。
 *
 * `language` プロパティに基づいて、コードブロックに表示する代表的なアイコンを返します。
 * 小文字の言語識別子（例: `"typescript"`, `"bash"`, `"json"`, `"markdown"`）を想定しています。
 * 未知の値やサポート外の値は汎用のコードアイコンにフォールバックします。
 */
export type CodeBlockIconProps = {
  /**
   * アイコン選択に用いる言語識別子（小文字推奨）。例: 'typescript', 'bash', 'json'
   */
  language: string;
};

/**
 * 指定された言語に対応するアイコンを返すコンポーネント。
 *
 * 共通の言語識別子を `react-icons` のアイコンにマッピングします。
 * 認識できない言語は汎用の括弧（コード）アイコンに置き換わります。
 *
 * 使用例:
 *
 * ```tsx
 * <CodeBlockIcon language="typescript" />
 * ```
 *
 * サポート例（非網羅）:
 * - 'bash' | 'sh' -> ターミナルアイコン
 * - 'typescript' -> TypeScript アイコン
 * - 'tsx' -> React アイコン
 * - 'json' -> JSON アイコン
 * - 'markdown' -> Markdown アイコン
 * - 'hcl' -> Terraform アイコン
 * - 'php', 'ruby', 'yaml', 'text' など
 *
 * @param props.language アイコン選択に用いる小文字の言語名
 * @returns 選択されたアイコンを含む JSX 要素
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
