import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HeaderComponent } from '../header/header.component';
import { GamerGenre, Question, TasteState, GamerProfile, Option, GenreCombination } from '../../models/taste.model';
import { GoogleAuthService } from '../../music/services/google-auth.service';

@Component({
  selector: 'app-understand',
  imports: [CommonModule, FormsModule, HeaderComponent],
  templateUrl: './understand.component.html',
  styleUrl: './understand.component.scss'
})
export class UnderstandComponent implements OnInit {
  // Phase 1 Questions (Broad profiling - 6 detailed questions)
  private readonly profileQuestions: Question[] = [
    {
      id: 'motivation',
      text: 'What is your primary motivation when playing a game?',
      phase: 'profile',
      options: [
        {
          text: 'Immersing myself in a deep story, memorable characters, and lore.',
          points: { RPG: 3, 'Visual Novel': 3, Horror: 1, Cozy: 1 },
          detail: 'narrative immersion and deep storytelling'
        },
        {
          text: 'Testing my reflexes, combat mechanics, and high-intensity play.',
          points: { Action: 3, Roguelike: 2, Platformer: 2, Horror: 1 },
          detail: 'testing your reflexes and high mechanical intensity'
        },
        {
          text: 'Planning, outsmarting complex systems, and managing resources.',
          points: { Strategy: 3, Puzzle: 2 },
          detail: 'strategic planning and system management'
        },
        {
          text: 'Relaxing, creating, and building things at my own pace.',
          points: { Cozy: 3, Puzzle: 1, Platformer: 1 },
          detail: 'relaxed pacing, cozy exploration, and sandbox creation'
        }
      ]
    },
    {
      id: 'challenge',
      text: 'How do you feel about high difficulty, failure, and repetition?',
      phase: 'profile',
      options: [
        {
          text: 'I love the thrill of mastering tough encounters and running trials.',
          points: { Roguelike: 3, Action: 2, Platformer: 2 },
          detail: 'the adrenaline of overcoming high difficulty and failure'
        },
        {
          text: 'I like a moderate challenge that tests my skills without frustration.',
          points: { RPG: 2, Strategy: 2, Puzzle: 2 },
          detail: 'engaging in moderate skill checks and puzzles'
        },
        {
          text: 'I prefer little to no friction; I want to enjoy the atmosphere/story.',
          points: { Cozy: 3, 'Visual Novel': 3, Puzzle: 1 },
          detail: 'smooth, low-friction narrative experiences'
        }
      ]
    },
    {
      id: 'mechanics',
      text: 'What is your stance on story vs. mechanical gameplay?',
      phase: 'profile',
      options: [
        {
          text: 'Story is paramount; I do not mind basic mechanics if the narrative is great.',
          points: { 'Visual Novel': 3, RPG: 2, Horror: 2 },
          detail: 'story-first experiences where choices matter'
        },
        {
          text: 'A balanced mixture; I want engaging gameplay alongside a good plot.',
          points: { RPG: 3, Action: 2, Horror: 2 },
          detail: 'balanced gaming that merges combat and lore'
        },
        {
          text: 'Gameplay is king; I skip cutscenes to get back into the loops.',
          points: { Roguelike: 3, Puzzle: 3, Strategy: 3, Platformer: 2 },
          detail: 'pure mechanics-driven gameplay and systems mastery'
        }
      ]
    },
    {
      id: 'pacing',
      text: 'What kind of game pacing feels most comfortable?',
      phase: 'profile',
      options: [
        {
          text: 'Fast-paced, real-time, requiring instant muscle memory.',
          points: { Action: 3, Platformer: 2, Horror: 1, Roguelike: 1 },
          detail: 'real-time execution and fast reflexes'
        },
        {
          text: 'Turn-based, strategic, allowing me plenty of time to analyze.',
          points: { Strategy: 3, RPG: 2, Puzzle: 2, Cozy: 1 },
          detail: 'deliberate, turn-based thinking and planning'
        },
        {
          text: 'Completely chill and passive; I go at my own absolute tempo.',
          points: { Cozy: 3, 'Visual Novel': 3, Puzzle: 2 },
          detail: 'low-pressure tempos and relaxing loops'
        }
      ]
    },
    {
      id: 'artstyle',
      text: 'What visual art style and atmosphere draws you in the most?',
      phase: 'profile',
      options: [
        {
          text: 'Gritty, realistic, cinematic, and immersive worlds.',
          points: { RPG: 2, Action: 2, Horror: 2 },
          detail: 'photorealistic, cinematic, and gritty worlds'
        },
        {
          text: 'Stylized, vibrant, colorful, or creative graphics.',
          points: { Cozy: 2, Platformer: 2, Puzzle: 1 },
          detail: 'stylized, vibrant, and artistic visual style'
        },
        {
          text: 'Retro, pixel-art, or minimalist designs.',
          points: { Roguelike: 2, Platformer: 2, Puzzle: 2 },
          detail: 'retro, pixel-art, and nostalgic layouts'
        },
        {
          text: 'Dark, eerie, surreal, and atmospheric settings.',
          points: { Horror: 3, RPG: 1, 'Visual Novel': 1 },
          detail: 'eerie, surreal, and dark atmospheric environments'
        }
      ]
    },
    {
      id: 'session',
      text: 'What is your ideal game length and session time?',
      phase: 'profile',
      options: [
        {
          text: 'Short, quick runs that I can stop and start anytime.',
          points: { Roguelike: 3, Puzzle: 2, Platformer: 1 },
          detail: 'quick session loops and high replayability'
        },
        {
          text: 'Massive campaigns that I can sink 50+ hours into.',
          points: { RPG: 3, Strategy: 2 },
          detail: 'highly immersive campaigns that span dozens of hours'
        },
        {
          text: 'Moderate 10-20 hour experiences with a clear beginning and end.',
          points: { 'Visual Novel': 2, Action: 2, Platformer: 2, Horror: 2 },
          detail: 'medium-length stories with a satisfying conclusion'
        },
        {
          text: 'Endless games with no real end point, played over months.',
          points: { Cozy: 3, Strategy: 2 },
          detail: 'open-ended, persistent sandbox structures'
        }
      ]
    }
  ];

