import { describe, expect, it } from 'vitest';
import type { ReportField } from './types';
import {
  activitiesOf,
  activitySummaryDetail,
  activitySummaryLabel,
  defaultValueForField,
  emptyActivity,
  formatFieldValue,
  humanize,
  isActivityFilled,
  linkAllowsMultiple,
  sectionsOf,
  selectChoices,
  splitFields,
} from './values';

function field(overrides: Partial<ReportField>): ReportField {
  return {
    id: overrides.fieldKey ?? 'f',
    section: 'Section',
    fieldKey: 'field_key',
    label: 'Label',
    type: 'text',
    options: null,
    required: false,
    order: 0,
    helpText: null,
    perActivity: false,
    pointSourceKey: null,
    ...overrides,
  };
}

describe('splitFields', () => {
  it('separates top-level, per-activity, and the notes field', () => {
    const fields = [
      field({ fieldKey: 'physical_meetings', order: 2 }),
      field({ fieldKey: 'activity_title', perActivity: true, order: 0 }),
      field({ fieldKey: 'notes', order: 3, section: 'Notes' }),
    ];
    const { topFields, activityFields, notesField } = splitFields(fields);
    expect(topFields.map((f) => f.fieldKey)).toEqual(['physical_meetings']);
    expect(activityFields.map((f) => f.fieldKey)).toEqual(['activity_title']);
    expect(notesField?.fieldKey).toBe('notes');
  });

  it('sorts by order', () => {
    const fields = [field({ fieldKey: 'b', order: 2 }), field({ fieldKey: 'a', order: 1 })];
    expect(splitFields(fields).topFields.map((f) => f.fieldKey)).toEqual(['a', 'b']);
  });
});

describe('sectionsOf', () => {
  it('groups fields by first-seen section order', () => {
    const fields = [
      field({ fieldKey: 'a', section: 'Club', order: 0 }),
      field({ fieldKey: 'b', section: 'Activity', order: 1 }),
      field({ fieldKey: 'c', section: 'Club', order: 2 }),
    ];
    const sections = sectionsOf(fields);
    expect(sections.map((s) => s.section)).toEqual(['Club', 'Activity']);
    expect(sections[0].fields.map((f) => f.fieldKey)).toEqual(['a', 'c']);
  });
});

describe('selectChoices / linkAllowsMultiple', () => {
  it('reads choices out of options', () => {
    expect(selectChoices({ choices: ['a', 'b'] })).toEqual(['a', 'b']);
    expect(selectChoices(null)).toEqual([]);
    expect(selectChoices({})).toEqual([]);
  });

  it('reads multiple out of options', () => {
    expect(linkAllowsMultiple({ multiple: true })).toBe(true);
    expect(linkAllowsMultiple({ multiple: false })).toBe(false);
    expect(linkAllowsMultiple(null)).toBe(false);
  });
});

describe('humanize', () => {
  it('turns snake_case into Title Case', () => {
    expect(humanize('area_of_focus')).toBe('Area Of Focus');
    expect(humanize('community')).toBe('Community');
  });
});

describe('defaultValueForField / emptyActivity', () => {
  it('gives type-appropriate defaults', () => {
    expect(defaultValueForField(field({ type: 'boolean' }))).toBe(false);
    expect(defaultValueForField(field({ type: 'multiselect' }))).toEqual([]);
    expect(defaultValueForField(field({ type: 'clubs' }))).toEqual([]);
    expect(defaultValueForField(field({ type: 'link', options: { multiple: true } }))).toEqual([]);
    expect(defaultValueForField(field({ type: 'link' }))).toBe('');
    expect(defaultValueForField(field({ type: 'number' }))).toBe('');
    expect(defaultValueForField(field({ type: 'text' }))).toBe('');
  });

  it('builds a blank activity object keyed by fieldKey', () => {
    const fields = [field({ fieldKey: 'activity_title', type: 'text' }), field({ fieldKey: 'people_reached', type: 'number' })];
    expect(emptyActivity(fields)).toEqual({ activity_title: '', people_reached: '' });
  });
});

describe('activitiesOf', () => {
  it('returns the activities array or an empty array', () => {
    expect(activitiesOf({ activities: [{ a: 1 }] })).toEqual([{ a: 1 }]);
    expect(activitiesOf({})).toEqual([]);
    expect(activitiesOf(null)).toEqual([]);
    expect(activitiesOf(undefined)).toEqual([]);
  });
});

describe('activitySummaryLabel / activitySummaryDetail', () => {
  it('prefers activity_title, falls back to any string field', () => {
    expect(activitySummaryLabel({ activity_title: 'Blood camp' })).toBe('Blood camp');
    expect(activitySummaryLabel({ other: 'Something' })).toBe('Something');
    expect(activitySummaryLabel({})).toBe('Untitled activity');
  });

  it('builds a compact detail line from known keys', () => {
    const detail = activitySummaryDetail({
      activity_date: '2026-08-24',
      avenue: 'community',
      people_reached: 180,
      collaborating_clubs: ['club_a', 'club_b'],
    });
    expect(detail).toBe('2026-08-24 · Community · 180 reached · 2 collaborators');
  });
});

describe('isActivityFilled', () => {
  it('checks only required fields', () => {
    const fields = [field({ fieldKey: 'a', required: true }), field({ fieldKey: 'b', required: false })];
    expect(isActivityFilled({ a: 'x' }, fields)).toBe(true);
    expect(isActivityFilled({ a: '' }, fields)).toBe(false);
    expect(isActivityFilled({}, fields)).toBe(false);
  });
});

describe('formatFieldValue', () => {
  it('formats each type for display', () => {
    expect(formatFieldValue(field({ type: 'boolean' }), true)).toBe('Yes');
    expect(formatFieldValue(field({ type: 'boolean' }), false)).toBe('No');
    expect(formatFieldValue(field({ type: 'multiselect' }), ['a', 'b'])).toBe('a, b');
    expect(formatFieldValue(field({ type: 'multiselect' }), [])).toBe('—');
    expect(formatFieldValue(field({ type: 'select' }), 'area_of_focus')).toBe('Area Of Focus');
    expect(formatFieldValue(field({ type: 'text' }), null)).toBe('—');
    expect(formatFieldValue(field({ type: 'text' }), 'hello')).toBe('hello');
    expect(formatFieldValue(field({ type: 'link' }), ['https://a', 'https://b'])).toBe('2 link(s)');
  });
});
