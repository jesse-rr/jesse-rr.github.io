export type ProjectCategory = 'Project' | 'File' | 'Idea' | 'Undefined';

export interface Project {
  id: string;
  title: string;
  category: ProjectCategory;
  tags?: string[];
  readmePath?: string;
  content?: string;
}