  // Deep dive questions database for Phase 2
  private readonly deepDiveQuestionsMap: Record<GamerGenre, Question[]> = {
    RPG: [
      {
        id: 'rpg_style',
        text: 'What drawing point in an RPG is most critical for you?',
        phase: 'deep_dive',
        genreId: 'RPG',
        options: [
          {
            text: 'Meaningful choices that branch the plot and dialogue.',
            points: { RPG: 2, 'Visual Novel': 1 },
            detail: 'making choices that branch the story'
          },
          {
            text: 'Stat optimization, character classes, and build crafting.',
            points: { RPG: 2, Strategy: 1 },
            detail: 'creating complex character build systems'
          },
          {
            text: 'Exploring vast worlds, finding secret areas, and lore.',
            points: { RPG: 2, Platformer: 1 },
            detail: 'exploring wide-open spaces and discovering lore'
          }
        ]
      },
      {
        id: 'rpg_music',
        text: 'How important is the music/soundtrack for your RPG journey?',
        phase: 'deep_dive',
        genreId: 'RPG',
        options: [
          {
            text: 'Crucial! The soundtrack defines the emotional highs of my playthrough.',
            points: { RPG: 1, Cozy: 1 },
            detail: 'immersive musical soundtracks setting the tone'
          },
          {
            text: 'It is a nice addition, but it does not alter my overall enjoyment.',
            points: {},
            detail: 'focusing purely on the mechanical loops'
          }
        ]
      }
    ],
    Action: [
      {
        id: 'action_combat',
        text: 'What style of combat mechanics do you prefer?',
        phase: 'deep_dive',
        genreId: 'Action',
        options: [
          {
            text: 'Rhythm and flow: chaining combos, dodging, and mechanical speed.',
            points: { Action: 2, Platformer: 1 },
            detail: 'chaining fast combos and swift movement'
          },
          {
            text: 'Shooting and spacing: tactical gunplay, cover, or bullet hell.',
            points: { Action: 2, Strategy: 1 },
            detail: 'tactical positioning and shooter mechanics'
          },
          {
            text: 'Heaviness and impact: slow, deliberate swings, parries, and poise.',
            points: { Action: 2, Roguelike: 1 },
            detail: 'deliberate, high-impact combat timing'
          }
        ]
      },
      {
        id: 'action_structure',
        text: 'What environment structure suits your action gameplay best?',
        phase: 'deep_dive',
        genreId: 'Action',
        options: [
          {
            text: 'Linear, highly structured levels with cinematic action set pieces.',
            points: { Action: 2, 'Visual Novel': 1 },
            detail: 'linear paths and cinematic set pieces'
          },
          {
            text: 'Sandbox arenas or open-world zones with high player freedom.',
            points: { Action: 2, Cozy: 1 },
            detail: 'sandbox combat freedom'
          },
          {
            text: 'Procedural dungeons or survival zones where threat is everywhere.',
            points: { Action: 2, Roguelike: 1 },
            detail: 'surviving in randomized threatening zones'
          }
        ]
      }
    ],
    Strategy: [
      {
        id: 'strategy_scale',
        text: 'What scale of management excites you?',
        phase: 'deep_dive',
        genreId: 'Strategy',
        options: [
          {
            text: 'Macro: building cities, managing empire economies, and diplomacy.',
            points: { Strategy: 2, Cozy: 1 },
            detail: 'large-scale macro-economic simulation'
          },
          {
            text: 'Micro: managing individual squad members, positioning, and tactical moves.',
            points: { Strategy: 2, Action: 1 },
            detail: 'fine squad control and positioning'
          },
          {
            text: 'Simulation: managing detail-rich systems (factory assembly, train lines).',
            points: { Strategy: 2, Puzzle: 1 },
            detail: 'optimizing production assemblies and lines'
          }
        ]
      },
      {
        id: 'strategy_play',
        text: 'How do you prefer to play out strategy scenarios?',
        phase: 'deep_dive',
        genreId: 'Strategy',
        options: [
          {
            text: 'Methodical, turn-based systems where I can plan my entire route.',
            points: { Strategy: 2, Puzzle: 1 },
            detail: 'methodical turn-based tactical planning'
          },
          {
            text: 'Real-time situations where speed of action and fast thinking are tested.',
            points: { Strategy: 2, Action: 1 },
            detail: 'thinking under pressure in real-time strategy'
          },
          {
            text: 'Card-based deck building or auto-battlers with random components.',
            points: { Strategy: 2, Roguelike: 1 },
            detail: 'tactical deck-building under random conditions'
          }
        ]
      }
    ],
    Puzzle: [
      {
        id: 'puzzle_satisfaction',
        text: 'What makes you enjoy a puzzle?',
        phase: 'deep_dive',
        genreId: 'Puzzle',
        options: [
          {
            text: 'The "Aha!" moment of understanding a hidden rule or perspective.',
            points: { Puzzle: 2, Platformer: 1 },
            detail: 'finding hidden mechanics and spatial logic'
          },
          {
            text: 'Executing complex steps, logistics, or mathematical logic.',
            points: { Puzzle: 2, Strategy: 1 },
            detail: 'solving strict mathematical grids'
          },
          {
            text: 'Deducing a mystery using environmental clues and journals.',
            points: { Puzzle: 2, 'Visual Novel': 1 },
            detail: 'detecting narrative mystery clues'
          }
        ]
      },
      {
        id: 'puzzle_integration',
        text: 'How should puzzles be integrated into the game?',
        phase: 'deep_dive',
        genreId: 'Puzzle',
        options: [
          {
            text: 'Pure puzzle screens: abstract levels with no distraction.',
            points: { Puzzle: 2 },
            detail: 'isolated abstract challenge screens'
          },
          {
            text: 'Physical obstacles in an adventure game (like dungeons or portals).',
            points: { Puzzle: 2, Action: 1 },
            detail: 'physics obstacles embedded in adventures'
          },
          {
            text: 'Narrative-driven investigation: puzzles are clues in a story.',
            points: { Puzzle: 2, 'Visual Novel': 1 },
            detail: 'solving clues as part of a story'
          }
        ]
      }
    ],
    Platformer: [
      {
        id: 'platformer_type',
        text: 'What style of platforming draws you in?',
        phase: 'deep_dive',
        genreId: 'Platformer',
        options: [
          {
            text: 'Exploration-based: Metroidvania layout with ability gates.',
            points: { Platformer: 2, RPG: 1 },
            detail: 'metroidvania layout and backtracking'
          },
          {
            text: 'Precision-based: tight controls, frequent deaths, screen-based trials.',
            points: { Platformer: 2, Action: 1 },
            detail: 'brutal precision jumping layouts'
          },
          {
            text: 'Cinematic/Puzzle-based: slower paced, atmospheric, with puzzles.',
            points: { Platformer: 2, Puzzle: 1 },
            detail: 'slower, cinematic, and atmospheric movement'
          }
        ]
      },
      {
        id: 'platformer_feedback',
        text: 'What kind of visual/audio feedback do you enjoy most?',
        phase: 'deep_dive',
        genreId: 'Platformer',
        options: [
          {
            text: 'Bright, stylized cartoon worlds with cheerful audio.',
            points: { Platformer: 2, Cozy: 1 },
            detail: 'cheerful cartoon settings'
          },
          {
            text: 'Moody, dark, pixel-art worlds with ambient music.',
            points: { Platformer: 2, Horror: 1 },
            detail: 'dark, atmospheric pixel layouts'
          },
          {
            text: 'Minimalist, clean, abstract graphics that emphasize physics.',
            points: { Platformer: 2, Puzzle: 1 },
            detail: 'clean minimalist physics simulations'
          }
        ]
      }
    ],
    Roguelike: [
      {
        id: 'roguelike_appeal',
        text: 'What is the primary appeal of the run-based structure?',
        phase: 'deep_dive',
        genreId: 'Roguelike',
        options: [
          {
            text: 'Creating wacky, overpowered item synergies and build combos.',
            points: { Roguelike: 2, RPG: 1 },
            detail: 'creating broken synergy-driven builds'
          },
          {
            text: 'Upgrading permanent home-base stats to make future runs easier.',
            points: { Roguelike: 2, Action: 1 },
            detail: 'earning persistent base stat upgrades'
          },
          {
            text: 'The thrill of permadeath and trying to win with pure skill/luck.',
            points: { Roguelike: 2, Strategy: 1 },
            detail: 'testing skills with strict permadeath rules'
          }
        ]
      },
      {
        id: 'roguelike_combat',
        text: 'How should the action in a Roguelike be played?',
        phase: 'deep_dive',
        genreId: 'Roguelike',
        options: [
          {
            text: 'Fast-paced action combat (slashing, shooting, dodging).',
            points: { Roguelike: 2, Action: 1 },
            detail: 'fast combat execution'
          },
          {
            text: 'Turn-based tactical decisions (traditional grid movement).',
            points: { Roguelike: 2, Strategy: 1 },
            detail: 'methodical grid-based planning'
          },
          {
            text: 'Card battles or dice-rolling systems (deckbuilders).',
            points: { Roguelike: 2, Puzzle: 1 },
            detail: 'tactical deck-building matches'
          }
        ]
      }
    ],
    'Visual Novel': [
      {
        id: 'vn_read',
        text: 'What draws you to read a visual novel?',
        phase: 'deep_dive',
        genreId: 'Visual Novel',
        options: [
          {
            text: 'Complex, branching structures with multiple endings and routes.',
            points: { 'Visual Novel': 2, RPG: 1 },
            detail: 'navigating branching plot paths'
          },
          {
            text: 'High-quality prose, emotional themes, and literary storytelling.',
            points: { 'Visual Novel': 2, Cozy: 1 },
            detail: 'experiencing emotional literary stories'
          },
          {
            text: 'Gameplay hybrids: court cases, puzzles, or minigames mixed in.',
            points: { 'Visual Novel': 2, Puzzle: 1 },
            detail: 'hybrid mechanics and puzzles in stories'
          }
        ]
      },
      {
        id: 'vn_theme',
        text: 'What narrative themes do you prefer?',
        phase: 'deep_dive',
        genreId: 'Visual Novel',
        options: [
          {
            text: 'Sci-fi mysteries, psychological thrillers, or horror.',
            points: { 'Visual Novel': 2, Horror: 1 },
            detail: 'psychological mystery and sci-fi'
          },
          {
            text: 'Cozy slice-of-life, romance, or relationship building.',
            points: { 'Visual Novel': 2, Cozy: 1 },
            detail: 'cozy slice-of-life and relationship updates'
          },
          {
            text: 'Historical drama, fantasy worlds, or high adventure.',
            points: { 'Visual Novel': 2, RPG: 1 },
            detail: 'epic historical and fantasy settings'
          }
        ]
      }
    ],
    Horror: [
      {
        id: 'horror_type',
        text: 'What kind of horror experience gets under your skin?',
        phase: 'deep_dive',
        genreId: 'Horror',
        options: [
          {
            text: 'Psychological dread, eerie atmosphere, and scarcity of supplies.',
            points: { Horror: 2, Puzzle: 1 },
            detail: 'survival and psychological dread'
          },
          {
            text: 'Jumpscares, high-speed chases, and adrenaline-pumping survival.',
            points: { Horror: 2, Action: 1 },
            detail: 'intense chases and jumpscare adrenaline'
          },
          {
            text: 'Surreal, cosmic mystery, and narrative-driven tension.',
            points: { Horror: 2, 'Visual Novel': 1 },
            detail: 'surreal cosmic and narrative tension'
          }
        ]
      },
      {
        id: 'horror_mechanic',
        text: 'What gameplay style matches your horror preference?',
        phase: 'deep_dive',
        genreId: 'Horror',
        options: [
          {
            text: 'Traditional puzzle-solving and inventory management (classic Resident Evil).',
            points: { Horror: 2, Puzzle: 1 },
            detail: 'solving puzzle loops under threat'
          },
          {
            text: 'Helpless defense: hiding, running, and using a flashlight (Outlast).',
            points: { Horror: 2 },
            detail: 'helpless defense, running, and stealth'
          },
          {
            text: 'Action-horror: fighting back with weapons against monsters (Dead Space).',
            points: { Horror: 2, Action: 1 },
            detail: 'combat defense using weapons'
          }
        ]
      }
    ],
    Cozy: [
      {
        id: 'cozy_loop',
        text: 'What is your main cozy gameplay loop?',
        phase: 'deep_dive',
        genreId: 'Cozy',
        options: [
          {
            text: 'Farming, gathering, building houses, and decorating environments.',
            points: { Cozy: 2, Platformer: 1 },
            detail: 'designing and farming sandboxes'
          },
          {
            text: 'Socializing, befriending townspeople, and reading dialog.',
            points: { Cozy: 2, 'Visual Novel': 1 },
            detail: 'talking to townspeople and upgrading friendships'
          },
          {
            text: 'Bite-sized organization, cleaning, or logic grids.',
            points: { Cozy: 2, Puzzle: 1 },
            detail: 'incremental organizing layouts'
          }
        ]
      },
      {
        id: 'cozy_setting',
        text: 'What kind of setting makes you feel most relaxed?',
        phase: 'deep_dive',
        genreId: 'Cozy',
        options: [
          {
            text: 'A charming fantasy village or farm.',
            points: { Cozy: 2, RPG: 1 },
            detail: 'charming rural fantasy villages'
          },
          {
            text: 'A modern, aesthetic home/sandbox interior.',
            points: { Cozy: 2, Puzzle: 1 },
            detail: 'modern, tidy home designs'
          },
          {
            text: 'A beautiful, serene nature wilderness.',
            points: { Cozy: 2, Platformer: 1 },
            detail: 'serene, open wilderness settings'
          }
        ]
      }
    ]
  };

