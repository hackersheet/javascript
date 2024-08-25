export type Tag = {
  id: string;
  name: string;
  documentCount: number;
  documentCountInPublished: number;
  documentCountInDraft: number;
  relatedTags: RelatedTagList;
};

export type TagListItem = {
  id: string;
  name: string;
  documentCount: number;
  documentCountInPublished: number;
  documentCountInDraft: number;
};

export type TagList = TagListItem[];

export type RelatedTagListItem = {
  id: string;
  name: string;
  documentCount: number;
  documentCountInPublished: number;
  documentCountInDraft: number;
};

export type RelatedTagList = RelatedTagListItem[];
