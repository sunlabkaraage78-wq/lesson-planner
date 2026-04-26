const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, PUT, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: CORS_HEADERS });
    }

    // API: GET /api/data/:year
    if (request.method === 'GET' && url.pathname.startsWith('/api/data/')) {
      const year = url.pathname.split('/')[3];
      const value = await env.LESSON_DATA.get(`state_${year}`);
      return new Response(value || 'null', {
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      });
    }

    // API: PUT /api/data/:year
    if (request.method === 'PUT' && url.pathname.startsWith('/api/data/')) {
      const year = url.pathname.split('/')[3];
      const body = await request.text();
      await env.LESSON_DATA.put(`state_${year}`, body);
      return new Response('ok', { headers: CORS_HEADERS });
    }

    // SPAルーティング: 静的ファイル優先、なければindex.htmlを返す
    try {
      const response = await env.ASSETS.fetch(request);
      if (response.status !== 404) return response;
    } catch {}
    const origin = url.origin;
    return env.ASSETS.fetch(new URL('/index.html', origin));
  },
};
