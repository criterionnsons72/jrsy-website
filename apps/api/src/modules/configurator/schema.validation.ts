import { z } from 'zod';

/**
 * Zod validation for a ConfigSchema definition edited through the Admin Rule
 * Editor. Rejects malformed schemas before they are saved, so non-technical
 * staff can't publish a broken configurator.
 */

const choice = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  priceDelta: z.number().optional(),
  leadTimeDays: z.number().int().nonnegative().optional(),
  requiresApproval: z.boolean().optional(),
});

const group = z
  .object({
    key: z.string().min(1),
    label: z.string().min(1),
    type: z.enum(['select', 'number', 'boolean']),
    required: z.boolean().optional(),
    choices: z.array(choice).optional(),
    min: z.number().optional(),
    max: z.number().optional(),
    unit: z.string().optional(),
    pricePerUnitOver: z.object({ threshold: z.number(), amount: z.number() }).optional(),
    default: z.union([z.string(), z.number(), z.boolean()]).optional(),
  })
  .refine((g) => (g.type === 'select' ? (g.choices?.length ?? 0) > 0 : true), {
    message: 'Select groups need at least one choice.',
  });

const condition = z.object({
  group: z.string().min(1),
  equals: z.union([z.string(), z.number(), z.boolean()]).optional(),
  gt: z.number().optional(),
  lt: z.number().optional(),
});

const action = z.union([
  z.object({ action: z.literal('disableChoice'), group: z.string(), choice: z.string() }),
  z.object({ action: z.literal('disableGroup'), group: z.string() }),
  z.object({ action: z.literal('requireApproval') }),
  z.object({ action: z.literal('addPrice'), amount: z.number() }),
  z.object({ action: z.literal('addLeadTime'), days: z.number().int() }),
  z.object({ action: z.literal('error'), message: z.string() }),
]);

const rule = z.object({
  id: z.string().min(1),
  description: z.string().optional(),
  when: z.array(condition).min(1),
  then: z.array(action).min(1),
});

export const configDefinitionSchema = z.object({
  currency: z.string().optional(),
  baseLeadTimeDays: z.number().int().nonnegative().optional(),
  groups: z.array(group).min(1, 'Add at least one option group.'),
  rules: z.array(rule).optional(),
});

export type ValidatedConfigDefinition = z.infer<typeof configDefinitionSchema>;

export function validateConfigDefinition(input: unknown):
  | { ok: true; value: ValidatedConfigDefinition }
  | { ok: false; errors: string[] } {
  const parsed = configDefinitionSchema.safeParse(input);
  if (parsed.success) return { ok: true, value: parsed.data };
  return {
    ok: false,
    errors: parsed.error.issues.map((i) => `${i.path.join('.') || 'definition'}: ${i.message}`),
  };
}
