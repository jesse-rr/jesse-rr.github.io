export type GamerGenre =
  | 'RPG'
  | 'Action'
  | 'Strategy'
  | 'Puzzle'
  | 'Platformer'
  | 'Roguelike'
  | 'Visual Novel'
  | 'Horror'
  | 'Cozy';

export type QuestionPhase = 'profile' | 'deep_dive';

export interface Option {
  text: string;
  points: Partial<Record<GamerGenre, number>>;
  detail?: string; // Qualitative details
}

export interface Question {
  id: string;
  text: string;
  phase: QuestionPhase;
  genreId?: GamerGenre; // Only populated if this is a deep dive question for a specific genre
  options: Option[];
}

export interface GenreCombination {
  name: string;
  description: string;
  games: { name: string; desc: string }[];
}

export interface GamerProfile {
  archetype: string;
  archetypeDescription: string;
  topGenres: {
    genre: GamerGenre;
    score: number;
    why: string[];
  }[];
  scores: Record<GamerGenre, number>;
  combination: GenreCombination;
}

export interface TasteState {
  phase: 'welcome' | 'questions' | 'results';
  currentStep: number;
  answers: Record<string, number[]>; // maps questionId -> list of option indices in ranked order (e.g. [2, 0, 1])
  candidateGenres: GamerGenre[];
  profile: GamerProfile | null;
}
