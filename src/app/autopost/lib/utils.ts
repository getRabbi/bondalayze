export function mustEnv(name: string): string {
  const v = process.env[name];
  if (!v) {
    const keys = Object.keys(process.env).filter(Boolean).slice(0, 30);
    throw new Error(
      `Missing env: ${name}. Loaded env sample keys: ${keys.join(", ")}`
    );
  }
  return v;
}

export function slugify(text: string) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[“”"]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 80);
}

export function nowIso() {
  return new Date().toISOString();
}
