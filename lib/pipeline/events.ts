import type { ApifyError, RestaurantCandidate } from '@/lib/apify/types';
import type { KimiError } from '@/lib/kimi/schemas';
import type { ValidationError, ValidatedRecommendation } from '@/lib/pipeline/validator';
import type { AlternativeTag } from '@/lib/types';

export type PipelinePhase =
  | 'address_received'
  | 'searching_restaurants'
  | 'picking_candidates'
  | 'fetching_menu'
  | 'picking_dish'
  | 'validating'
  | 'done'
  | 'error';

export interface AlternativeOption {
  candidate: RestaurantCandidate;
  tag: AlternativeTag;
}

export type PipelineError =
  | { code: 'no_candidates'; message: string }
  | { code: 'menu_fetch_failed'; cause: ApifyError }
  | { code: 'kimi_drift'; cause: KimiError }
  | { code: 'allergen_violation'; cause: ValidationError }
  | { code: 'validator_reject'; cause: ValidationError }
  | { code: 'aborted' }
  | { code: 'unknown'; cause: string };

export type LogStage = 'looking' | 'matching' | 'ranking' | 'ready';
export type LogKind = 'system' | 'info' | 'read' | 'flag' | 'pick';

export interface LogEntry {
  ts: number;
  stage: LogStage;
  kind: LogKind;
  text: string;
  count?: string;
  status?: string;
}

export type PipelineEvent =
  | { type: 'phase'; phase: PipelinePhase }
  | { type: 'log'; entry: LogEntry }
  | { type: 'candidates'; hero: RestaurantCandidate; alternatives: AlternativeOption[] }
  | { type: 'result'; recommendation: ValidatedRecommendation; deep_link: string }
  | { type: 'error'; error: PipelineError };

export function serializeEvent(event: PipelineEvent): string {
  return `event: ${event.type}\ndata: ${JSON.stringify(event)}\n\n`;
}