  // State
  state: TasteState = {
    phase: 'welcome',
    currentStep: 0,
    answers: {},
    candidateGenres: [],
    profile: null
  };

  // List of active questions in the current run
  activeQuestions: Question[] = [];

  // Temporary list to track clicking order for the current question
  stepRankedIndices: number[] = [];

  constructor(public authService: GoogleAuthService) {}

  ngOnInit() {
    this.loadFromLocalStorage();
  }

  // Starts/resets the test
  startTest() {
    this.state.phase = 'questions';
    this.state.currentStep = 0;
    this.state.answers = {};
    this.state.candidateGenres = [];
    this.state.profile = null;
    this.stepRankedIndices = [];
    this.activeQuestions = [...this.profileQuestions];
    this.saveToLocalStorage();
  }

  // Click handler to toggle ranking index
  toggleRankOption(optionIndex: number) {
    const currentQ = this.activeQuestions[this.state.currentStep];
    if (!currentQ) return;

    if (this.stepRankedIndices.includes(optionIndex)) {
      // Remove it from ranking
      this.stepRankedIndices = this.stepRankedIndices.filter(idx => idx !== optionIndex);
    } else {
      // Add it to ranking
      this.stepRankedIndices.push(optionIndex);
    }
  }

  // Check if option index is ranked and return its rank number (1-based)
  getOptionRank(optionIndex: number): number {
    const rankIdx = this.stepRankedIndices.indexOf(optionIndex);
    return rankIdx !== -1 ? rankIdx + 1 : 0;
  }

