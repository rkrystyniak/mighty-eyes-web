import type { APIRoute } from 'astro';

export const prerender = false;

const LEAD_RECIPIENT = 'rob@exacttempo.com';
const LEAD_FROM = 'Mighty Eyes <onboarding@resend.dev>';

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

  const apiKey = import.meta.env.RESEND_API_KEY;
  if (!apiKey) {
    console.error('[lead] RESEND_API_KEY is not set');
    return json({ error: 'Email service is not configured.' }, 500);
  }

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: LEAD_FROM,
      to: [LEAD_RECIPIENT],
      reply_to: email,
      subject: `New lead from ${name}`,
      text: renderText({ name, email, usecase }),
      html: renderHtml({ name, email, usecase }),
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    console.error('[lead] Resend send failed', res.status, body);
    return json({ error: 'Failed to send email.' }, 502);
  }

  return json({ ok: true }, 200);
};

function renderText({ name, email, usecase }: { name: string; email: string; usecase: string }) {
  return `New lead submission\n\nName: ${name}\nEmail: ${email}\n\nUse case:\n${usecase}\n`;
}

function renderHtml({ name, email, usecase }: { name: string; email: string; usecase: string }) {
  return `<h2>New lead submission</h2>
<p><strong>Name:</strong> ${escapeHtml(name)}</p>
<p><strong>Email:</strong> ${escapeHtml(email)}</p>
<p><strong>Use case:</strong></p>
<p>${escapeHtml(usecase).replace(/\n/g, '<br>')}</p>`;
}

function escapeHtml(s: string) {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function json(body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
