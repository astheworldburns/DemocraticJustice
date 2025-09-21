const buildResponse = (statusCode, payload) => ({
  statusCode,
  headers: {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  },
  body: JSON.stringify(payload)
});

const sanitizeString = (value, maxLength = 512) => {
  if (typeof value !== 'string') {
    if (value === undefined || value === null) {
      return '';
    }
    try {
      value = String(value);
    } catch (error) {
      return '';
    }
  }

  return value.slice(0, maxLength);
};

const toNumberOrNull = (value) => {
  if (value === undefined || value === null || value === '') {
    return null;
  }

  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : null;
};

const toIsoTimestamp = (value) => {
  if (!value) {
    return new Date().toISOString();
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? new Date().toISOString() : date.toISOString();
};

const submitToNetlifyForms = async (formId, token, payload) => {
  const response = await fetch(`https://api.netlify.com/api/v1/forms/${formId}/submissions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({
      fields: payload,
      metadata: {
        source: 'archive-search'
      }
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Netlify Forms responded with ${response.status}: ${errorText}`);
  }

  try {
    return await response.json();
  } catch (error) {
    return { status: 'ok' };
  }
};

const postToWebhook = async (url, payload) => {
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Webhook responded with ${response.status}: ${text}`);
  }

  return { status: 'ok' };
};

export const handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
      },
      body: ''
    };
  }

  if (event.httpMethod !== 'POST') {
    return buildResponse(405, { error: 'Method Not Allowed' });
  }

  let payload;
  try {
    payload = JSON.parse(event.body || '{}');
  } catch (error) {
    return buildResponse(400, { error: 'Invalid JSON payload' });
  }

  const query = sanitizeString(payload.query).trim();
  if (!query) {
    return buildResponse(400, { error: 'Missing search query' });
  }

  const results = toNumberOrNull(payload.results);
  const pagefindResults = toNumberOrNull(payload.pagefindResults);
  const strategy = sanitizeString(payload.strategy || 'unknown', 32);
  const triggeredAt = toIsoTimestamp(payload.triggeredAt);
  const filters = (payload.filters && typeof payload.filters === 'object') ? payload.filters : {};

  const entry = {
    query,
    results,
    pagefindResults,
    strategy,
    filters,
    triggeredAt,
    userAgent: sanitizeString(event.headers?.['user-agent'] || ''),
    referer: sanitizeString(event.headers?.referer || event.headers?.referrer || '')
  };

  const attempts = [];
  const webhookUrl = sanitizeString(process.env.SEARCH_LOG_WEBHOOK || '');
  if (webhookUrl) {
    try {
      await postToWebhook(webhookUrl, entry);
      attempts.push({ target: 'webhook', success: true });
    } catch (error) {
      console.error('Search log webhook submission failed', error);
      attempts.push({ target: 'webhook', success: false, message: error.message });
    }
  }

  const formId = sanitizeString(process.env.SEARCH_LOG_FORM_ID || '');
  const accessToken = sanitizeString(process.env.NETLIFY_ACCESS_TOKEN || '');
  if (formId && accessToken) {
    try {
      const response = await submitToNetlifyForms(formId, accessToken, entry);
      attempts.push({ target: 'netlify-forms', success: true, response });
    } catch (error) {
      console.error('Netlify Forms submission failed', error);
      attempts.push({ target: 'netlify-forms', success: false, message: error.message });
    }
  }

  if (!attempts.length) {
    console.warn('Search log received but no storage target configured.');
    return buildResponse(202, { stored: false, reason: 'No storage target configured' });
  }

  const successful = attempts.some((attempt) => attempt.success);
  const statusCode = successful ? 200 : 502;

  return buildResponse(statusCode, {
    stored: successful,
    attempts
  });
};
