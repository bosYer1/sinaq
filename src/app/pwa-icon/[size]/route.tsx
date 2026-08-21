export async function GET(
  request: Request,
  { params }: { params: Promise<{ size: string }> }
) {
  const { size } = await params;

  if (size !== '192' && size !== '512') {
    return new Response('Not found', { status: 404 });
  }

  return Response.redirect(new URL('/gameyer-logo.jpeg', request.url), 307);
}