  // Check if all options of the current question are ranked
  get isCurrentStepFullyRanked(): boolean {
    const currentQ = this.activeQuestions[this.state.currentStep];
    if (!currentQ) return false;
    return this.stepRankedIndices.length === currentQ.options.length;
  }

  // Next step handler
  nextStep() {
    if (!this.isCurrentStepFullyRanked) return;

    const currentQuestion = this.activeQuestions[this.state.currentStep];
    // Save ranked list in answers
    this.state.answers[currentQuestion.id] = [...this.stepRankedIndices];
    this.stepRankedIndices = [];

    // Check if we just completed Phase 1 (Broad profiling)
    if (this.state.currentStep === this.profileQuestions.length - 1) {
      this.calculateCandidates();
      this.injectDeepDiveQuestions();
    }

    // Go to next step or complete
    if (this.state.currentStep < this.activeQuestions.length - 1) {
      this.state.currentStep++;
      // Load next step answers if they exist (for backtrack edit)
      const nextQ = this.activeQuestions[this.state.currentStep];
      this.stepRankedIndices = [...(this.state.answers[nextQ.id] || [])];
      this.saveToLocalStorage();
    } else {
      // Completed questionnaire!
      this.generateFinalProfile();
      this.state.phase = 'results';
      this.saveToLocalStorage();
    }
  }

  // Go to previous step
  previousStep() {
    if (this.state.currentStep > 0) {
      // Save current partially completed rank if any
      const currentQ = this.activeQuestions[this.state.currentStep];
      if (this.stepRankedIndices.length > 0) {
        this.state.answers[currentQ.id] = [...this.stepRankedIndices];
      }

      this.state.currentStep--;

      // If we backtrack before Phase 1 is fully finished, clear candidate injections
      if (this.state.currentStep < this.profileQuestions.length) {
        this.activeQuestions = [...this.profileQuestions];
        this.state.candidateGenres = [];
      }

      const prevQ = this.activeQuestions[this.state.currentStep];
      this.stepRankedIndices = [...(this.state.answers[prevQ.id] || [])];
      this.saveToLocalStorage();
    } else {
      this.state.phase = 'welcome';
      this.saveToLocalStorage();
    }
  }

  // Calculate top 2 candidate genres after Phase 1 based on ranking weight multipliers
  private calculateCandidates() {
    const scores = this.calculateWeightedScoresForPhase(this.profileQuestions);
    const sortedGenres = (Object.keys(scores) as GamerGenre[]).sort((a, b) => scores[b] - scores[a]);
    this.state.candidateGenres = [sortedGenres[0], sortedGenres[1]];
  }

  // Inject branching deep-dive questions based on top candidate genres
  private injectDeepDiveQuestions() {
    const newQuestions = [...this.profileQuestions];
    
    this.state.candidateGenres.forEach(genre => {
      const deepDives = this.deepDiveQuestionsMap[genre];
      if (deepDives && deepDives.length > 0) {
        newQuestions.push(...deepDives);
      }
    });

    this.activeQuestions = newQuestions;
  }

  // Calculates scores for a set of questions using rank multiplier weights
  private calculateWeightedScoresForPhase(questions: Question[]): Record<GamerGenre, number> {
    const scores: Record<GamerGenre, number> = {
      RPG: 0, Action: 0, Strategy: 0, Puzzle: 0, Platformer: 0, Roguelike: 0, 'Visual Novel': 0, Horror: 0, Cozy: 0
    };

    questions.forEach(q => {
      const rankedIdxs = this.state.answers[q.id];
      if (rankedIdxs && rankedIdxs.length > 0) {
        rankedIdxs.forEach((optionIdx, rankPos) => {
          const option = q.options[optionIdx];
          if (!option) return;

          // Rank 1 gets 1.0, Rank 2 gets 0.5, Rank 3 gets 0.2, Rank 4 gets 0.1
          const multiplier = rankPos === 0 ? 1.0 : rankPos === 1 ? 0.5 : rankPos === 2 ? 0.2 : 0.1;
          Object.entries(option.points).forEach(([genre, pts]) => {
            scores[genre as GamerGenre] += pts * multiplier;
          });
        });
      }
    });

    return scores;
  }

