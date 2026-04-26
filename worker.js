export default {
  async fetch(request, env) {
    try {
      const response = await env.ASSETS.fetch(request);
      if (response.status !== 404) return response;
    } catch {}
    // SPAルーティング: 存在しないパスはindex.htmlを返す
    const url = new URL(request.url);
    return env.ASSETS.fetch(new URL('/index.html', url.origin));
  },
};
