'use strict';

/**
 * Vercel serverless function — POST /api/chat
 *
 * On Vercel, static files in /public are served at the site root, and this
 * file is automatically exposed at /api/chat. The Groq API key must be set as
 * a Vercel Environment Variable named GROQ_API_KEY; it stays server-side only.
 */

const { getChatResponse } = require('../lib/groq');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    res.status(405).json({ error: 'method_not_allowed', message: 'POST use karein.' });
    return;
  }

  // Vercel usually parses JSON bodies into req.body, but handle strings too.
  let messages;
  try {
    let body = req.body;
    if (typeof body === 'string') body = JSON.parse(body || '{}');
    if (!body || typeof body !== 'object') body = {};
    messages = body.messages;
  } catch {
    res.status(400).json({
      error: 'bad_request',
      message: 'Darkhwast ka format durust nahi hai.',
    });
    return;
  }

  try {
    const result = await getChatResponse(messages);
    res.status(result.status).json(result.body);
  } catch {
    res.status(500).json({
      error: 'server_error',
      message: 'Server mein غیر متوقع masla. Baraye meharbani dubara koshish karein.',
    });
  }
};
