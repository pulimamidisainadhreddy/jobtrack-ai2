import { notFound } from 'next/navigation';
import Workspace from '@/components/workspace';

const sections = ['dashboard', 'applications', 'kanban', 'assistant', 'follow-ups', 'goals', 'data'];

export default async function SectionPage({ params }: { params: Promise<{ section: string }> }) {
  const { section } = await params;
  if (!sections.includes(section)) notFound();
  return <Workspace section={section} />;
}
