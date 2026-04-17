/**
 * API Proxy for CharacterWorks
 *
 * Browser fetches /api/cw → Next.js server forwards to CW (e.g. http://127.0.0.1:8080)
 * Server-to-server calls are not subject to CORS, so this solves the "Failed to fetch" problem.
 *
 * The target CW URL is passed in the X-CW-Target header by the client.
 */
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  // Client sends the CW base URL via a custom header so the proxy knows where to forward.
  const target = (req.headers['x-cw-target'] || '').trim().replace(/\/+$/, '');

  if (!target) {
    return res
      .status(400)
      .json({ error: 'X-CW-Target header is missing. Please set the CW server address in the UI.' });
  }

  try {
    const cwResponse = await fetch(`${target}/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json;charset=utf-8' },
      body: JSON.stringify(req.body),
    });

    const text = await cwResponse.text();

    res.status(cwResponse.status);
    res.setHeader('Content-Type', 'application/json');

    // Try to forward raw JSON; if CW returns non-JSON we surface a friendly error.
    try {
      JSON.parse(text); // validate
      return res.send(text);
    } catch {
      return res.status(502).json({
        error: 'CharacterWorks returned invalid JSON. Check IP/port settings.',
        raw: text.slice(0, 500),
      });
    }
  } catch (err) {
    return res.status(502).json({
      error: `Cannot reach CharacterWorks at "${target}". Make sure CW is running and the address is correct.`,
      detail: err.message,
    });
  }
}
