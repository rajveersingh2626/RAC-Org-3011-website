import { useState } from 'react';
import { z } from 'zod';
import { Button } from '@/components/ui/Button';
import { Combobox, type ComboboxOption } from '@/components/ui/Combobox';
import { Field } from '@/components/ui/Field';
import { FileUpload, type FileUploadValue } from '@/components/ui/FileUpload';
import { Form, useZodForm } from '@/components/ui/Form';
import { Input } from '@/components/ui/Input';
import { MultiSelect } from '@/components/ui/MultiSelect';
import { TagInput } from '@/components/ui/TagInput';
import { KitEntry, KitGrid, KitSection } from './KitEntry';

const CLUB_OPTIONS: ComboboxOption[] = [
  { value: 'dynamic-leaders', label: 'Dynamic Leaders', hint: 'Zone 3' },
  { value: 'bravehearts', label: 'BraveHearts', hint: 'Zone 1' },
  { value: 'sundowners', label: 'Sundowners', hint: 'Zone 2' },
];

const SKILL_OPTIONS: ComboboxOption[] = [
  { value: 'photography', label: 'Photography' },
  { value: 'graphic-design', label: 'Graphic design' },
  { value: 'public-speaking', label: 'Public speaking' },
];

const reportSchema = z.object({ notes: z.string().min(1, 'Notes are required') });

function FormDemo() {
  const form = useZodForm(reportSchema, { notes: '' });
  return (
    <Form submitting={form.submitting} onSubmit={form.handleSubmit(() => undefined)}>
      <Field label="Notes for the district" required error={form.errors.notes}>
        <Input value={form.values.notes} onChange={(e) => form.setValue('notes', e.target.value)} />
      </Field>
      <Button type="submit" size="sm">
        Submit
      </Button>
    </Form>
  );
}

export function KitFormsAdvanced() {
  const [club, setClub] = useState<string | null>('dynamic-leaders');
  const [skills, setSkills] = useState<string[]>(['photography']);
  const [tags, setTags] = useState<string[]>(['fundraising']);
  const [file, setFile] = useState<FileUploadValue | null>(null);

  return (
    <KitSection title="Forms — advanced" description="Search, multi-select, tagging, uploads, and the Zod form helper.">
      <KitGrid>
        <KitEntry name="Combobox">
          <Combobox options={CLUB_OPTIONS} value={club} onChange={setClub} label="Club" placeholder="Search clubs" />
        </KitEntry>
        <KitEntry name="MultiSelect">
          <MultiSelect options={SKILL_OPTIONS} values={skills} onChange={setSkills} label="Skills" placeholder="Add skills" />
        </KitEntry>
        <KitEntry name="TagInput">
          <TagInput values={tags} onChange={setTags} suggestions={['fundraising', 'events', 'media']} label="Focus areas" placeholder="Add a tag" />
        </KitEntry>
        <KitEntry name="FileUpload">
          <FileUpload tier="dynamic" resourceType="ui-kit-demo" value={file} onChange={setFile} label="Event photo" />
        </KitEntry>
        <KitEntry name="Form + useZodForm" className="sm:col-span-2">
          <FormDemo />
        </KitEntry>
      </KitGrid>
    </KitSection>
  );
}
