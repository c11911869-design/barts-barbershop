/**
 * Worker entry point for the Bart's Barber Shop site.
 *
 * Static pages are served from the ASSETS binding (the Astro `dist/` output).
 * Requests that do not match a static file arrive here, which is how the
 * feedback endpoint is reached.
 *
 * Feedback flow: Turnstile verification -> validation -> GitHub issue ->
 * notification email. The issue is filed with the `client-feedback` label only.
 * It deliberately does NOT get the `approved` label, because that label is what
 * releases the build agent to act. Approval stays a manual decision by the
 * maintainer so that a public form can never queue automated work on its own.
 */

interface Env {
  ASSETS: Fetcher;
  TURNSTILE_SECRET_KEY: string;
  FEEDBACK_GITHUB_TOKEN: string;
  FEEDBACK_GITHUB_REPO: string; // "owner/name"
  RESEND_API_KEY?: string; // optional; when unset, no notification email is sent
  FEEDBACK_TO_EMAIL?: string;
  FEEDBACK_FROM_EMAIL?: string;
  FEEDBACK_PASSCODE?: string; // optional shared secret for the client
}

const MAX = { name: 100, email: 200, area: 120, message: 5000 } as const;

const json = (status: number, body: Record<string, unknown>) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });

/** Prevents Markdown/HTML injection when untrusted text is embedded in an issue body. */
function fence(text: string): string {
  return text.replace(/```/g, "'''");
}

interface TurnstileResult {
  ok: boolean;
  codes: string[];
}

async function verifyTurnstile(
  token: string,
  secret: string,
  ip: string | null,
): Promise<TurnstileResult> {
  const form = new FormData();
  // Trailing whitespace from a copy-paste into the dashboard is a common cause
  // of invalid-input-secret, and it is invisible in the UI.
  form.append('secret', (secret ?? '').trim());
  form.append('response', token);
  if (ip) form.append('remoteip', ip);

  const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST',
    body: form,
  });
  if (!res.ok) return { ok: false, codes: [`siteverify-http-${res.status}`] };

  const data = (await res.json()) as { success?: boolean; 'error-codes'?: string[] };
  return { ok: data.success === true, codes: data['error-codes'] ?? [] };
}

async function handleFeedback(request: Request, env: Env): Promise<Response> {
  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return json(400, { error: 'Expected form data.' });
  }

  const field = (key: string) => (form.get(key) ?? '').toString().trim();

  // Bots that fill every field trip this hidden input. Real browsers leave it empty.
  if (field('company')) return json(200, { ok: true });

  if (env.FEEDBACK_PASSCODE && field('passcode') !== env.FEEDBACK_PASSCODE) {
    return json(403, { error: 'That access code is not correct.' });
  }

  const token = field('cf-turnstile-response');
  if (!token) return json(400, { error: 'Please complete the human verification check.' });

  const ip = request.headers.get('CF-Connecting-IP');
  const verdict = await verifyTurnstile(token, env.TURNSTILE_SECRET_KEY, ip);
  if (!verdict.ok) {
    // Codes distinguish a misconfigured secret from a genuinely failed challenge.
    // invalid-input-secret means the TURNSTILE_SECRET_KEY variable is wrong.
    console.error('Turnstile verification failed', verdict.codes.join(','));
    return json(403, {
      error: 'Human verification failed. Please reload and try again.',
      codes: verdict.codes,
    });
  }

  const name = field('name');
  const email = field('email');
  const area = field('area');
  const message = field('message');

  if (!name || !message) {
    return json(400, { error: 'Name and feedback are both required.' });
  }
  if (
    name.length > MAX.name ||
    email.length > MAX.email ||
    area.length > MAX.area ||
    message.length > MAX.message
  ) {
    return json(400, { error: 'One of the fields is too long.' });
  }
  if (email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return json(400, { error: 'That email address does not look valid.' });
  }

  const submitted = new Date().toISOString();
  const title = `Feedback: ${area || 'general'} - ${message.slice(0, 60).replace(/\s+/g, ' ')}`;
  const body = [
    '### Feedback from the review site',
    '',
    `- **From:** ${fence(name)}${email ? ` (${fence(email)})` : ''}`,
    `- **Page or section:** ${fence(area) || '_not specified_'}`,
    `- **Submitted:** ${submitted}`,
    '',
    '### Message',
    '',
    '```text',
    fence(message),
    '```',
    '',
    '---',
    '',
    'Submitted through the website feedback form and verified by Turnstile.',
    'Add the `approved` label to release the build agent to work on this.',
  ].join('\n');

  // Same whitespace hazard as the Turnstile secret: a stray newline pasted into
  // the dashboard makes the Authorization header invalid.
  const repo = (env.FEEDBACK_GITHUB_REPO ?? '').trim();
  const githubToken = (env.FEEDBACK_GITHUB_TOKEN ?? '').trim();

  const issue = await fetch(`https://api.github.com/repos/${repo}/issues`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${githubToken}`,
      Accept: 'application/vnd.github+json',
      'Content-Type': 'application/json',
      'User-Agent': 'barts-barbershop-feedback',
    },
    body: JSON.stringify({ title, body, labels: ['client-feedback'] }),
  });

  if (!issue.ok) {
    const detail = await issue.text();
    console.error('GitHub issue creation failed', issue.status, detail);
    // 401 means the token is wrong or expired; 403 means it lacks Issues write;
    // 404 means the token cannot see this repository at all.
    return json(502, {
      error: 'Could not record the feedback. Please try again shortly.',
      github: issue.status,
    });
  }

  const created = (await issue.json()) as { html_url: string; number: number };

  // Email is an optional convenience notification: GitHub already emails the
  // repo owner about new issues. When RESEND_API_KEY is unset the step is
  // skipped entirely rather than firing a request that is known to fail.
  // Losing the email must never lose the feedback, which is already durably
  // recorded as an issue above.
  if (!env.RESEND_API_KEY) {
    return json(200, { ok: true, issue: created.number });
  }

  try {
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: env.FEEDBACK_FROM_EMAIL,
        to: [env.FEEDBACK_TO_EMAIL],
        reply_to: email || undefined,
        subject: `[Bart's] Feedback #${created.number}: ${area || 'general'}`,
        text: [
          `From: ${name}${email ? ` <${email}>` : ''}`,
          `Page or section: ${area || 'not specified'}`,
          '',
          message,
          '',
          `Issue: ${created.html_url}`,
        ].join('\n'),
      }),
    });
  } catch (err) {
    console.error('Notification email failed', err);
  }

  return json(200, { ok: true, issue: created.number });
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === '/api/feedback') {
      return request.method === 'POST'
        ? handleFeedback(request, env)
        : json(405, { error: 'This endpoint only accepts form submissions.' });
    }

    // Anything else is a static asset, or a genuine 404 from the asset server.
    return env.ASSETS.fetch(request);
  },
} satisfies ExportedHandler<Env>;
