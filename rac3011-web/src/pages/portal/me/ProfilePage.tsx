import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';
import { useAuth } from '@/app/auth';
import { apiFetch, ApiError } from '@/lib/api';
import { fetchSkillTags } from '@/lib/members/api';
import { useDocumentMeta } from '@/lib/meta';
import { Container } from '@/components/ui/Container';
import { Section } from '@/components/ui/Section';
import { Card } from '@/components/ui/Card';
import { Form, useZodForm } from '@/components/ui/Form';
import { Field } from '@/components/ui/Field';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { TagInput } from '@/components/ui/TagInput';
import { Switch } from '@/components/ui/Switch';
import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';
import { Chip } from '@/components/ui/Chip';
import { KeyValue } from '@/components/ui/KeyValue';
import { useToast } from '@/components/ui/Toast';

const profileSchema = z.object({
  fullName: z.string().trim().min(1, 'Your name is required').max(120),
  phone: z.string().trim().max(32),
  bio: z.string().max(240),
  rotaryId: z.string().trim().max(64),
  photoUrl: z.string().trim(),
  skills: z.array(z.string()),
  interests: z.array(z.string()),
  directoryOptIn: z.boolean(),
});

type ProfileValues = z.infer<typeof profileSchema>;

export function ProfilePage() {
  useDocumentMeta({ title: 'Your profile' });
  const { me, refresh } = useAuth();
  const qc = useQueryClient();
  const { toast } = useToast();
  const skillTagsQuery = useQuery({ queryKey: ['skill-tags'], queryFn: fetchSkillTags });
  const skillSuggestions = (skillTagsQuery.data ?? []).filter((t) => t.kind === 'skill').map((t) => t.label);
  const interestSuggestions = (skillTagsQuery.data ?? []).filter((t) => t.kind === 'interest').map((t) => t.label);

  const initial: ProfileValues = {
    fullName: me?.profile?.fullName ?? me?.user.name ?? '',
    phone: me?.profile?.phone ?? '',
    bio: me?.profile?.bio ?? '',
    rotaryId: me?.profile?.rotaryId ?? '',
    photoUrl: me?.profile?.photoUrl ?? '',
    skills: me?.profile?.skills ?? [],
    interests: me?.profile?.interests ?? [],
    directoryOptIn: me?.profile?.directoryOptIn ?? false,
  };
  const form = useZodForm(profileSchema, initial);

  // me.profile arrives async (auth resolves after mount); seed the form once it lands.
  const [seeded, setSeeded] = useState(false);
  useEffect(() => {
    if (!seeded && me?.profile) {
      form.reset();
      setSeeded(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [me?.profile, seeded]);

  const club = me?.clubs.find((c) => c.id === me.profile?.clubId);

  const mutation = useMutation({
    mutationFn: (values: ProfileValues) =>
      apiFetch('/me', {
        method: 'PATCH',
        body: {
          fullName: values.fullName,
          phone: values.phone || null,
          bio: values.bio || null,
          rotaryId: values.rotaryId || null,
          photoUrl: values.photoUrl || null,
          skills: values.skills,
          interests: values.interests,
          directoryOptIn: values.directoryOptIn,
        },
      }),
    onSuccess: async () => {
      await refresh();
      await qc.invalidateQueries({ queryKey: ['me'] });
      toast({ title: 'Profile saved', tone: 'success' });
    },
    onError: (e) => {
      if (e instanceof ApiError && e.details) form.setServerErrors(e.details);
      else toast({ title: 'Could not save your profile', tone: 'error' });
    },
  });

  const submit = form.handleSubmit((values) => mutation.mutate(values));

  return (
    <Container width="wide">
      <Section
        eyebrow="Everything here is optional except your name"
        title="Your profile"
        description="What other Rotaractors see, and what stays between you and your club."
      >
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1.4fr_1fr]">
          <Card>
            <Form onSubmit={submit} submitting={mutation.isPending}>
              <p className="m-0 text-[10.5px] font-bold tracking-[1px] text-fg-3">PHOTOGRAPH</p>
              <Field label="Photo link" error={form.errors.photoUrl} hint="Paste a Drive or Photos link. Square works best.">
                <Input
                  value={form.values.photoUrl}
                  onChange={(e) => form.setValue('photoUrl', e.target.value)}
                  placeholder="https://"
                />
              </Field>

              <p className="m-0 mt-2 text-[10.5px] font-bold tracking-[1px] text-fg-3">WHO YOU ARE</p>
              <Field label="Name" error={form.errors.fullName} required>
                <Input value={form.values.fullName} onChange={(e) => form.setValue('fullName', e.target.value)} />
              </Field>
              <Field label="Club" hint="Set by your club">
                <Input value={club?.name ?? ''} disabled />
              </Field>
              <Field label="A line about you" error={form.errors.bio} hint="Shown in the directory. 240 characters.">
                <Textarea
                  rows={2}
                  maxLength={240}
                  value={form.values.bio}
                  onChange={(e) => form.setValue('bio', e.target.value)}
                />
              </Field>
              <Field label="Rotary ID" error={form.errors.rotaryId} hint="Optional">
                <Input value={form.values.rotaryId} onChange={(e) => form.setValue('rotaryId', e.target.value)} />
              </Field>
              <Field label="Phone" error={form.errors.phone} hint="Visible to officers only">
                <Input
                  type="tel"
                  value={form.values.phone}
                  onChange={(e) => form.setValue('phone', e.target.value)}
                />
              </Field>

              <p className="m-0 mt-2 text-[10.5px] font-bold tracking-[1px] text-fg-3">SKILLS</p>
              <Field label="What the directory searches" error={undefined}>
                <TagInput
                  values={form.values.skills}
                  onChange={(v) => form.setValue('skills', v)}
                  suggestions={skillSuggestions}
                  maxTags={5}
                  placeholder="Add a skill"
                />
              </Field>

              <p className="m-0 mt-2 text-[10.5px] font-bold tracking-[1px] text-fg-3">INTERESTS</p>
              <Field label="Causes you care about" error={undefined}>
                <TagInput
                  values={form.values.interests}
                  onChange={(v) => form.setValue('interests', v)}
                  suggestions={interestSuggestions}
                  maxTags={5}
                  placeholder="Add an interest"
                />
              </Field>

              <p className="m-0 mt-2 text-[10.5px] font-bold tracking-[1px] text-fg-3">DIRECTORY</p>
              <Switch
                checked={form.values.directoryOptIn}
                onChange={(checked) => form.setValue('directoryOptIn', checked)}
                label="Appear in the district directory"
                description="Off means members cannot find you by skill. Officers can still see your record."
              />

              <Button type="submit" loading={mutation.isPending}>
                Save changes
              </Button>
              <p className="m-0 text-[11px] text-fg-3">Nothing is saved until you press this.</p>
            </Form>
          </Card>

          <Card tone="dashed">
            <p className="m-0 mb-3 text-[10.5px] font-bold tracking-[1px] text-fg-3">
              HOW YOU APPEAR IN THE DIRECTORY
            </p>
            <div className="flex items-start gap-3">
              <Avatar name={form.values.fullName || 'Member'} src={form.values.photoUrl || undefined} size="lg" />
              <div className="min-w-0">
                <p className="m-0 text-[13.5px] font-extrabold text-fg">{form.values.fullName || 'Your name'}</p>
                <p className="m-0 text-[11.5px] text-fg-3">
                  {club?.name ?? 'Your club'}
                  {club?.zoneId ? ` · Zone` : ''}
                </p>
                {form.values.bio ? <p className="m-0 mt-1 text-[12px] text-fg-2">{form.values.bio}</p> : null}
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {form.values.skills.map((s) => (
                    <Chip key={s} label={s} />
                  ))}
                </div>
              </div>
            </div>
            {!form.values.directoryOptIn && (
              <p className="m-0 mt-3 text-[11.5px] text-fg-3">
                You&apos;re currently opted out &ndash; this preview is what you&apos;d look like if you opt in.
              </p>
            )}
            <div className="mt-4">
              <KeyValue
                items={[
                  { label: 'Status', value: me?.profile?.status ?? 'approved' },
                  {
                    label: 'Member since',
                    value: me?.profile?.membershipAnniversary
                      ? new Date(me.profile.membershipAnniversary).toLocaleDateString('en-IN', {
                          month: 'long',
                          year: 'numeric',
                        })
                      : 'Set by your club',
                  },
                ]}
              />
            </div>
          </Card>
        </div>
      </Section>
    </Container>
  );
}
