/**
 * Schema-driven configurator types.
 *
 * A ConfigSchema.definition is stored as JSONB and validated against this shape.
 * The rules engine is pure and deterministic: given a definition + a set of
 * selections, it returns which choices are disabled, any validation errors,
 * price/lead-time adjustments, and whether tailor approval is required.
 *
 * Non-technical staff edit these definitions through the Admin Rule Editor
 * (a JSON-schema-validated form); nothing here is hard-coded per garment.
 */

export type OptionType = 'select' | 'number' | 'boolean';

export interface OptionChoice {
  id: string;
  label: string;
  priceDelta?: number; // added to the garment price when chosen
  leadTimeDays?: number; // added production lead time when chosen
  requiresApproval?: boolean; // forces tailor approval when chosen
}

export interface OptionGroup {
  key: string; // e.g. "fabric", "collar", "garmentLength"
  label: string;
  type: OptionType;
  required?: boolean;
  // select
  choices?: OptionChoice[];
  // number (measurement-like)
  min?: number;
  max?: number;
  unit?: string; // "in" | "cm"
  pricePerUnitOver?: { threshold: number; amount: number }; // e.g. extra length surcharge
  // default selection
  default?: string | number | boolean;
}

export type RuleCondition = {
  group: string;
  equals?: string | number | boolean;
  gt?: number;
  lt?: number;
};

export type RuleAction =
  | { action: 'disableChoice'; group: string; choice: string }
  | { action: 'disableGroup'; group: string }
  | { action: 'requireApproval' }
  | { action: 'addPrice'; amount: number }
  | { action: 'addLeadTime'; days: number }
  | { action: 'error'; message: string };

export interface Rule {
  id: string;
  description?: string;
  when: RuleCondition[]; // all conditions must match (AND)
  then: RuleAction[];
}

export interface ConfigSchemaDefinition {
  currency?: string;
  baseLeadTimeDays?: number;
  groups: OptionGroup[];
  rules?: Rule[];
}

export type Selections = Record<string, string | number | boolean>;

export interface PriceLine {
  key: string;
  label: string;
  amount: number;
}

export interface EvaluationResult {
  valid: boolean;
  errors: string[];
  disabledChoices: { group: string; choice: string }[];
  disabledGroups: string[];
  priceLines: PriceLine[]; // itemized option-driven costs (excludes base/tax/shipping)
  priceAdjustment: number; // sum of priceLines
  leadTimeDays: number; // base + applicable additions
  approvalRequired: boolean;
  normalizedSelections: Selections;
}
