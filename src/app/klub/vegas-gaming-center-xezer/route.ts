const body = `<!doctype html>
<html lang="az">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="robots" content="noindex, follow" />
  <title>Klub tapılmadı | GameYer</title>
</head>
<body>
  <main>
    <h1>Klub tapılmadı</h1>
    <p>Bu klub hazırda GameYer-də aktiv deyil.</p>
    <p><a href="/">Aktiv gaming klublarına bax</a></p>
  </main>
</body>
</html>`;

export function GET() {
  return new Response(body, {
    status: 404,
    headers: {
      'content-type': 'text/html; charset=utf-8',
      'x-robots-tag': 'noindex, follow',
      'cache-control': 'public, s-maxage=60, stale-while-revalidate=300',
    },
  });
}
