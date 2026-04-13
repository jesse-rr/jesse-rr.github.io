export type EntryCategory = 'Project' | 'File' | 'Undefined';

export interface Entry {
  id: string;
  title: string;
  category: EntryCategory;
  tags?: string[];
  route?: string;
  content?: EntryContent
}

export interface EntryContent {
  link?: String;
  image?: String;
  readMe?: String;
  extra?: String;
}
