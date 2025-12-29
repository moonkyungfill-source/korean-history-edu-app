/**
 * Korean History Prompt Generator - Research Types
 *
 * Type definitions for historical research and grounding
 */

import { Era } from './prompt.types';

/**
 * Detailed historical context for a specific era
 */
export interface HistoricalContext {
  /** Historical period/era */
  period: Era;

  /** Display name for the period */
  periodName: string;

  /** Date range (e.g., "918-1392") */
  dateRange: string;

  /** Clothing and costume details */
  clothingDetails: ClothingDetails;

  /** Architecture and building details */
  architectureDetails: ArchitectureDetails;

  /** Daily life and cultural aspects */
  dailyLifeDetails?: DailyLifeDetails;

  /** Art and aesthetics of the period */
  artDetails?: ArtDetails;

  /** Key historical events */
  keyEvents?: string[];

  /** Important figures */
  notableFigures?: string[];

  /** Research sources */
  sources: ResearchSource[];
}

/**
 * Clothing and costume information
 */
export interface ClothingDetails {
  /** Common clothing items */
  commonItems: string[];

  /** Fabrics and materials used */
  materials: string[];

  /** Color palette and symbolism */
  colors: ColorInfo[];

  /** Class-based clothing distinctions */
  socialClassDistinctions: {
    nobility: string[];
    commoners: string[];
    officials?: string[];
  };

  /** Gender-specific clothing */
  genderDistinctions?: {
    male: string[];
    female: string[];
  };

  /** Accessories and adornments */
  accessories?: string[];

  /** Seasonal variations */
  seasonalVariations?: string[];
}

/**
 * Color information with cultural context
 */
export interface ColorInfo {
  /** Color name */
  name: string;

  /** Hex code if available */
  hexCode?: string;

  /** Cultural significance */
  significance?: string;

  /** Who typically wore this color */
  usedBy?: string[];
}

/**
 * Architecture and building information
 */
export interface ArchitectureDetails {
  /** Common building types */
  buildingTypes: string[];

  /** Roof styles */
  roofStyles: string[];

  /** Building materials */
  materials: string[];

  /** Decorative elements */
  decorativeElements: string[];

  /** Structural features */
  structuralFeatures?: string[];

  /** Garden and landscape elements */
  landscapeElements?: string[];

  /** Class-based architectural distinctions */
  socialClassDistinctions?: {
    palaces: string[];
    noblesHouses: string[];
    commonersHouses: string[];
  };
}

/**
 * Daily life and cultural details
 */
export interface DailyLifeDetails {
  /** Common activities */
  activities: string[];

  /** Food and cuisine */
  cuisine?: string[];

  /** Festivals and celebrations */
  festivals?: string[];

  /** Social customs */
  customs?: string[];

  /** Occupations and trades */
  occupations?: string[];
}

/**
 * Art and aesthetic information
 */
export interface ArtDetails {
  /** Art forms practiced */
  artForms: string[];

  /** Common motifs and symbols */
  motifs: string[];

  /** Artistic techniques */
  techniques?: string[];

  /** Famous works or artists */
  notableWorks?: string[];
}

/**
 * Research source citation
 */
export interface ResearchSource {
  /** Source title */
  title: string;

  /** Author(s) */
  author?: string;

  /** Publication year */
  year?: number;

  /** URL if available */
  url?: string;

  /** Type of source */
  type: 'academic' | 'museum' | 'archive' | 'book' | 'article' | 'web';

  /** Credibility score (0-1) */
  credibilityScore?: number;
}

/**
 * Response from grounded research query
 */
export interface GroundedResponse {
  /** The main response content */
  content: string;

  /** Confidence score (0-1) */
  confidence: number;

  /** Sources used for grounding */
  sources: ResearchSource[];

  /** Search queries used */
  queriesUsed?: string[];

  /** Timestamp of the response */
  timestamp: Date;

  /** Whether the response is fully grounded */
  isGrounded: boolean;

  /** Any caveats or limitations */
  caveats?: string[];
}

/**
 * Result from deep research process
 */
export interface DeepResearchResult {
  /** Research topic */
  topic: string;

  /** Historical era researched */
  era: Era;

  /** Comprehensive findings */
  findings: {
    /** Primary findings */
    primary: string[];

    /** Secondary/supporting findings */
    secondary: string[];

    /** Contradictions or debates found */
    contradictions?: string[];
  };

  /** Historical context compiled */
  context: HistoricalContext;

  /** All sources consulted */
  sources: ResearchSource[];

  /** Quality metrics */
  qualityMetrics: {
    /** Number of sources */
    sourceCount: number;

    /** Average credibility */
    averageCredibility: number;

    /** Coverage completeness (0-1) */
    completeness: number;
  };

  /** Research process metadata */
  metadata: {
    /** Start time */
    startedAt: Date;

    /** Completion time */
    completedAt: Date;

    /** Total duration in milliseconds */
    durationMs: number;

    /** Number of queries made */
    queryCount: number;
  };
}

/**
 * Result from search grounding operation
 */
export interface SearchGroundingResult {
  /** Original query */
  query: string;

  /** Search results */
  results: SearchResult[];

  /** Synthesized answer */
  synthesizedAnswer: string;

  /** Grounding confidence (0-1) */
  groundingConfidence: number;

  /** Related queries suggested */
  relatedQueries?: string[];

  /** Timestamp */
  timestamp: Date;
}

/**
 * Individual search result
 */
export interface SearchResult {
  /** Result title */
  title: string;

  /** Result URL */
  url: string;

  /** Snippet/excerpt */
  snippet: string;

  /** Relevance score (0-1) */
  relevanceScore: number;

  /** Source domain */
  domain: string;

  /** Publication date if available */
  publishedDate?: Date;
}

/**
 * Research query parameters
 */
export interface ResearchQuery {
  /** Main topic to research */
  topic: string;

  /** Historical era to focus on */
  era: Era;

  /** Specific aspects to investigate */
  aspects?: ('clothing' | 'architecture' | 'daily-life' | 'art' | 'events')[];

  /** Minimum number of sources required */
  minSources?: number;

  /** Preferred source types */
  preferredSourceTypes?: ResearchSource['type'][];

  /** Language preference */
  language?: 'korean' | 'english' | 'both';

  /** Depth of research */
  depth?: 'quick' | 'standard' | 'deep';
}
