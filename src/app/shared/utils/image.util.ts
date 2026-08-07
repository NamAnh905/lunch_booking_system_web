const CLOUDINARY_UPLOAD_SEGMENT = '/image/upload/';
const DELIVERY_TRANSFORMATION = 'f_auto,q_auto';

export function toOptimizedImageUrl(url: string | null | undefined): string {
  if (!url) {
    return '';
  }

  const segmentIndex = url.indexOf(CLOUDINARY_UPLOAD_SEGMENT);
  if (segmentIndex === -1) {
    return url;
  }

  const insertAt = segmentIndex + CLOUDINARY_UPLOAD_SEGMENT.length;
  const rest = url.slice(insertAt);
  if (rest.startsWith(`${DELIVERY_TRANSFORMATION}/`)) {
    return url;
  }

  return `${url.slice(0, insertAt)}${DELIVERY_TRANSFORMATION}/${rest}`;
}
