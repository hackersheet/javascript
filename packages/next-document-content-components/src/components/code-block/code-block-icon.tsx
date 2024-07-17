import React from 'react';
import { FaTerminal, FaReact } from 'react-icons/fa6';
import { HiCodeBracket } from 'react-icons/hi2';
import { SiTypescript, SiTerraform, SiMarkdown, SiPhp, SiRuby, SiYaml } from 'react-icons/si';
import { TbTxt } from 'react-icons/tb';
import { VscJson } from 'react-icons/vsc';

export interface CodeBlockIconProps {
  language: string;
}

export default function CodeBlockIcon({ language }: CodeBlockIconProps) {
  switch (language) {
    case 'sh':
    case 'bash':
      return <FaTerminal />;
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
