import { z } from 'zod';

export const scopeSchema = z.object({
  type: z.enum(['none', 'club', 'zone', 'project']),
  id: z.string().optional(),
});
export type Scope = z.infer<typeof scopeSchema>;

export const meSchema = z.object({
  user: z.object({ id: z.string(), name: z.string(), email: z.string(), twoFactorEnabled: z.boolean() }),
  profile: z
    .object({
      id: z.string().optional(),
      fullName: z.string().optional(),
      email: z.string().optional(),
      phone: z.string().nullable().optional(),
      rotaryId: z.string().nullable().optional(),
      clubId: z.string().nullable().optional(),
      photoUrl: z.string().nullable().optional(),
      bio: z.string().nullable().optional(),
      skills: z.array(z.string()).optional(),
      interests: z.array(z.string()).optional(),
      membershipAnniversary: z.string().nullable().optional(),
      status: z.enum(['pending', 'approved', 'suspended']).optional(),
      directoryOptIn: z.boolean().optional(),
      isDacMember: z.boolean().optional(),
      themePreference: z.enum(['light', 'dark', 'system']).nullable().optional(),
    })
    .passthrough()
    .nullable(),
  roles: z.array(z.object({ roleKey: z.string(), scope: scopeSchema })),
  grants: z.record(z.string(), z.array(scopeSchema)),
  clubs: z.array(z.object({ id: z.string(), name: z.string(), shortName: z.string(), zoneId: z.string().nullable() })),
  theme: z.enum(['light', 'dark', 'system']).nullable().optional(),
});
export type Me = z.infer<typeof meSchema>;
