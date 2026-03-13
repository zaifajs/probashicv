import slugify from "slugify";

export function makeCvSlug(value) {
  const base = slugify(value || "cv", { lower: true, strict: true, trim: true });
  const suffix = Date.now().toString(36);
  return `${base}-${suffix}`;
}