  // Generate the GamerProfile based on all answers and rank weightings
  private generateFinalProfile() {
    const scores = this.calculateWeightedScoresForPhase(this.activeQuestions);
    const details: string[] = [];

    // Extract details from their #1 choices only
    this.activeQuestions.forEach(q => {
      const rankedIdxs = this.state.answers[q.id];
      if (rankedIdxs && rankedIdxs.length > 0) {
        const primaryOptionIdx = rankedIdxs[0];
        const option = q.options[primaryOptionIdx];
        if (option && option.detail) {
          details.push(option.detail);
        }
      }
    });

    // Sort to determine top genres
    const sorted = (Object.keys(scores) as GamerGenre[]).sort((a, b) => scores[b] - scores[a]);
    const top2 = [sorted[0], sorted[1]];

    // Define Archetype based on top 2
    let archetype = 'The Curious Wanderer';
    let archetypeDescription = 'You have a highly adaptable gaming palate. You enjoy a blend of story, challenge, action, and planning, fitting into different genres depending on your mood.';

    const primary = top2[0];
    const secondary = top2[1];

    if ((primary === 'RPG' && secondary === 'Visual Novel') || (primary === 'Visual Novel' && secondary === 'RPG')) {
      archetype = 'The Narrative Immersionist';
      archetypeDescription = 'You play games to live double lives. Immersive worlds, heavy storytelling, and personal agency in the plot are your primary drivers. Mechanics are merely a vehicle for your journey.';
    } else if ((primary === 'Strategy' && secondary === 'Puzzle') || (primary === 'Puzzle' && secondary === 'Strategy')) {
      archetype = 'The Master Architect';
      archetypeDescription = 'You treat games as logic engines. Deciphering complex systems, thinking five steps ahead, and solving puzzles are what make you tick. You prefer brains over raw reflexes.';
    } else if ((primary === 'Roguelike' && secondary === 'Action') || (primary === 'Action' && secondary === 'Roguelike')) {
      archetype = 'The High-Octane Gladiator';
      archetypeDescription = 'Adrenaline is your fuel. You live for tight combat, mechanical mastery, and the thrill of overcoming brutal difficulty. Repeat runs and high stakes keep you hooked.';
    } else if ((primary === 'Cozy' && secondary === 'Puzzle') || (primary === 'Puzzle' && secondary === 'Cozy')) {
      archetype = 'The Zen Creator';
      archetypeDescription = 'For you, gaming is a sanctuary. You love sandbox creativity, relaxing loops, and satisfying logic puzzles. You prefer taking things at your own pace without unnecessary stress.';
    } else if ((primary === 'Action' && secondary === 'Platformer') || (primary === 'Platformer' && secondary === 'Action')) {
      archetype = 'The Precision Acrobat';
      archetypeDescription = 'You value flow state. Fluid movement, pixel-perfect positioning, and instant mechanical feedback are what drive your enjoyment of games.';
    } else if ((primary === 'RPG' && secondary === 'Strategy') || (primary === 'Strategy' && secondary === 'RPG')) {
      archetype = 'The Tactical Commander';
      archetypeDescription = 'You love deep progression and strategic foresight. Managing a squad, building character stats, and executing turn-based tactics give you the perfect balance of brainpower and roleplay.';
    } else if ((primary === 'Horror' && secondary === 'RPG') || (primary === 'RPG' && secondary === 'Horror')) {
      archetype = 'The Dark Explorer';
      archetypeDescription = 'You seek heavy atmosphere, mystery, and suspense. You love being drawn into eerie worlds and testing your survival instincts against unknown threats.';
    } else if ((primary === 'Roguelike' && secondary === 'Strategy') || (primary === 'Strategy' && secondary === 'Roguelike')) {
      archetype = 'The Adaptive Systemizer';
      archetypeDescription = 'You love combining complex mechanics and adapting to randomness. Crafting synergies and outsmarting RNG is your ultimate playstyle.';
    } else if ((primary === 'Cozy' && secondary === 'RPG') || (primary === 'RPG' && secondary === 'Cozy')) {
      archetype = 'The Relaxed Adventurer';
      archetypeDescription = 'You enjoy deep worlds and rich characters but prefer to tackle them in a cozy, social, or low-stress manner. Building relationships with townspeople and side-quests are your comfort zone.';
    } else if (primary === 'Cozy') {
      archetype = 'The Cozy Architect';
      archetypeDescription = 'You look for calm, design freedom, and gentle progression. Designing cozy houses, running farms, or optimizing production without stress is your favorite escape.';
    } else if (primary === 'Action') {
      archetype = 'The Reflex Combatant';
      archetypeDescription = 'You crave feedback and speed. Rapid reactions, slashing combos, or shooter fire-fights are your favorite ways to pass the time.';
    }

    // Build the Top Genre structures with details
    const topGenres = top2.map(genre => {
      const whyList: string[] = [];

      // Determine 'why' from Phase 1 answers (only looking at #1 ranks)
      this.profileQuestions.forEach(q => {
        const ranked = this.state.answers[q.id];
        if (ranked && ranked.length > 0) {
          const firstOptIdx = ranked[0];
          const opt = q.options[firstOptIdx];
          if (opt && opt.points[genre] && opt.points[genre]! > 0) {
            whyList.push(`You prioritize ${opt.detail}.`);
          }
        }
      });

      // Add 'why' from deep dive answers (only #1 ranks)
      const deepDives = this.deepDiveQuestionsMap[genre] || [];
      deepDives.forEach(q => {
        const ranked = this.state.answers[q.id];
        if (ranked && ranked.length > 0) {
          const firstOptIdx = ranked[0];
          const opt = q.options[firstOptIdx];
          if (opt && opt.detail) {
            whyList.push(`Specifically, you prefer ${opt.detail}.`);
          }
        }
      });

      const whyFiltered = Array.from(new Set(whyList));

      return {
        genre,
        score: Math.round(scores[genre] * 10) / 10,
        why: whyFiltered
      };
    });

    // Resolve the Genre Combination Recommendations
    const combination = this.getGenreCombination(top2[0], top2[1]);

    this.state.profile = {
      archetype,
      archetypeDescription,
      topGenres,
      scores,
      combination
    };
  }

