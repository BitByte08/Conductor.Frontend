/**
 * SPA fallback handler for Cloudflare Workers
 * Routes all non-asset requests to index.html
 */
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url)
    const pathname = url.pathname

    // Static asset paths that should not fallback
    const staticPaths = ['/api', '/ws', '/auth', '/assets']
    
    // If it's an API/WebSocket request, don't serve index.html
    if (staticPaths.some(p => pathname.startsWith(p)) || pathname.includes('.')) {
      return env.ASSETS.fetch(request)
    }

    // For all other paths (routing), serve index.html
    const asset = await env.ASSETS.fetch(new Request(url.origin + '/index.html', request))
    return new Response(asset.body, {
      ...asset,
      headers: new Headers(asset.headers)
    })
  }
}
