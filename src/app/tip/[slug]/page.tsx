import { notFound, permanentRedirect } from 'next/navigation';

interface TypePageProps {
  params: Promise<{ slug: string }>;
}

export default async function TypePage({ params }: TypePageProps) {
  const { slug } = await params;
  if (slug === 'pc') permanentRedirect('/bakida-pc-klublari');
  if (slug === 'playstation') permanentRedirect('/bakida-playstation-klublari');
  notFound();
}
