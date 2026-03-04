import { Metadata } from 'next'
import ArtifactDetailClient from './ArtifactDetailClient'

interface PageProps {
  params: Promise<{ id: string }>
}

// Generate static params for all artifact IDs
export async function generateStaticParams() {
  // Return some sample IDs for static generation
  // In production, this would fetch from API
  return [
    { id: '1' },
    { id: '2' },
    { id: '3' },
  ]
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params
  return {
    title: `Artifact | Mission Control`,
    description: 'View knowledge artifact details',
  }
}

export default async function ArtifactDetailPage({ params }: PageProps) {
  const { id } = await params
  return <ArtifactDetailClient artifactId={id} />
}
