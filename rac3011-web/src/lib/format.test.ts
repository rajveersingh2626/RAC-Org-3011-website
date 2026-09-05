import { titleCaseSlug } from './format';

describe('titleCaseSlug', () => {
  it('title-cases hyphen and underscore separated words', () => {
    expect(titleCaseSlug('officer-guides')).toBe('Officer Guides');
    expect(titleCaseSlug('brand_assets')).toBe('Brand Assets');
  });

  it('leaves a single word capitalised', () => {
    expect(titleCaseSlug('documents')).toBe('Documents');
  });
});
