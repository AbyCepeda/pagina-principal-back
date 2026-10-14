import { calculateQuote } from './quote-estimator';

const plan = {
  slug: 'landing-basica',
  name: 'Landing actual',
  subtitle: '',
  description: '',
  idealFor: '',
};

describe('Authoritative quote calculation', () => {
  it('calculates a base plan without extras', () => {
    expect(calculateQuote(plan, [])).toMatchObject({
      quoteMinPrice: 5000,
      quoteMaxPrice: 9000,
      quoteComplexity: 'Baja',
      quoteEstimatedTime: '1 a 2 semanas',
    });
  });
  it('calculates multiple extras from server prices', () => {
    expect(
      calculateQuote(plan, ['custom-design', 'admin-panel']),
    ).toMatchObject({
      quoteMinPrice: 12500,
      quoteMaxPrice: 23000,
      quoteComplexity: 'Media',
      quoteEstimatedTime: '1 a 4 semanas',
      quotePlanName: 'Landing actual',
    });
  });
  it.each([['unknown'], ['custom-design', 'custom-design']])(
    'rejects unknown or duplicate extras: %j',
    (...ids) => {
      expect(() => calculateQuote(plan, ids)).toThrow();
    },
  );
  it('keeps the previous default price for custom plans', () => {
    expect(calculateQuote({ ...plan, slug: 'custom-plan' }, [])).toMatchObject({
      quoteMinPrice: 8000,
      quoteMaxPrice: 15000,
    });
  });
});
