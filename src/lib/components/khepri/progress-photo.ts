/**
 * One pose slot of a progress check: a port of north-client
 * web/assets/js/shared/progress-photo.js (northProgressPhoto).
 *
 * On change the chosen photo is redrawn onto a canvas at most 1600 px on its
 * long side and the JPEG put back in the same <input type="file">, so the
 * ordinary multipart form submits it: a phone photo fits under the server's
 * 8 MB cap, a canvas export carries no EXIF (no location leaves the device),
 * and HEIC becomes JPEG. If any step is unsupported the original is kept and
 * the server still checks it.
 */

const MAX_SIDE = 1600;
const QUALITY = 0.85;

export async function shrinkPhoto(file: File): Promise<File> {
	const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
	const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
	const canvas = document.createElement('canvas');
	canvas.width = Math.round(bitmap.width * scale);
	canvas.height = Math.round(bitmap.height * scale);
	const ctx = canvas.getContext('2d');
	if (!ctx) throw new Error('no 2d context');
	ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
	bitmap.close();
	const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', QUALITY));
	if (!blob) throw new Error('toBlob failed');
	const name = file.name.replace(/\.[^.]+$/, '') + '.jpg';
	return new File([blob], name, { type: 'image/jpeg' });
}

/**
 * Shrinks the input's chosen file in place and returns an object URL for the
 * preview ("" when nothing is chosen). The caller revokes the previous URL.
 */
export async function pickProgressPhoto(input: HTMLInputElement): Promise<string> {
	const file = input.files?.[0];
	if (!file) return '';
	try {
		const small = await shrinkPhoto(file);
		const list = new DataTransfer();
		list.items.add(small);
		input.files = list.files;
		return URL.createObjectURL(small);
	} catch {
		// Unsupported here: keep the original, the server decides.
		return URL.createObjectURL(file);
	}
}