  // Big table mapping top genre pairs to game genre combinations and game recommendations
  private getGenreCombination(genreA: GamerGenre, genreB: GamerGenre): GenreCombination {
    const key = [genreA, genreB].sort().join('+');

    const database: Record<string, GenreCombination> = {
      'Action+RPG': {
        name: 'Action RPG (ARPG)',
        description: 'You merge deep role-playing progression, stats, and loot loops with real-time combat execution.',
        games: [
          { name: 'Elden Ring', desc: 'Incredible combat depth, boss mechanics, and custom builds in a dark fantasy setting.' },
          { name: 'Cyberpunk 2077', desc: 'Immersive story choices mixed with high-speed first-person gunplay and cybernetic stats.' },
          { name: 'Monster Hunter: World', desc: 'Tactile boss battles with complex weapon movesets and crafting loops.' }
        ]
      },
      'RPG+Strategy': {
        name: 'Tactical RPG / Turn-Based Tactics',
        description: 'You love build diversity and stats, but prefer them paired with squad control, layouts, and turn-based foresight.',
        games: [
          { name: "Baldur's Gate 3", desc: 'Turn-based D&D combat with absolute roleplay agency and character progress.' },
          { name: 'Fire Emblem: Three Houses', desc: 'Grid-based strategy warfare mixed with relationship building and class leveling.' },
          { name: 'Tactics Ogre: Reborn', desc: 'The crown jewel of tactical isometric grids, class management, and deep branching routes.' }
        ]
      },
      'Puzzle+RPG': {
        name: 'Exploration / Puzzle Adventure',
        description: 'You enjoy worlds where stories are uncovered by exploring and solving intricate physics or environmental logic hurdles.',
        games: [
          { name: 'Golden Sun', desc: 'Classic RPG where puzzle spells are used directly inside dungeon designs.' },
          { name: 'The Talos Principle 2', desc: 'Philosophical dialogue choices combined with magnificent spatial logic puzzles.' },
          { name: 'CrossCode', desc: 'Action combat RPG filled with retro puzzles, backtracking, and high difficulty bosses.' }
        ]
      },
      'Platformer+RPG': {
        name: 'Metroidvania RPG',
        description: 'You love platform traversal and vertical maps locked by ability upgrades, combined with leveling systems.',
        games: [
          { name: 'Castlevania: Symphony of the Night', desc: 'The pioneer of leveling, equipment looting, and exploring castle walls.' },
          { name: 'Bloodstained: Ritual of the Night', desc: 'Fluid jumping, massive boss challenges, and shard collection progression.' },
          { name: 'Salt and Sanctuary', desc: 'A challenging, gritty 2D action platformer with heavy RPG skill trees.' }
        ]
      },
      'RPG+Roguelike': {
        name: 'Action Roguelite / RPG Loop',
        description: 'You love progression, build crafting, and stats, but prefer them in run-based format with high replayability.',
        games: [
          { name: 'Hades', desc: 'Brilliant combination of weapon upgrades, item synergies, stats, and a persisting storyline.' },
          { name: 'Rogue Legacy 2', desc: 'Meta-progression leveling where your heirs inherit unique classes and explore castles.' },
          { name: 'Children of Morta', desc: 'Story-driven dungeon crawler with family character skill trees and action combat.' }
        ]
      },
      'RPG+Visual Novel': {
        name: 'Narrative-Driven RPG',
        description: 'You prioritize narrative choice, reading lore, and deep dialog pathways over reflex execution.',
        games: [
          { name: 'Disco Elysium', desc: 'Superb dialogue-only RPG with deep stats representing aspects of your psyche.' },
          { name: 'Persona 5 Royal', desc: 'Half high-school relationship visual novel, half turn-based dungeon crawler.' },
          { name: 'Planescape: Torment', desc: 'Philosophical literary masterpiece focused on dialogue choices and avatar identity.' }
        ]
      },
      'Horror+RPG': {
        name: 'Survival Horror RPG',
        description: 'You enjoy exploring, managing inventories, and choosing statistics, but set inside spooky, dark environments.',
        games: [
          { name: 'Pathologic 2', desc: 'Open-world survival game about plague, resource management, and tense choices.' },
          { name: 'Vampyr', desc: 'Investigate citizens, choose who to feed on, and level up combat abilities in dark London.' },
          { name: 'Bloodborne', desc: 'Oppressive dark horror themes mixed with rapid combat stats and eerie world-building.' }
        ]
      },
      'Cozy+RPG': {
        name: 'Cozy RPG / Life Sim',
        description: 'You love exploring, gathering resources, and leveling stats, but in a friendly, low-stress rural fantasy environment.',
        games: [
          { name: 'Stardew Valley', desc: 'Farming, relationship loops, and exploring mine levels in a relaxing style.' },
          { name: 'Rune Factory 4 Special', desc: 'Farming simulator mixed with crafting, active weapon loops, and story dungeons.' },
          { name: 'Dave the Diver', desc: 'Daytime spearfishing action combined with nighttime sushi restaurant management.' }
        ]
      },
      'Action+Strategy': {
        name: 'Real-Time Tactics / Action Strategy',
        description: 'You enjoy real-time mechanical speed combined with squad tactics, resource loops, or army commands.',
        games: [
          { name: 'StarCraft II', desc: 'The gold standard of real-time strategy, testing speed, macro building, and micro controls.' },
          { name: 'Frostpunk', desc: 'Real-time city building and survival strategy where resource management is a life-or-death crisis.' },
          { name: 'Mount & Blade II: Bannerlord', desc: 'Lead armies in strategic maps and participate directly in massive action combat fields.' }
        ]
      },
      'Action+Puzzle': {
        name: 'Action Puzzle / Spatial Action',
        description: 'You love spatial reasoning or block organization that tests your reflex execution and fast timing.',
        games: [
          { name: 'Tetris Effect', desc: 'Vibrant, atmospheric block-matching requiring high reflexes and muscle memory.' },
          { name: 'Superliminal', desc: 'First-person perspective challenges where objects scale based on how you move.' },
          { name: 'Portal 2', desc: 'First-person portal manipulation testing physical speed and spatial puzzle solving.' }
        ]
      },
      'Action+Platformer': {
        name: 'Action Platformer / Metroidvania',
        description: 'You value flow state: fluid movement, precision jumps, and high-speed reflex combat.',
        games: [
          { name: 'Hollow Knight', desc: 'Challenging layout navigation, precise combat, and secrets in a beautifully hand-drawn bug kingdom.' },
          { name: 'Dead Cells', desc: 'Fast, smooth combat platformer requiring rapid dodging and weapon combinations.' },
          { name: 'Cuphead', desc: 'Hand-drawn animation boss battles testing precision shooting and jump timing.' }
        ]
      },
      'Action+Roguelike': {
        name: 'Action Roguelike',
        description: 'You love real-time combat, dodging, and shooter mechanics in run-based procedurally generated environments.',
        games: [
          { name: 'Hades', desc: 'Incredible action loops with quick weapon dashes, power combos, and meta upgrades.' },
          { name: 'Enter the Gungeon', desc: 'Bullet-hell dungeon crawler filled with hundreds of crazy guns and active dodge-rolls.' },
          { name: 'Risk of Rain 2', desc: '3D third-person shooter roguelike where difficulty scales directly with time.' }
        ]
      },
      'Action+Visual Novel': {
        name: 'Cinematic Action Adventure',
        description: 'You love fluid real-time combat punctuated by heavy cinematic sequences and story-focused narratives.',
        games: [
          { name: 'NieR: Automata', desc: 'Stylish hack-and-slash action combined with philosophical storytelling and bullet hell.' },
          { name: 'Detroit: Become Human', desc: 'Cinematic branching drama focused on quick-time events and reflex choices.' },
          { name: 'Yakuza: Like a Dragon', desc: 'Heavy cinematic story focusing on street brawling themes and character paths.' }
        ]
      },
      'Action+Horror': {
        name: 'Action Horror',
        description: 'You enjoy defending yourself against terrifying monsters using firearms, melee combat, and combat pacing.',
        games: [
          { name: 'Resident Evil 4 (Remake)', desc: 'Brilliant blend of tension, resource conservation, and high-intensity shooting.' },
          { name: 'Dead Space', desc: 'Atmospheric sci-fi shooter where dismembering necromorph limbs requires precision.' },
          { name: 'The Last of Us Part I', desc: 'Gritty survival combat combining stealth, crafting, and intense action set pieces.' }
        ]
      },
      'Action+Cozy': {
        name: 'Cozy Action Sandbox',
        description: 'You enjoy relaxing sandbox simulation punctuated by satisfying, low-stress action loops.',
        games: [
          { name: 'Slime Rancher', desc: 'Explore a vibrant alien planet, collect slimes with your vacpack, and build your ranch.' },
          { name: 'Dave the Diver', desc: 'Relaxing deep-sea diving brawling loops mixed with running a busy restaurant.' },
          { name: 'Recettear: An Item Shop\'s Tale', desc: 'Explore dungeons for loot during the day and run a merchant store to pay debt.' }
        ]
      },
      'Puzzle+Strategy': {
        name: 'Tactical Puzzle / System Optimization',
        description: 'You treat games as logic puzzles, optimizing layouts or solving skirmishes in turn-based grids.',
        games: [
          { name: 'Into the Breach', desc: 'Turn-based tactical grid puzzles where enemy moves are completely telegraphed.' },
          { name: 'Baba Is You', desc: 'Manipulate blocks of words to change the logical rules of the level grid.' },
          { name: 'Opus Magnum', desc: 'Design alchemical machines to assemble compounds in efficient automated pipelines.' }
        ]
      },
      'Platformer+Strategy': {
        name: 'Strategic Platformer',
        description: 'You enjoy physical level navigation combined with building defenses, management, or unit commands.',
        games: [
          { name: 'Kingdom Two Crowns', desc: 'Minimalist 2D side-scrolling management where you ride a mount and build walls.' },
          { name: 'Terraria', desc: 'Sandbox building, mining, and strategic boss arena preparation.' },
          { name: 'Clustertruck', desc: 'Strategic jump calculation in chaotic real-time physics situations.' }
        ]
      },
      'Roguelike+Strategy': {
        name: 'Roguelike Deckbuilder / Strategy',
        description: 'You enjoy tactical card building, resource draft systems, and strategy in procedural runs.',
        games: [
          { name: 'Slay the Spire', desc: 'The definitive roguelike deckbuilder mapping card synergies and relics.' },
          { name: 'Inscryption', desc: 'Atmospheric card-game combining escape-room puzzles and deck-building.' },
          { name: 'Balatro', desc: 'Mind-bending poker deckbuilder where you break numerical limits using Joker upgrades.' }
        ]
      },
      'Strategy+Visual Novel': {
        name: 'Narrative Strategy / Political Sim',
        description: 'You love managing deep political or simulation systems driven by narrative choices and text-based events.',
        games: [
          { name: 'Suzerain', desc: 'Act as a president of a country, managing economic and geopolitical decisions through dialogue.' },
          { name: 'Frostpunk', desc: 'Build a steam city in a frozen world, passing harsh laws that impact citizen hope.' },
          { name: 'Crusader Kings III', desc: 'Manage your dynasty, forge alliances, and navigate personal betrayals in medieval Europe.' }
        ]
      },
      'Horror+Strategy': {
        name: 'Survival Management / Dark Tactics',
        description: 'You manage resources, teams, or bases under constant pressure, dread, and horror elements.',
        games: [
          { name: 'Darkest Dungeon', desc: 'Turn-based tactical dungeon crawler focusing on character stress and sanity.' },
          { name: 'RimWorld', desc: 'Manage a colony of survivors on a foreign planet, dealing with dark events and threats.' },
          { name: 'The Forest', desc: 'Base construction and resource management while defending against cannibal tribes.' }
        ]
      },
      'Cozy+Strategy': {
        name: 'Cozy Town Builder / Colony Sim',
        description: 'You enjoy building cities, optimizing layouts, and sorting supply lines in a peaceful, non-threatening tempo.',
        games: [
          { name: 'Dorfromantik', desc: 'Relaxing hexagonal tile placement to build beautiful, serene landscapes.' },
          { name: 'Townscaper', desc: 'Instant, beautiful island town builder focusing purely on layout aesthetic.' },
          { name: 'Against the Storm', desc: 'A cozy fantasy roguelite city-builder centered on gathering resources under rain cycles.' }
        ]
      },
      'Platformer+Puzzle': {
        name: 'Puzzle Platformer',
        description: 'You enjoy environmental logic where navigating physical barriers requires active problem solving.',
        games: [
          { name: 'Celeste', desc: 'Precision jumps combined with thoughtful mechanics and an emotional storyline.' },
          { name: 'Braid', desc: 'Manipulate time mechanics to solve complex movement and puzzle layouts.' },
          { name: 'FEZ', desc: 'Rotate a 3D perspective world to navigate 2D platforming grids.' }
        ]
      },
      'Platformer+Roguelike': {
        name: 'Roguelike Platformer / Action Traversal',
        description: 'You love precision platform jumps, dashes, and weapon loops in run-based procedurally generated maps.',
        games: [
          { name: 'Dead Cells', desc: 'Fast, smooth combat platformer requiring rapid jumping and weapon combinations.' },
          { name: 'Spelunky 2', desc: 'Brutally difficult procedural platforms testing fast traps, physics, and quick runs.' },
          { name: 'Rogue Legacy 2', desc: 'Explore a randomized castle, changing upgrades and heir classes each run.' }
        ]
      },
      'Platformer+Visual Novel': {
        name: 'Atmospheric / Narrative Platformer',
        description: 'You enjoy stories driven by environment navigation and beautiful traversal, rather than heavy combat.',
        games: [
          { name: 'Gris', desc: 'Artistic, emotional journey of a girl navigating ruins through colors and sound.' },
          { name: 'Night in the Woods', desc: 'Explore a quiet rural town, jump across roofs, and read deep character dialog.' },
          { name: 'Thomas Was Alone', desc: 'Minimalist puzzle platformer where colored rectangles represent unique characters with personalities.' }
        ]
      },
      'Horror+Platformer': {
        name: 'Eerie Puzzle Platformer',
        description: 'You enjoy navigating physical level barriers in dark, creepy, and suspenseful environments.',
        games: [
          { name: 'Inside', desc: 'Dystopian, atmospheric masterclass in visual storytelling and environmental puzzles.' },
          { name: 'Little Nightmares', desc: 'Navigate a creepy vessel, hiding from grotesque figures in platform layouts.' },
          { name: 'Limbo', desc: 'Moody black-and-white silhouette puzzles testing timing and dread.' }
        ]
      },
      'Cozy+Platformer': {
        name: 'Cozy Adventure Platformer',
        description: 'You enjoy exploring cute, relaxing environments with light movement physics and collecting secrets.',
        games: [
          { name: 'A Short Hike', desc: 'Bite-sized, beautiful hike up a mountain, gliding and talking to characters.' },
          { name: 'Yoku\'s Island Express', desc: 'Unique pinball-platforming adventure in a bright, tropical island.' },
          { name: 'Kirby\'s Epic Yarn', desc: 'Charming, yarn-styled platforming where you cannot die, focusing on collectibles.' }
        ]
      },
      'Puzzle+Roguelike': {
        name: 'Roguelike Puzzle',
        description: 'You enjoy analytical deduction or grid math in highly replayable run-based structures.',
        games: [
          { name: 'Into the Breach', desc: 'Turn-based tactical skirmish runs where predicting enemy attacks is key.' },
          { name: 'Peglin', desc: 'Pachinko-style roguelite where peg hits translate directly into combat damage.' },
          { name: 'Shotgun King', desc: 'Roguelike chess game where you control a king armed with a shotgun.' }
        ]
      },
      'Puzzle+Visual Novel': {
        name: 'Investigation / Adventure Novel',
        description: 'You love reading text-heavy stories where progression requires solving trials, deducing clues, or court arguments.',
        games: [
          { name: 'Phoenix Wright: Ace Attorney', desc: 'Classic courtroom brawler investigating crime scenes and presenting logic errors.' },
          { name: 'Danganronpa: Trigger Happy Havoc', desc: 'School trial drama solving murder mysteries through reflex logic games.' },
          { name: 'Zero Escape: 999', desc: 'Branching escape-room thriller solving numerical and physical room puzzles.' }
        ]
      },
      'Horror+Puzzle': {
        name: 'Survival Horror / Puzzle escape',
        description: 'You love finding keys, decryption, and solving puzzles while being stalked by terrifying forces.',
        games: [
          { name: 'Signalis', desc: 'Retro-tech survival horror combining inventory management, puzzles, and dread.' },
          { name: 'Resident Evil 2 (Remake)', desc: 'Decipher police station blueprints, puzzle statues, and escape zombies.' },
          { name: 'SOMA', desc: 'Deep sci-fi horror exploring underwater installations, solving terminals, and hiding.' }
        ]
      },
      'Cozy+Puzzle': {
        name: 'Cozy Logic / Organization',
        description: 'You enjoy tidy organization, layout arrangement, or chill logic grids in a quiet, low-pressure aesthetic.',
        games: [
          { name: 'Unpacking', desc: 'Satisfying block-placement puzzle sorting household items across a life journey.' },
          { name: 'A Little to the Left', desc: 'Tidy up household objects, organizing them in satisfying visual logic patterns.' },
          { name: 'Dorfromantik', desc: 'Serene tile placement matching rivers, forests, and train lines.' }
        ]
      },
      'Roguelike+Visual Novel': {
        name: 'Narrative Roguelite',
        description: 'You love the run-based structure where stories, dialogues, and character paths continue to evolve across deaths.',
        games: [
          { name: 'Hades', desc: 'Dying is part of the story, unlocking new character interactions in the House of Hades.' },
          { name: 'Slay the Princess', desc: 'A choice-heavy looping visual novel where the princess changes based on your actions.' },
          { name: 'Griftlands', desc: 'Deck-building combat RPG where you can talk, negotiate, or fight your way through procedural days.' }
        ]
      },
      'Horror+Roguelike': {
        name: 'Survival Roguelike / Dark Run-based',
        description: 'You enjoy run-based formats characterized by stressful resource scarcity, scary monsters, and high stakes.',
        games: [
          { name: 'Darkest Dungeon', desc: 'Stressful squad loops through dark crypts where failure triggers permanent death.' },
          { name: 'Barotrauma', desc: 'Manage a submarine through hostile alien ocean trenches with crew horror events.' },
          { name: 'Pacific Drive', desc: 'Run-based driving game through a surreal exclusion zone filled with anomalies.' }
        ]
      },
      'Cozy+Roguelike': {
        name: 'Cozy Roguelite Loop',
        description: 'You like run-based action loops but prefer them paired with base-building, farming, or cute visual formats.',
        games: [
          { name: 'Cult of the Lamb', desc: 'Run-based action loops combined with managing a cute forest animal cult base.' },
          { name: 'Moonlighter', desc: 'Explore dungeons for loot at night, and run a cozy shop selling items during the day.' },
          { name: 'Dave the Diver', desc: 'Dive into the randomized Blue Hole for fish, building gear and upgrading a sushi bar.' }
        ]
      },
      'Horror+Visual Novel': {
        name: 'Psychological Horror Novel',
        description: 'You enjoy reading suspenseful text narratives with branching routes, bad endings, and deep dread.',
        games: [
          { name: 'Doki Doki Literature Club!', desc: 'Charming literature club story that slowly deconstructs into psychological terror.' },
          { name: 'Slay the Princess', desc: 'Fully voiced looping tragedy about trust, death, and perception.' },
          { name: 'The House in Fata Morgana', desc: 'Gothic tragedy novel exploring a cursed mansion and historical timelines.' }
        ]
      },
      'Cozy+Visual Novel': {
        name: 'Cozy Narrative / Slice-of-Life',
        description: 'You enjoy reading relaxed, emotional stories and befriending characters in low-pressure settings.',
        games: [
          { name: 'Coffee Talk', desc: 'Listen to fantasy citizens problems while brewing warm drinks on rainy nights.' },
          { name: 'VA-11 HALL-A', desc: 'Cyberpunk bartender simulator serving drinks and chatting with quirky customers.' },
          { name: 'A Space for the Unbound', desc: 'Beautiful pixel-art narrative journey exploring anxiety, youth, and rural Indonesia.' }
        ]
      },
      'Cozy+Horror': {
        name: 'Cozy Horror / Eerie Adventure',
        description: 'You enjoy creepy, spooky themes but in a relaxed, slow-paced adventure or management loop.',
        games: [
          { name: 'Dredge', desc: 'Relaxing fishing gameplay combined with Lovecraftian ocean horror and cosmic mysteries.' },
          { name: 'Graveyard Keeper', desc: 'Manage a medieval cemetery, gathering resources and crafting under cozy templates.' },
          { name: 'Cult of the Lamb', desc: 'Cute, cartoon animal visual style mixed with dark occult summon loops.' }
        ]
      }
    };

    return database[key] || {
      name: 'Action Adventure',
      description: 'You enjoy exploring wide worlds combining light action combat, movement, and progression.',
      games: [
        { name: 'The Legend of Zelda: Breath of the Wild', desc: 'Peerless physics sandbox exploration, light puzzle solving, and combat.' },
        { name: 'Minecraft', desc: 'Classic sandbox building, resource mining, and survival action.' },
        { name: 'Terraria', desc: '2D sandbox adventure filled with boss fights, equipment progression, and mining.' }
      ]
    };
  }

