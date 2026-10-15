import { calculateQuote, getQuoteCatalog, planScopes } from './quote-estimator';

const plan = {
  slug: 'landing-basica',
  name: 'Landing actual',
  subtitle: '',
  description: '',
  idealFor: '',
};

describe('Authoritative hour-based quotes', () => {
  it('includes base scope, QA and reserve once', () => {
    expect(calculateQuote(plan, [])).toMatchObject({
      quoteMinPrice: 12600,
      quoteMaxPrice: 27000,
      quoteEstimatedTime: '3 a 5 semanas',
      quoteSnapshot: {
        effort: {
          workHours: { min: 36, max: 78 },
          reserveHours: { min: 6, max: 12 },
          totalHours: { min: 42, max: 90 },
        },
      },
    });
  });
  it('adds only the work introduced by a new extra', () => {
    expect(calculateQuote(plan, ['custom-design'])).toMatchObject({
      quoteMinPrice: 17700,
      quoteMaxPrice: 38100,
      quoteSnapshot: { effort: { totalHours: { min: 59, max: 127 } } },
    });
  });
  it.each(Object.keys(planScopes))(
    'does not charge included extras again for %s',
    (slug) => {
      const selectedPlan = { ...plan, slug };
      const base = calculateQuote(selectedPlan, []);
      const extras = getQuoteCatalog().plans[slug].includedExtraIds;
      const selected = calculateQuote(selectedPlan, extras);
      expect(selected.quoteSnapshot.effort).toEqual(base.quoteSnapshot.effort);
      expect(selected.quoteExtras.every((extra) => extra.included)).toBe(true);
      expect(base.quoteSnapshot.effort.status).toBe('preliminary');
    },
  );
  it('deduplicates overlapping extras regardless of order', () => {
    const panel = calculateQuote(plan, ['admin-panel']);
    for (const ids of [
      ['admin-panel', 'auth-roles', 'database'],
      ['database', 'auth-roles', 'admin-panel'],
    ]) {
      expect(calculateQuote(plan, ids).quoteSnapshot.effort).toEqual(
        panel.quoteSnapshot.effort,
      );
    }
  });
  it.each([['unknown'], ['custom-design', 'custom-design']])(
    'rejects unknown or duplicate extras: %j',
    (...ids) => {
      expect(() => calculateQuote(plan, ids)).toThrow();
    },
  );
  it.each(['custom-plan', 'constructor', '__proto__'])(
    'leaves unknown scope %s pending, even with extras',
    (slug) => {
      expect(
        calculateQuote({ ...plan, slug }, ['custom-design']),
      ).toMatchObject({
        quoteMinPrice: null,
        quoteMaxPrice: null,
        quoteSnapshot: {
          effort: { status: 'needs-scope', price: null, weeks: null },
        },
      });
    },
  );
});
