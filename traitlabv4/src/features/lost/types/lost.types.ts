/**
 * Type definitions for LOST timeline data
 */

export type EventStatus = 'completed' | 'in-progress' | 'future' | 'announced';

export type EventCategory =
  | 'announcement'
  | 'bot'
  | 'infrastructure'
  | 'mint'
  | 'social'
  | 'feature'
  | 'dapp'
  | 'marketplace'
  | 'community'
  | 'launch'
  | 'update';

export interface EventLink {
  text: string;
  url: string;
}

export interface Event {
  emoji: string;
  title: string;
  description: string;
  status: EventStatus;
  category: EventCategory;
  stats?: Record<string, any>;
  links?: EventLink[];
}

export interface Week {
  weekNumber: number;
  date: string;
  title: string;
  events: Event[];
}

export interface LostData {
  startDate: string;
  weeks: Week[];
}

export type YearOption = 'all' | '2025' | '2026' | null;