  // Clear saved test results
  clearProfile() {
    if (confirm('Are you sure you want to clear your current Game Taste profile?')) {
      localStorage.removeItem('game_taste_state');
      this.state = {
        phase: 'welcome',
        currentStep: 0,
        answers: {},
        candidateGenres: [],
        profile: null
      };
      this.activeQuestions = [];
      this.stepRankedIndices = [];
    }
  }

  // Local storage management
  private saveToLocalStorage() {
    try {
      const data = {
        phase: this.state.phase,
        currentStep: this.state.currentStep,
        answers: this.state.answers,
        candidateGenres: this.state.candidateGenres,
        profile: this.state.profile
      };
      localStorage.setItem('game_taste_state', JSON.stringify(data));
    } catch (e) {
      console.error('Failed to save taste state to localStorage:', e);
    }
  }

  private loadFromLocalStorage() {
    try {
      const stored = localStorage.getItem('game_taste_state');
      if (stored) {
        const data = JSON.parse(stored);
        this.state.phase = data.phase || 'welcome';
        this.state.currentStep = data.currentStep || 0;
        this.state.answers = data.answers || {};
        this.state.candidateGenres = data.candidateGenres || [];
        this.state.profile = data.profile || null;

        // Rebuild active questions queue if in progress
        if (this.state.phase === 'questions') {
          this.activeQuestions = [...this.profileQuestions];
          if (this.state.candidateGenres.length > 0) {
            this.injectDeepDiveQuestions();
          }
          // Restore current step ranked temporary selections
          const currentQ = this.activeQuestions[this.state.currentStep];
          this.stepRankedIndices = [...(this.state.answers[currentQ?.id] || [])];
        }

        // Migration check for combinations
        if (this.state.profile && !this.state.profile.combination) {
          const top2 = this.state.profile.topGenres.map(tg => tg.genre);
          if (top2.length >= 2) {
            this.state.profile.combination = this.getGenreCombination(top2[0], top2[1]);
          } else {
            this.state.profile.combination = this.getGenreCombination('RPG', 'Action');
          }
          this.saveToLocalStorage();
        }
      }
    } catch (e) {
      console.error('Failed to load taste state from localStorage:', e);
    }
  }

  // Get percentage progress
  get progressPercent(): number {
    if (this.activeQuestions.length === 0) return 0;
    return Math.round((this.state.currentStep / this.activeQuestions.length) * 100);
  }
}
