export type WebsiteListeItem = {
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
  documents: Document[];
};

type OgImage = {
  id: string;
  fileUrl?: string | null;
  height: number;
  width: number;
};

type Document = {
  id: string;
  draft: boolean;
  title: string;
  slug: string;
};
