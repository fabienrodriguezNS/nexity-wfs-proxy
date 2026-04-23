// Vercel Edge Function — Proxy CORS pour CARMEN/INPN
// Déployer sur vercel.com avec le projet "nexity-wfs-proxy"

export const config = { runtime: 'edge' };

export default async function handler(request) {
  // OPTIONS preflight
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  }

  const { searchParams } = new URL(request.url);
  const target = searchParams.get('url');
  if (!target) {
    return new Response('Missing url parameter', { status: 400 });
  }

  // Sécurité : on n'accepte que les requêtes vers CARMEN/INPN
  if (!target.startsWith('https://ws.carmencarto.fr/') && !target.startsWith('https://inpn.mnhn.fr/')) {
    return new Response('Forbidden: only CARMEN/INPN endpoints allowed', { status: 403 });
  }

  try {
    const response = await fetch(target, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/xml, application/xml, */*',
        'Accept-Language': 'fr-FR,fr;q=0.9,en;q=0.8',
        'Referer': 'https://inpn.mnhn.fr/',
        'Origin': 'https://inpn.mnhn.fr',
      },
    });

    const body = await response.text();

    return new Response(body, {
      status: response.status,
      headers: {
        'Content-Type': response.headers.get('Content-Type') || 'text/xml',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Cache-Control': 'public, max-age=3600', // cache 1h côté Vercel
      },
    });
  } catch (err) {
    return new Response(`Proxy error: ${err.message}`, { status: 502 });
  }
}
