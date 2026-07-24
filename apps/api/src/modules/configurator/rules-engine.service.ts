import { Injectable } from '@nestjs/common';
import type {
  ConfigSchemaDefinition,
  EvaluationResult,
  OptionGroup,
  PriceLine,
  Rule,
  RuleCondition,
  Selections,
} from './schema.types';

/**
 * Pure, deterministic rules engine. No I/O, no side effects — trivially unit
 * tested. Evaluates a configuration against a schema and reports disabled
 * options, validation errors, price/lead-time adjustments, and approval needs.
 */
@Injectable()
export class RulesEngineService {
  evaluate(def: ConfigSchemaDefinition, rawSelections: Selections): EvaluationResult {
    const selections = this.applyDefaults(def, rawSelections);
    const errors: string[] = [];
    const disabledChoices: { group: string; choice: string }[] = [];
    const disabledGroups = new Set<string>();
    const priceLines: PriceLine[] = [];
    let leadTimeDays = def.baseLeadTimeDays ?? 0;
    let approvalRequired = false;

    // 1. Apply rules (conditions AND-ed).
    for (const rule of def.rules ?? []) {
      if (!this.matches(rule, selections)) continue;
      for (const action of rule.then) {
        switch (action.action) {
          case 'disableChoice':
            disabledChoices.push({ group: action.group, choice: action.choice });
            break;
          case 'disableGroup':
            disabledGroups.add(action.group);
            break;
          case 'requireApproval':
            approvalRequired = true;
            break;
          case 'addPrice':
            priceLines.push({
              key: `rule:${rule.id}`,
              label: rule.description ?? 'Rule adjustment',
              amount: action.amount,
            });
            break;
          case 'addLeadTime':
            leadTimeDays += action.days;
            break;
          case 'error':
            errors.push(action.message);
            break;
        }
      }
    }

    // 2. Per-group validation + price/lead-time from chosen options.
    for (const group of def.groups) {
      const value = selections[group.key];
      const isDisabledGroup = disabledGroups.has(group.key);

      if (group.required && (value === undefined || value === '') && !isDisabledGroup) {
        errors.push(`Please choose ${group.label}.`);
        continue;
      }
      if (value === undefined || isDisabledGroup) continue;

      if (group.type === 'number') {
        const num = Number(value);
        if (Number.isNaN(num)) {
          errors.push(`${group.label} must be a number.`);
        } else {
          if (group.min !== undefined && num < group.min) {
            errors.push(`${group.label} must be at least ${group.min}${group.unit ?? ''}.`);
          }
          if (group.max !== undefined && num > group.max) {
            errors.push(`${group.label} must be at most ${group.max}${group.unit ?? ''}.`);
          }
          if (group.pricePerUnitOver && num > group.pricePerUnitOver.threshold) {
            const extra =
              (num - group.pricePerUnitOver.threshold) * group.pricePerUnitOver.amount;
            priceLines.push({ key: group.key, label: `Extra ${group.label}`, amount: extra });
          }
        }
      } else if (group.type === 'select') {
        const choice = group.choices?.find((c) => c.id === value);
        if (!choice) {
          errors.push(`Invalid choice for ${group.label}.`);
        } else if (this.isChoiceDisabled(disabledChoices, group.key, choice.id)) {
          errors.push(`"${choice.label}" is not available with your current selection.`);
        } else {
          if (choice.priceDelta) {
            priceLines.push({
              key: `${group.key}:${choice.id}`,
              label: `${group.label}: ${choice.label}`,
              amount: choice.priceDelta,
            });
          }
          leadTimeDays += choice.leadTimeDays ?? 0;
          if (choice.requiresApproval) approvalRequired = true;
        }
      }
    }

    const priceAdjustment = priceLines.reduce((sum, l) => sum + l.amount, 0);

    return {
      valid: errors.length === 0,
      errors,
      disabledChoices,
      disabledGroups: [...disabledGroups],
      priceLines,
      priceAdjustment,
      leadTimeDays,
      approvalRequired,
      normalizedSelections: selections,
    };
  }

  private applyDefaults(def: ConfigSchemaDefinition, selections: Selections): Selections {
    const out: Selections = { ...selections };
    for (const group of def.groups) {
      if (out[group.key] === undefined && group.default !== undefined) {
        out[group.key] = group.default;
      }
    }
    return out;
  }

  private matches(rule: Rule, selections: Selections): boolean {
    return rule.when.every((cond) => this.conditionMatches(cond, selections));
  }

  private conditionMatches(cond: RuleCondition, selections: Selections): boolean {
    const value = selections[cond.group];
    if (cond.equals !== undefined && value !== cond.equals) return false;
    if (cond.gt !== undefined && !(Number(value) > cond.gt)) return false;
    if (cond.lt !== undefined && !(Number(value) < cond.lt)) return false;
    // A condition with none of equals/gt/lt matches simply if the group has a value.
    if (cond.equals === undefined && cond.gt === undefined && cond.lt === undefined) {
      return value !== undefined;
    }
    return true;
  }

  private isChoiceDisabled(
    disabled: { group: string; choice: string }[],
    group: string,
    choice: string,
  ): boolean {
    return disabled.some((d) => d.group === group && d.choice === choice);
  }

  /** Utility for UIs: list of {group, choice} that should render disabled. */
  disabledChoiceKeys(result: EvaluationResult): string[] {
    return result.disabledChoices.map((d) => `${d.group}:${d.choice}`);
  }

  /** Guard used by callers that must not proceed with an invalid config. */
  assertGroupsExist(def: ConfigSchemaDefinition): void {
    const seen = new Set<string>();
    for (const g of def.groups) {
      if (seen.has(g.key)) {
        throw new Error(`Duplicate option group key: ${g.key}`);
      }
      seen.add(g.key);
    }
  }

  groupByKey(def: ConfigSchemaDefinition, key: string): OptionGroup | undefined {
    return def.groups.find((g) => g.key === key);
  }
}
