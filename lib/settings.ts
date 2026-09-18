export const defaults = {
  description: true, creator: true, actions: true, comments: false,
  recommendations: false, homeFeed: false, shorts: false, autoplay: false,
};
export type Settings = typeof defaults;
export function normalizeSettings(value: unknown): Settings {
  const result = {...defaults};
  if (value && typeof value === 'object') for (const key of Object.keys(defaults) as (keyof Settings)[]) {
    const v = (value as Record<string, unknown>)[key];
    if (typeof v === 'boolean') result[key] = v;
  }
  return result;
}
