import { describe, it, expect, vi, afterEach } from 'vitest';
import type { NextRequest } from 'next/server';
import { POST } from '../app/api/edit/route';

const PNG_BASE64 =
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';

function makeRequest(form: FormData): NextRequest {
    return new Request('http://localhost/api/edit', {
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
});

describe('POST /api/edit', () => {
    it('returns 400 when prompt is missing', async () => {
        const bytes = new Uint8Array([137, 80, 78, 71]);
        const form = makeForm();
        form.append('images', new File([bytes], 'photo.png', { type: 'image/png' }));

        const res = await POST(makeRequest(form));

        expect(res.status).toBe(400);
        await expect(res.json()).resolves.toEqual({ error: 'prompt is required' });
    });

    it('returns 400 when no images are uploaded', async () => {
        const form = makeForm();
        form.set('prompt', 'make it sunset');

        const res = await POST(makeRequest(form));

        expect(res.status).toBe(400);
        await expect(res.json()).resolves.toEqual({ error: 'At least one image is required to edit' });
    });

    it('calls the image-editing endpoint with a multipart body and returns a data URL on success', async () => {
        const fetchMock = vi.fn().mockResolvedValue(
            mockJsonResponse({
                ok: true,
                status: 200,
                data: { success: true, result: { image: PNG_BASE64 } },
            }),
        );
        vi.stubGlobal('fetch', fetchMock);

        const bytes = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]);
        const form = makeForm();
        form.set('prompt', 'make it sunset');
        form.append('images', new File([bytes], 'photo.png', { type: 'image/png' }));

        const res = await POST(makeRequest(form));

        expect(res.status).toBe(200);
        const body = await res.json();
        expect(body.url).toBe(`data:image/png;base64,${PNG_BASE64}`);
        expect(body.prompt).toBe('make it sunset');
        expect(typeof body.timestamp).toBe('number');
        expect(body.imageCount).toBe(1);
        expect(body.type).toBe('edit');

        expect(fetchMock).toHaveBeenCalledTimes(1);
        const [url, init] = fetchMock.mock.calls[0];
        expect(url).toContain('https://api.cloudflare.com/client/v4/accounts/test-account-id/ai/run/');
        expect(url).toContain('@cf/black-forest-labs/flux-2-klein-4b');
        expect(init.headers.Authorization).toBe('Bearer test-image-to-image-token');

        const sentBody = init.body as FormData;
        expect(sentBody.get('prompt')).toBe('make it sunset');
        const sentImage = sentBody.get('image') as File;
        expect(sentImage).toBeInstanceOf(File);
        expect(await sentImage.arrayBuffer()).toEqual(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength));
    });

    it('reports the number of uploaded images in imageCount', async () => {
        const fetchMock = vi.fn().mockResolvedValue(
            mockJsonResponse({
                ok: true,
                status: 200,
                data: { success: true, result: { image: PNG_BASE64 } },
            }),
        );
        vi.stubGlobal('fetch', fetchMock);

        const bytes = new Uint8Array([1, 2, 3, 4]);
        const form = makeForm();
        form.set('prompt', 'add a hat');
        form.append('images', new File([bytes], 'a.png', { type: 'image/png' }));
        form.append('images', new File([bytes], 'b.jpg', { type: 'image/jpeg' }));

        const res = await POST(makeRequest(form));

        expect(res.status).toBe(200);
        const body = await res.json();
        expect(body.imageCount).toBe(2);
        expect(body.type).toBe('edit');
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

        const bytes = new Uint8Array([1, 2, 3, 4]);
        const form = makeForm();
        form.set('prompt', 'a cat');
        form.append('images', new File([bytes], 'a.png', { type: 'image/png' }));

        const res = await POST(makeRequest(form));

        expect(res.status).toBe(429);
        await expect(res.json()).resolves.toEqual({ error: 'You exceeded your current quota.' });
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

        const bytes = new Uint8Array([1, 2, 3, 4]);
        const form = makeForm();
        form.set('prompt', 'a dog');
        form.append('images', new File([bytes], 'a.png', { type: 'image/png' }));

        const res = await POST(makeRequest(form));

        expect(res.status).toBe(502);
        await expect(res.json()).resolves.toEqual({
            error: 'The model did not return an image. Try rephrasing your prompt.',
        });
    });
});