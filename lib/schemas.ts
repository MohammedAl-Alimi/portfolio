import { z } from "zod";

export const SHAPE_NAMES = [
  "sphere",
  "box",
  "icosahedron",
  "torusKnot",
  "capsule",
  "octahedron",
] as const;
export type ShapeName = (typeof SHAPE_NAMES)[number];

export const TAG_NAMES = [
  "ai",
  "computer-vision",
  "agents",
  "security",
  "data",
  "web",
  "privacy",
] as const;
export type TagName = (typeof TAG_NAMES)[number];

const hexColor = z.string().regex(/^#[0-9A-Fa-f]{6}$/, "must be a 6 digit hex color like #FF6B35");

const httpsUrl = z
  .url()
  .refine((value) => new URL(value).protocol === "https:", "must be an https url");

const linkedinUrl = httpsUrl.refine((value) => {
  const host = new URL(value).hostname;
  return host === "www.linkedin.com" || host === "linkedin.com";
}, "must be a linkedin.com url");

export const projectFrontmatterSchema = z
  .strictObject({
    title: z.string().min(1).max(80),
    slug: z.string().regex(/^[a-z0-9-]+$/, "must be lowercase letters, numbers and dashes"),
    tagline: z.string().min(1).max(120),
    color: hexColor,
    shape: z.enum(SHAPE_NAMES),
    tags: z.array(z.enum(TAG_NAMES)).min(1).max(5),
    year: z.number().int().min(2018).max(2100),
    role: z.string().min(1),
    featured: z.boolean().default(false),
    order: z.number().int().default(99),
    links: z
      .strictObject({
        repo: httpsUrl.optional(),
        live: httpsUrl.optional(),
        demo: httpsUrl.optional(),
      })
      .default({}),
    cover: z.string().startsWith("/projects/").optional(),
    coverAlt: z.string().min(1).optional(),
    stack: z.array(z.string().min(1)).min(1).max(12),
  })
  .refine((value) => value.cover === undefined || value.coverAlt !== undefined, {
    path: ["coverAlt"],
    message: "is required when cover is set",
  });

export const labFrontmatterSchema = z
  .strictObject({
    title: z.string().min(1).max(80),
    slug: z.string().regex(/^[a-z0-9-]+$/, "must be lowercase letters, numbers and dashes"),
    description: z.string().min(1).max(140),
    kind: z.enum(["component", "iframe"]),
    component: z.string().min(1).optional(),
    url: httpsUrl.optional(),
    thumbnail: z.string().startsWith("/lab/"),
    thumbnailAlt: z.string().min(1),
    order: z.number().int().default(99),
  })
  .superRefine((value, ctx) => {
    if (value.kind === "component" && value.component === undefined) {
      ctx.addIssue({ code: "custom", path: ["component"], message: "is required when kind is component" });
    }
    if (value.kind === "iframe" && value.url === undefined) {
      ctx.addIssue({ code: "custom", path: ["url"], message: "is required when kind is iframe" });
    }
  });

export const highlightSchema = z.strictObject({
  url: linkedinUrl,
  date: z.iso.date(),
  caption: z.string().min(1).max(140),
});

export const profileSchema = z.strictObject({
  name: z.string().min(1),
  headline: z.string().min(1),
  bio: z.string().min(1),
  email: z.email(),
  location: z.string().min(1),
  availability: z.string().min(1),
  socials: z.strictObject({ github: httpsUrl, linkedin: httpsUrl }),
  decorationColors: z.array(hexColor).min(2).max(6),
});

export const aboutFrontmatterSchema = z.strictObject({
  title: z.string().min(1).max(80),
  intro: z.string().min(1).max(200),
  timeline: z
    .array(
      z.strictObject({
        year: z.string().regex(/^\d{4}(\s?-\s?(\d{4}|now))?$/, "must look like 2024 or 2024 - now"),
        title: z.string().min(1).max(80),
        detail: z.string().min(1).max(200),
      }),
    )
    .min(1)
    .max(8),
  outside: z.array(z.string().min(1).max(80)).min(1).max(8),
});

export type ProjectFrontmatter = z.infer<typeof projectFrontmatterSchema>;
export type LabFrontmatter = z.infer<typeof labFrontmatterSchema>;
export type Highlight = z.infer<typeof highlightSchema>;
export type Profile = z.infer<typeof profileSchema>;
export type AboutFrontmatter = z.infer<typeof aboutFrontmatterSchema>;
