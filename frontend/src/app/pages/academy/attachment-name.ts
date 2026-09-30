export function attachmentName(title: string | null, ordinal: number, extension: string) {
  const base = title || `Material ${ordinal}`;
  return base.toLowerCase().endsWith(`.${extension.toLowerCase()}`) ? base : `${base}.${extension}`;
}
