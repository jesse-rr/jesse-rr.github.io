export type EntryCategory = 'Project' | 'Idea' | 'Undefined';

export interface Entry {
  id: string;
  title: string;
  category: EntryCategory;
  tags?: string[];
  route?: string;
}
