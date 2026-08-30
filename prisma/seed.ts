import { db } from '../src/lib/db'
import bcrypt from 'bcryptjs'

async function main() {
  const passwordHash = await bcrypt.hash('admin@2026SP', 10)

  // Create or update admin user
  const admin = await db.adminUser.upsert({
    where: { username: 'spisadmin' },
    update: {
      passwordHash,
      name: 'SPIS Administrator',
      role: 'SUPER_ADMIN',
      isActive: true,
    },
    create: {
      username: 'spisadmin',
      passwordHash,
      name: 'SPIS Administrator',
      role: 'SUPER_ADMIN',
      isActive: true,
    },
  })

  console.log('✓ Admin user created:', admin.username)

  // Seed some default classes
  const grades = ['Pre-Nursery', 'Nursery', 'LKG', 'UKG', 'Class 1', 'Class 2', 'Class 3', 'Class 4', 'Class 5']
  for (const grade of grades) {
    await db.classRoom.upsert({
      where: { name: grade },
      update: {},
      create: {
        name: grade,
        grade,
        section: 'A',
        capacity: 30,
      },
    })
  }
  console.log('✓ Default classes created:', grades.length)

  // Seed team members
  const teamMembers = [
    { name: 'Dr. Anjali Mohanty', position: 'Vice Principal — Academics', bio: 'Doctorate in Education with a passion for curriculum design and teacher development, ensuring academic rigour across all grades.', imageUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&h=400&fit=crop', order: 1 },
    { name: 'Rajeev Ranjan Das', position: 'Head of Administration', bio: 'Ensures smooth campus operations, safety protocols, and infrastructure excellence across both campuses.', imageUrl: 'https://images.unsplash.com/photo-1472094085858-86c2f6f8d50a?w=400&h=400&fit=crop', order: 2 },
    { name: 'Priyanka Pattnaik', position: 'Head of Pre-Primary', bio: 'Specialist in early childhood education, creating joyful, play-based learning environments for our youngest learners.', imageUrl: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&h=400&fit=crop', order: 3 },
    { name: 'Sourav Mishra', position: 'Head of Sports & Physical Education', bio: 'National-level coach building champions on the field and character off it, across athletics, cricket, and football.', imageUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop', order: 4 },
    { name: 'Lipika Sahoo', position: 'Head of Arts & Culture', bio: 'Fostering creativity through music, dance, drama, and visual arts, enriching every child\'s cultural journey.', imageUrl: 'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=400&h=400&fit=crop', order: 5 },
  ]

  for (const member of teamMembers) {
    await db.teamMember.upsert({
      where: { id: member.name }, // using name as a pseudo-key for upsert
      update: {},
      create: member,
    })
  }
  console.log('✓ Team members created:', teamMembers.length)

  // Seed notices
  const notices = [
    { title: 'Admissions Open for 2026-27', content: 'We are now accepting applications for the academic year 2026-27. Please contact the school office for enquiry forms and campus visit appointments.', category: 'ADMISSION', date: new Date().toISOString().split('T')[0] },
    { title: 'Annual Sports Day', content: 'The Annual Sports Day will be held at the school sports complex. All parents are cordially invited to attend.', category: 'EVENT', date: new Date().toISOString().split('T')[0] },
    { title: 'Parent-Teacher Meeting', content: 'PTM scheduled for all grades. Please check the specific time slot for your child\'s class.', category: 'ACADEMIC', date: new Date().toISOString().split('T')[0] },
  ]

  for (const notice of notices) {
    await db.notice.create({ data: notice })
  }
  console.log('✓ Notices created:', notices.length)

  console.log('\n🎉 Seed complete!')
  console.log('   Admin login: spisadmin / admin@2026SP')
}

main()
  .catch((e) => {
    console.error('Seed error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await db.$disconnect()
  })
