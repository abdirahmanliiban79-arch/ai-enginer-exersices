import { NextRequest, NextResponse } from 'next/server';

// Cloudflare Workers AI — REST endpoint configuration.
//   POST https://api.cloudflare.com/client/v4/accounts/{ACCOUNT_ID}/ai/run/{model}
//   Header: Authorization: Bearer {API_TOKEN}
// The {ACCOUNT_ID} is the Cloudflare account the Workers AI API token belongs
// to. It is NOT derivable from the token itself — you must set
// IMAGE_TO_IMAGE_CLOUDFLARE_ACCOUNT_ID in .env.
const CLOUDFLARE_API_BASE_URL = 'https://api.cloudflare.com/client/v4';
// FLUX.2 [klein] unifies image generation AND editing in one model. It accepts
// a real multipart/form-data body (prompt + image file). The classic
// stable-diffusion img2img model is account-restricted on some plans, so this
// model is the reliable choice for image-to-image edits.
const CLOUDFLARE_AI_MODEL = '@cf/black-forest-labs/flux-2-klein-4b';

function cloudflareAiRunUrl(accountId: string): string {
  return `${CLOUDFLARE_API_BASE_URL}/accounts/${accountId}/ai/run/${CLOUDFLARE_AI_MODEL}`;
}

// stable-diffusion img2img returns a base64-encoded image, but we sniff the
// magic bytes so the data-URL mime type always matches the actual bytes
// (defaults to png).
function imageMimeFromBase64(base64: string): string {
  const head = base64.slice(0, 6);
  if (head.startsWith('/9j/')) return 'image/jpeg';
  if (head.startsWith('iVBOR')) return 'image/png';
  if (head.startsWith('UklGR')) return 'image/webp';
  if (head.startsWith('R0lGOD')) return 'image/gif';
  return 'image/png';
}

function cloudflareErrorMessage(data: unknown, status: number): string {
  if (
    data &&
    typeof data === 'object' &&
    'errors' in data &&
    Array.isArray((data as { errors?: unknown[] }).errors)
  ) {
    const first = (data as { errors: Array<{ message?: string }> }).errors[0];
    if (first?.message) return first.message;
  }
  return `Cloudflare Workers AI request failed (HTTP ${status}). Please try again.`;
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const prompt = ((formData.get('prompt') as string | null) ?? '').trim();
    const files = formData.getAll('images').filter((f): f is File => f instanceof File);

    if (!prompt) {
      return NextResponse.json({ error: 'prompt is required' }, { status: 400 });
    }
    if (files.length === 0) {
      return NextResponse.json(
        { error: 'At least one image is required to edit' },
        { status: 400 },
      );
    }

    // Support both spellings: the .env ships with hyphenated names
    // (IMAGE-TO-IMAGE-CLOUDFLARE-API) and Next.js loads them verbatim.
    const token =
      process.env.IMAGE_TO_IMAGE_CLOUDFLARE_API ?? process.env['IMAGE-TO-IMAGE-CLOUDFLARE-API'];
    const accountId =
      process.env.IMAGE_TO_IMAGE_CLOUDFLARE_ACCOUNT_ID ??
      process.env.CLOUDFLARE_ACCOUNT_ID ??
      process.env['CLOUDFLARE-ACCOUNT-ID'];

    if (!token) {
      return NextResponse.json(
        { error: 'Cloudflare Workers AI is not configured: missing IMAGE_TO_IMAGE_CLOUDFLARE_API.' },
        { status: 500 },
      );
    }
    if (!accountId) {
      return NextResponse.json(
        {
          error:
            'Cloudflare Workers AI is not configured: missing account ID. Set IMAGE_TO_IMAGE_CLOUDFLARE_ACCOUNT_ID in .env.',
        },
        { status: 500 },
      );
    }

    // FLUX.2 [klein] accepts a multipart/form-data body with the prompt and the
    // image file itself. Forward the first uploaded image unchanged.
    const cloudflareForm = new FormData();
    cloudflareForm.append('prompt', prompt);
    cloudflareForm.append('image', files[0]);

    const response = await fetch(cloudflareAiRunUrl(accountId), {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      // Do NOT set Content-Type manually: fetch sets the multipart boundary.
      body: cloudflareForm,
    });

    const data: unknown = await response.json().catch(() => null);

    if (!response.ok || !(data && typeof data === 'object' && (data as { success?: boolean }).success)) {
      const message = cloudflareErrorMessage(data, response.status);
      const status = response.status >= 400 && response.status <= 599 ? response.status : 500;
      return NextResponse.json({ error: message }, { status });
    }

    const image = (data as { result?: { image?: string } }).result?.image;
    if (typeof image !== 'string' || !image) {
      return NextResponse.json(
        { error: 'The model did not return an image. Try rephrasing your prompt.' },
        { status: 502 },
      );
    }

    const mimeType = imageMimeFromBase64(image);
    return NextResponse.json({
      url: `data:${mimeType};base64,${image}`,
      prompt,
      timestamp: Date.now(),
      imageCount: files.length,
      type: 'edit',
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : 'Image editing failed. Please try again.';
    console.error('Image editing failed:', error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}