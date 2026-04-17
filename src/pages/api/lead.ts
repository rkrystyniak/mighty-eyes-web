import type { APIRoute } from 'astro';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  let data: Record<string, unknown>;
  try {
    data = await request.json();
  } catch {
    return json({ error: 'Invalid JSON body' }, 400);
  }

  const name = typeof data.name === 'string' ? data.name.trim() : '';
  const email = typeof data.email === 'string' ? data.email.trim() : '';
  const usecase = typeof data.usecase === 'string' ? data.usecase.trim() : '';

  if (!name || !email || !usecase) {
    return json({ error: 'Missing required fields: name, email, usecase.' }, 400);
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return json({ error: 'Invalid email format.' }, 400);
  }

  console.log('[lead]', {
    at: new Date().toISOString(),
    ...data,
  });

  return json({ ok: true }, 200);
};

function json(body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
