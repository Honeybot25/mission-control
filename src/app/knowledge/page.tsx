import { Metadata } from 'next'
import KnowledgePageClient from './KnowledgePageClient'

export const metadata: Metadata = {
  title: 'Knowledge | Mission Control',
  description: 'Second brain for agent insights and knowledge management',
}

export default function KnowledgePage() {
  return <KnowledgePageClient />
}
