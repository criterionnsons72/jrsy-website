import { validateConfigDefinition } from './schema.validation';

describe('validateConfigDefinition', () => {
  it('accepts a well-formed schema', () => {
    const r = validateConfigDefinition({
      currency: 'PKR',
      groups: [
        {
          key: 'fabric',
          label: 'Fabric',
          type: 'select',
          choices: [{ id: 'cotton', label: 'Cotton' }],
        },
      ],
      rules: [
        {
          id: 'r1',
          when: [{ group: 'fabric', equals: 'cotton' }],
          then: [{ action: 'addPrice', amount: 100 }],
        },
      ],
    });
    expect(r.ok).toBe(true);
  });

  it('rejects a schema with no groups', () => {
    const r = validateConfigDefinition({ groups: [] });
    expect(r.ok).toBe(false);
  });

  it('rejects a select group without choices', () => {
    const r = validateConfigDefinition({
      groups: [{ key: 'x', label: 'X', type: 'select' }],
    });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errors.join(' ')).toMatch(/choice/i);
  });

  it('rejects an unknown rule action', () => {
    const r = validateConfigDefinition({
      groups: [{ key: 'x', label: 'X', type: 'boolean' }],
      rules: [{ id: 'r', when: [{ group: 'x' }], then: [{ action: 'nope' }] }],
    });
    expect(r.ok).toBe(false);
  });
});
