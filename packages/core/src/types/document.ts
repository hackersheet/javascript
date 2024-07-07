export type DocumentList = DocumentListItem[];

export type DocumentListItem = {
  id: string;
  slug: string;
  emoji: string;
  title: string;
  draft: boolean;
  path?: string | null;
  publishedAt: string;
  modifiedAt: string;
  tags: Tag[];
  preview?: Preview | null;
};

export type Document = {
  id: string;
  slug: string;
  emoji: string;
  title: string;
  draft: boolean;
  content: string;
  path?: string | null;
  publishedAt: string;
  modifiedAt: string;
  tags: Tag[];
  assets: Asset[];
  outboundLinkDocuments: DocumentListItem[];
  inboundLinkDocuments: DocumentListItem[];
  websites: Website[];
  preview?: Preview | null;
};

type Website = {
  id: string;
  url: string;
  domain: string;
  title: string;
  description: string;
  ogSiteName: string;
  ogTitle: string;
  ogType: string;
  ogUrl: string;
  ogImage?: OgImage | null;
  ogDescription: string;
  ogLocale: string;
};

type OgImage = {
  id: string;
  fileUrl?: string | null;
  height: number;
  width: number;
};

type Preview = {
  id: string;
  width: number;
  height: number;
  path?: string | null;
  fileUrl: string;
};

export type Tag = {
  id: string;
  name: string;
};

type Asset = {
  id: string;
  path?: string | null;
  name: string;
  fileUrl: string;
  height: number;
  width: number;
};
