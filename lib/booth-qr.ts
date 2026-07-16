export type BoothQrCredential = { publicId: string; token: string };

export function parseBoothQr(rawValue: string): BoothQrCredential | null {
  const value = rawValue.trim();
  if (!value || value.length > 2048) return null;
  try {
    const payload = JSON.parse(value) as Record<string, unknown>;
    const publicId = String(payload.publicId || payload.boothPublicId || '');
    const token = String(payload.token || payload.boothToken || '');
    if (publicId && token) return { publicId, token };
  } catch {}
  try {
    const url = new URL(value);
    const pathId = url.pathname.match(/\/booths\/scan\/([^/]+)/)?.[1];
    const publicId = pathId || url.searchParams.get('publicId') || url.searchParams.get('booth');
    const token = url.searchParams.get('token');
    if (publicId && token) return { publicId: decodeURIComponent(publicId), token };
  } catch {}
  const relative = value.match(/(?:^|\/)booths\/scan\/([^?/#]+)\?[^#]*token=([^&#]+)/i);
  return relative ? { publicId: decodeURIComponent(relative[1]), token: decodeURIComponent(relative[2]) } : null;
}
