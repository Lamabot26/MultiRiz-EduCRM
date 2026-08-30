import { PublicHome } from '@/components/public/public-home'

export const metadata = {
  title: 'SP International School, Bhubaneswar | CBSE School',
  description: 'A premier CBSE school dedicated to excellence. 2-acre campus, 6 labs, 13400+ books, smart classrooms. Admissions open for 2026-27.',
}

export const dynamic = 'force-dynamic'

export default function Home() {
  return <PublicHome />
}
