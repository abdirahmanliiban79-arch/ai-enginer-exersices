import { NextRequest, NextResponse } from 'next/server';

// Cloudflare Workers AI — REST endpoint configuration.
// The standard endpoint is:
//   POST https://api.cloudflare.com/client/v4/accounts/{ACCOUNT_ID}/ai/run/{model}
//   Header: Authorization: Bearer {API_TOKEN}
// The {ACCOUNT_ID} is the Cloudflare account the Workers AI API token belongs
// to. It is NOT derivable from the token itself — you must set
// TEXT_TO_IMAGE_CLOUDFLARE_ACCOUNT_ID in .env (the Workers AI REST API tokens
// created in the dashboard are "cfut_..." user tokens with Workers AI read/write
// permissions only, so endpoints like /accounts return nothing).
const CLOUDFLARE_API_BASE_URL = 'https://api.cloudflare.com/client/v4';
const CLOUDFLARE_AI_MODEL = '@cf/black-forest-labs/flux-1-schnell';

function cloudflareAiRunUrl(accountId: string): string {
  return `${CLOUDFLARE_API_BASE_URL}/accounts/${accountId}/ai/run/${CLOUDFLARE_AI_MODEL}`;
}

// flux-1-schnell returns a base64-encoded JPEG, but we sniff the magic bytes so
// the data-URL mime type always matches the actual bytes (defaults to png).
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

    if (!prompt) {
      return NextResponse.json({ error: 'prompt is required' }, { status: 400 });
    }

    // Support both spellings: the .env ships with hyphenated names
    // (TEXT-TO-IMAGE-CLOUDFLARE-API) and Next.js loads them verbatim.
    const token =
      process.env.TEXT_TO_IMAGE_CLOUDFLARE_API ?? process.env['TEXT-TO-IMAGE-CLOUDFLARE-API'];
    const accountId =
      process.env.TEXT_TO_IMAGE_CLOUDFLARE_ACCOUNT_ID ??
      process.env.CLOUDFLARE_ACCOUNT_ID ??
      process.env['CLOUDFLARE-ACCOUNT-ID'];

    if (!token) {
      return NextResponse.json(
        { error: 'Cloudflare Workers AI is not configured: missing TEXT_TO_IMAGE_CLOUDFLARE_API.' },
        { status: 500 },
      );
    }
    if (!accountId) {
      return NextResponse.json(
        {
          error:
            'Cloudflare Workers AI is not configured: missing account ID. Set TEXT_TO_IMAGE_CLOUDFLARE_ACCOUNT_ID in .env.',
        },
        { status: 500 },
      );
    }

    const response = await fetch(cloudflareAiRunUrl(accountId), {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ prompt }),
    });

    const data: unknown = await response.json().catch(() => null);

    if (!response.ok || !(data && typeof data === 'object' && (data as { success?: boolean }).success)) {
      const message = cloudflareErrorMessage(data, response.status);
      const status = response.status >= 400 && response.status <= 599 ? response.status : 500;
      return NextResponse.json({ error: message }, { status });
    }

    const imageBase64 = (data as { result?: { image?: string } }).result?.image;
    if (typeof imageBase64 !== 'string' || !imageBase64) {
      return NextResponse.json(
        { error: 'The model did not return an image. Try rephrasing your prompt.' },
        { status: 502 },
      );
    }

    // Return the image as a data URL so the client can display/download it
    // without storing files on disk.
    const mimeType = imageMimeFromBase64(imageBase64);
    return NextResponse.json({
      url: `data:${mimeType};base64,${imageBase64}`,
      prompt,
      timestamp: Date.now(),
      imageCount: 0,
      type: 'generate',
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : 'Image generation failed. Please try again.';
    console.error('Image generation failed:', error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}