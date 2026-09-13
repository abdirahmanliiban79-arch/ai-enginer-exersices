import { describe, it, expect, vi, afterEach } from 'vitest';
import type { NextRequest } from 'next/server';
import { POST } from '../app/api/generate/route';

const ORIGINAL_TOKEN = process.env.TEXT_TO_IMAGE_CLOUDFLARE_API;
const ORIGINAL_ACCOUNT_ID = process.env.TEXT_TO_IMAGE_CLOUDFLARE_ACCOUNT_ID;

const PNG_BASE64 =
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';
const JPEG_BASE64 = '/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/wAALCAABAAEBAREA/8QAFAABAAAAAAAAAAAAAAAAAAAACf/EABQQAQAAAAAAAAAAAAAAAAAAAAD/2gAIAQEAAD8AVN//2Q==';

function makeRequest(form: FormData): NextRequest {
    return new Request('http://localhost/api/generate', {
        method: 'POST',
        body: form,
    }) as unknown as NextRequest;
}

function makeForm(): FormData {
    return new FormData();
}

function mockJsonResponse(init: { ok: boolean; status: number; data: unknown }) {
    return {
        ok: init.ok,
        status: init.status,
        json: () => Promise.resolve(init.data),
    } as Response;
}

afterEach(() => {
    vi.unstubAllGlobals();
    process.env.TEXT_TO_IMAGE_CLOUDFLARE_API = ORIGINAL_TOKEN;
    process.env.TEXT_TO_IMAGE_CLOUDFLARE_ACCOUNT_ID = ORIGINAL_ACCOUNT_ID;
});

describe('POST /api/generate', () => {
    it('returns 400 when prompt is missing', async () => {
        const res = await POST(makeRequest(makeForm()));

        expect(res.status).toBe(400);
        await expect(res.json()).resolves.toEqual({ error: 'prompt is required' });
    });

    it('returns 400 for a whitespace-only prompt', async () => {
        const form = makeForm();
        form.set('prompt', '   ');

        const res = await POST(makeRequest(form));

        expect(res.status).toBe(400);
        await expect(res.json()).resolves.toEqual({ error: 'prompt is required' });
    });

    it('returns 500 when the Cloudflare token env var is missing', async () => {
        delete process.env.TEXT_TO_IMAGE_CLOUDFLARE_API;
        const form = makeForm();
        form.set('prompt', 'a fox');

        const res = await POST(makeRequest(form));

        expect(res.status).toBe(500);
        await expect(res.json()).resolves.toEqual({
            error: 'Cloudflare Workers AI is not configured: missing TEXT_TO_IMAGE_CLOUDFLARE_API.',
        });
    });

    it('returns 500 when the Cloudflare account ID env var is missing', async () => {
        delete process.env.TEXT_TO_IMAGE_CLOUDFLARE_ACCOUNT_ID;
        const form = makeForm();
        form.set('prompt', 'a fox');

        const res = await POST(makeRequest(form));

        expect(res.status).toBe(500);
        await expect(res.json()).resolves.toEqual({
            error:
                'Cloudflare Workers AI is not configured: missing account ID. Set TEXT_TO_IMAGE_CLOUDFLARE_ACCOUNT_ID in .env.',
        });
    });

    it('calls the Cloudflare Workers AI endpoint and returns a data URL on success', async () => {
        const fetchMock = vi.fn().mockResolvedValue(
            mockJsonResponse({
                ok: true,
                status: 200,
                data: { success: true, result: { image: PNG_BASE64 } },
            }),
        );
        vi.stubGlobal('fetch', fetchMock);

        const form = makeForm();
        form.set('prompt', 'a red fox');
        const res = await POST(makeRequest(form));

        expect(res.status).toBe(200);
        const body = await res.json();
        expect(body.url).toBe(`data:image/png;base64,${PNG_BASE64}`);
        expect(body.prompt).toBe('a red fox');
        expect(typeof body.timestamp).toBe('number');
        expect(body.imageCount).toBe(0);
        expect(body.type).toBe('generate');

        expect(fetchMock).toHaveBeenCalledTimes(1);
        const [url, init] = fetchMock.mock.calls[0];
        expect(url).toContain('https://api.cloudflare.com/client/v4/accounts/test-account-id/ai/run/');
        expect(url).toContain('@cf/black-forest-labs/flux-1-schnell');
        expect(init.headers.Authorization).toBe('Bearer test-text-to-image-token');
        expect(init.headers['Content-Type']).toBe('application/json');
        expect(JSON.parse(init.body)).toEqual({ prompt: 'a red fox' });
    });

    it('sniffs the mime type from the image bytes (jpeg)', async () => {
        const fetchMock = vi.fn().mockResolvedValue(
            mockJsonResponse({
                ok: true,
                status: 200,
                data: { success: true, result: { image: JPEG_BASE64 } },
            }),
        );
        vi.stubGlobal('fetch', fetchMock);

        const form = makeForm();
        form.set('prompt', 'a mountain');

        const res = await POST(makeRequest(form));

        expect(res.status).toBe(200);
        const body = await res.json();
        expect(body.url).toBe(`data:image/jpeg;base64,${JPEG_BASE64}`);
    });

    it('passes through the Cloudflare status and error message', async () => {
        const fetchMock = vi.fn().mockResolvedValue(
            mockJsonResponse({
                ok: false,
                status: 429,
                data: { success: false, errors: [{ message: 'You exceeded your current quota.' }] },
            }),
        );
        vi.stubGlobal('fetch', fetchMock);

        const form = makeForm();
        form.set('prompt', 'a cat');

        const res = await POST(makeRequest(form));

        expect(res.status).toBe(429);
        await expect(res.json()).resolves.toEqual({ error: 'You exceeded your current quota.' });
    });

    it('uses a generic message when the error body has no message', async () => {
        const fetchMock = vi.fn().mockResolvedValue(
            mockJsonResponse({
                ok: false,
                status: 500,
                data: { success: false },
            }),
        );
        vi.stubGlobal('fetch', fetchMock);

        const form = makeForm();
        form.set('prompt', 'a cat');

        const res = await POST(makeRequest(form));

        expect(res.status).toBe(500);
        await expect(res.json()).resolves.toEqual({
            error: 'Cloudflare Workers AI request failed (HTTP 500). Please try again.',
        });
    });

    it('returns 502 when the model does not return an image', async () => {
        const fetchMock = vi.fn().mockResolvedValue(
            mockJsonResponse({
                ok: true,
                status: 200,
                data: { success: true, result: {} },
            }),
        );
        vi.stubGlobal('fetch', fetchMock);

        const form = makeForm();
        form.set('prompt', 'a dog');

        const res = await POST(makeRequest(form));

        expect(res.status).toBe(502);
        await expect(res.json()).resolves.toEqual({
            error: 'The model did not return an image. Try rephrasing your prompt.',
        });
    });

    it('returns 500 when the Cloudflare request rejects', async () => {
        const fetchMock = vi.fn().mockRejectedValue(new Error('network down'));
        vi.stubGlobal('fetch', fetchMock);

        const form = makeForm();
        form.set('prompt', 'a bird');

        const res = await POST(makeRequest(form));

        expect(res.status).toBe(500);
        await expect(res.json()).resolves.toEqual({ error: 'network down' });
    });
});