import { Metadata } from 'next'
import FashionAestheticsClient from './FashionAestheticsClient'

export const metadata: Metadata = {
  title: 'Fashion & Aesthetics Radar | Mission Control',
  description: 'Bella Hadid meets Alix Earle aesthetic tracker - style, content, and Notion integration',
}

export default function FashionAestheticsPage() {
  return <FashionAestheticsClient />
}