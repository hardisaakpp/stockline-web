import { z } from "zod";

/** The shapes api-careers answers with. Every response is validated: a contract change fails loudly, not as a blank screen. */

export const cvSchema = z.object({
  fullName: z.string(),
  headline: z.string(),
  summary: z.string(),
  contact: z.object({
    email: z.string(),
    links: z.record(z.string(), z.string()),
    phone: z.string().nullable(),
    location: z.string().nullable(),
  }),
  experience: z.array(
    z.object({
      role: z.string(),
      organization: z.string(),
      from: z.string(),
      to: z.string().nullable(),
      achievements: z.array(z.string()),
      technologies: z.array(z.string()),
    }),
  ),
  projects: z.array(
    z.object({
      name: z.string(),
      description: z.string(),
      url: z.string().nullable(),
      technologies: z.array(z.string()),
    }),
  ),
  education: z.array(
    z.object({
      title: z.string(),
      institution: z.string(),
      from: z.string(),
      to: z.string().nullable(),
    }),
  ),
  skills: z.array(z.object({ name: z.string(), items: z.array(z.string()) })),
});
export type Cv = z.infer<typeof cvSchema>;

export const cvResponseSchema = z.object({ cv: cvSchema, saved: z.boolean() });

export const preferencesSchema = z.object({
  excludeTitles: z.array(z.string()),
  excludeText: z.array(z.string()),
  locations: z.array(z.string()),
  requiredTechnologies: z.array(z.string()),
});
export type Preferences = z.infer<typeof preferencesSchema>;

export const APPLICATION_STATUSES = ["Draft", "Confirmed", "Sent", "Discarded"] as const;
export type ApplicationStatus = (typeof APPLICATION_STATUSES)[number];
const statusSchema = z.enum(APPLICATION_STATUSES);

export const offersSchema = z.object({
  total: z.number(),
  excluded: z.number(),
  /** Offers whose affinity is still being computed. */
  pending: z.number(),
  offers: z.array(
    z.object({
      id: z.uuid(),
      title: z.string(),
      company: z.string(),
      location: z.string(),
      source: z.string(),
      alsoOn: z.array(z.string()),
      url: z.url(),
      publishedAt: z.string().nullable(),
      score: z.number(),
      matches: z.array(z.string()),
      applicationId: z.uuid().nullable(),
      applicationStatus: statusSchema.nullable(),
    }),
  ),
});
export type OfferList = z.infer<typeof offersSchema>;
export type OfferItem = OfferList["offers"][number];

export const refreshSchema = z.object({
  results: z.array(
    z.object({
      source: z.string(),
      outcome: z.enum(["Fetched", "Skipped", "Failed"]),
      read: z.number(),
      added: z.number(),
    }),
  ),
});
export type RefreshResult = z.infer<typeof refreshSchema>;

export const applicationListSchema = z.array(
  z.object({
    id: z.uuid(),
    status: statusSchema,
    offerId: z.uuid(),
    title: z.string(),
    company: z.string(),
    url: z.url(),
    updatedAt: z.string(),
  }),
);

export const applicationDetailSchema = z.object({
  id: z.uuid(),
  status: statusSchema,
  coverLetter: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
  offer: z.object({
    id: z.uuid(),
    title: z.string(),
    company: z.string(),
    location: z.string(),
    source: z.string(),
    url: z.url(),
  }),
});
export type ApplicationDetail = z.infer<typeof applicationDetailSchema>;

export const createdSchema = z.object({ id: z.uuid() });
export const statusResultSchema = z.object({ status: statusSchema });
