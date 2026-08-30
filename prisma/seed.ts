import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

// =====================================================================
// Sample database seed — creates:
//   school + current academic session, roles + permissions matrix,
//   demo users for every role (password: School@123),
//   classes/sections, lead sources, fee components/categories,
//   fee structures, sample students, invoices, notices, events, albums.
// Run: bun prisma/seed.ts   (idempotent-ish: wipes + recreates demo data)
// =====================================================================

const db = new PrismaClient();

const ROLE_KEYS = [
  ['SUPER_ADMIN', 'Super Admin', 'Full system control'],
  ['PRINCIPAL', 'Principal', 'School-wide oversight and approvals'],
  ['ADMISSION_COUNSELLOR', 'Admission Counsellor', 'Lead management and applications'],
  ['ACCOUNTANT', 'Accountant / Fee Manager', 'Fee structures, invoices, collections'],
  ['TEACHER', 'Teacher', 'Assigned classes, attendance'],
  ['CLASS_TEACHER', 'Class Teacher', 'Class-level student management'],
  ['FRONT_DESK', 'Front Desk Staff', 'Walk-in enquiries, basic search'],
  ['PARENT', 'Parent / Guardian', 'Own children data only'],
  ['STUDENT', 'Student', 'Own limited dashboard'],
  ['IT_ADMIN', 'IT Administrator', 'System administration'],
] as const;

const PERMISSION_KEYS = [
  'content.manage', 'notices.manage',
  'leads.read.all', 'leads.read.assigned', 'leads.write', 'leads.assign',
  'leads.import_export', 'leads.convert', 'applications.manage',
  'students.read.all', 'students.read.limited', 'students.write',
  'students.approved_contacts.manage', 'students.documents.manage',
  'classes.manage', 'attendance.mark', 'attendance.read',
  'fees.structures.manage', 'fees.invoices.generate', 'fees.payments.offline',
  'fees.payments.read', 'fees.concession.request', 'fees.concession.approve',
  'fees.refund.request', 'fees.refund.approve', 'fees.ledger.read', 'fees.online_pay',
  'users.manage', 'settings.manage', 'audit.read', 'reports.read', 'reports.financial',
  'export.data', 'portal.access', 'profile.update_request',
] as const;

async function main() {
  console.log('🌱 Seeding SP International School platform...');

  // ---------- School ----------
  const school = await db.school.upsert({
    where: { code: 'SPIS' },
    create: {
      name: 'SP International School',
      code: 'SPIS',
      address: '[Campus Address — configurable placeholder]',
      city: 'Bhubaneswar',
      state: 'Odisha',
      pincode: '751000',
      phone: '+91-XXXXX-XXXXX',
      email: 'info@spinternational.example',
      boardAffiliation: '[Board affiliation — configurable placeholder]',
      establishedYear: 2010,
      primaryColor: '#1e3a8a',
      accentColor: '#b45309',
      socialLinks: JSON.stringify({ facebook: '#', instagram: '#', youtube: '#', twitter: '#', linkedin: '#' }),
    },
    update: {},
  });

  // ---------- Academic sessions ----------
  const year = new Date().getFullYear();
  const label = `${year}-${String((year + 1) % 100).padStart(2, '0')}`;
  await db.academicSession.updateMany({ where: { isCurrent: true }, data: { isCurrent: false } });
  const session = await db.academicSession.upsert({
    where: { schoolId_name: { schoolId: school.id, name: label } },
    create: {
      schoolId: school.id, name: label,
      startDate: new Date(year, 3, 1), endDate: new Date(year + 1, 2, 31), isCurrent: true,
    },
    update: { isCurrent: true },
  });
  const prevYear = year - 1;
  await db.academicSession.upsert({
    where: { schoolId_name: { schoolId: school.id, name: `${prevYear}-${String(year % 100).padStart(2, '0')}` } },
    create: {
      schoolId: school.id, name: `${prevYear}-${String(year % 100).padStart(2, '0')}`,
      startDate: new Date(prevYear, 3, 1), endDate: new Date(year, 2, 31),
    },
    update: {},
  });

  // ---------- Roles & permissions ----------
  const roleMap: Record<string, string> = {};
  for (const [key, name, description] of ROLE_KEYS) {
    const role = await db.role.upsert({
      where: { key }, create: { key, name, description }, update: { name, description },
    });
    roleMap[key] = role.id;
  }
  for (const key of PERMISSION_KEYS) {
    await db.permission.upsert({ where: { key }, create: { key }, update: {} });
  }
  const allPerms = await db.permission.findMany();

  // Seed the runtime matrix from rbac (import-free duplication kept in sync by script)
  const { ROLE_PERMISSIONS } = await import('../src/lib/rbac');
  for (const [roleKey, perms] of Object.entries(ROLE_PERMISSIONS)) {
    const roleId = roleMap[roleKey];
    if (!roleId) continue;
    await db.rolePermission.deleteMany({ where: { roleId } });
    for (const p of perms) {
      const perm = allPerms.find((x) => x.key === p);
      if (perm) await db.rolePermission.create({ data: { roleId, permissionId: perm.id } }).catch(() => {});
    }
  }

  // ---------- Users (all demo password: School@123) ----------
  const passwordHash = await bcrypt.hash('School@123', 12);
  const mkUser = async (email: string, name: string, roles: string[], phone?: string) => {
    const user = await db.user.upsert({
      where: { email },
      create: { email, name, passwordHash, phone, emailVerified: new Date() },
      update: { name },
      include: { userRoles: true },
    });
    for (const r of roles) {
      if (!user.userRoles.some((ur) => ur.roleId === roleMap[r])) {
        await db.userRole.create({ data: { userId: user.id, roleId: roleMap[r] } }).catch(() => {});
      }
    }
    return user;
  };

  const owner = await mkUser('owner@spinternational.example', 'School Owner', ['SUPER_ADMIN'], '+91-90000-00001');
  await mkUser('principal@spinternational.example', 'Dr. Ananya Mohapatra', ['PRINCIPAL'], '+91-90000-00002');
  await mkUser('counsellor@spinternational.example', 'Ritika Das', ['ADMISSION_COUNSELLOR'], '+91-90000-00003');
  await mkUser('accounts@spinternational.example', 'Suresh Pandit', ['ACCOUNTANT'], '+91-90000-00004');
  await mkUser('teacher@spinternational.example', 'Meera Sahoo', ['TEACHER'], '+91-90000-00005');
  await mkUser('classteacher@spinternational.example', 'Jyoti Prakash', ['CLASS_TEACHER'], '+91-90000-00006');
  await mkUser('frontdesk@spinternational.example', 'Rekha Mishra', ['FRONT_DESK'], '+91-90000-00007');
  await mkUser('parent@spinternational.example', 'Arun Kumar Behera', ['PARENT'], '+91-90000-00008');
  await mkUser('student@spinternational.example', 'Aarav Behera', ['STUDENT']);
  await mkUser('itadmin@spinternational.example', 'Debasis Rath', ['IT_ADMIN'], '+91-90000-00009');

  // ---------- Classes & sections ----------
  const classDefs: [string, number][] = [
    ['Pre-Nursery', 0], ['Nursery', 1], ['LKG', 2], ['UKG', 3],
    ['Class 1', 4], ['Class 2', 5], ['Class 3', 6], ['Class 4', 7], ['Class 5', 8],
    ['Class 6', 9], ['Class 7', 10], ['Class 8', 11], ['Class 9', 12], ['Class 10', 13],
    ['Class 11', 14], ['Class 12', 15],
  ];
  const classMap: Record<string, string> = {};
  for (const [name, level] of classDefs) {
    const c = await db.classRoom.upsert({
      where: { schoolId_name: { schoolId: school.id, name } },
      create: { schoolId: school.id, name, level }, update: {},
    });
    classMap[name] = c.id;
  }
  const sectionA = await db.section.upsert({
    where: { classId_name: { classId: classMap['Class 5'], name: 'A' } },
    create: { schoolId: school.id, classId: classMap['Class 5'], name: 'A', capacity: 35, classTeacherId: (await db.user.findUnique({ where: { email: 'classteacher@spinternational.example' } }))!.id },
    update: {},
  });
  await db.section.upsert({ where: { classId_name: { classId: classMap['Class 5'], name: 'B' } }, create: { schoolId: school.id, classId: classMap['Class 5'], name: 'B', capacity: 35 }, update: {} });
  await db.section.upsert({ where: { classId_name: { classId: classMap['Class 1'], name: 'A' } }, create: { schoolId: school.id, classId: classMap['Class 1'], name: 'A', capacity: 30 }, update: {} });

  // ---------- Lead sources ----------
  const leadSourceNames = ['WEBSITE_FORM', 'WALK_IN', 'TELEPHONE', 'WHATSAPP', 'REFERRAL', 'SOCIAL_MEDIA', 'EDUCATION_FAIR', 'PARENT_REFERRAL', 'MANUAL_ENTRY', 'OTHER'];
  const leadSourceMap: Record<string, string> = {};
  for (const name of leadSourceNames) {
    const ls = await db.leadSource.upsert({
      where: { schoolId_name: { schoolId: school.id, name } },
      create: { schoolId: school.id, name }, update: {},
    });
    leadSourceMap[name] = ls.id;
  }

  // ---------- Fee components & categories ----------
  const feeComponents: [string, string][] = [
    ['ADMISSION', 'Admission Fee'], ['REGISTRATION', 'Registration Fee'], ['TUITION', 'Tuition Fee'],
    ['ANNUAL', 'Annual Fee'], ['DEVELOPMENT', 'Development Fee'], ['EXAM', 'Examination Fee'],
    ['LAB', 'Lab Fee'], ['LIBRARY', 'Library Fee'], ['TRANSPORT', 'Transport Fee'],
    ['HOSTEL', 'Hostel Fee'], ['ACTIVITY', 'Activity Fee'], ['SMART_CLASS', 'Smart Class Fee'],
  ];
  const compMap: Record<string, string> = {};
  for (const [code, name] of feeComponents) {
    const fc = await db.feeComponent.upsert({
      where: { code }, create: { schoolId: school.id, code, name }, update: { name },
    });
    compMap[code] = fc.id;
  }
  const academicCat = await db.feeCategory.upsert({
    where: { schoolId_name: { schoolId: school.id, name: 'Academic' } },
    create: { schoolId: school.id, name: 'Academic', description: 'Regular academic fees' }, update: {},
  });
  const oneTimeCat = await db.feeCategory.upsert({
    where: { schoolId_name: { schoolId: school.id, name: 'One-time' } },
    create: { schoolId: school.id, name: 'One-time', description: 'One-time charges' }, update: {},
  });

  // ---------- Fee structures ----------
  const structure = await db.feeStructure.upsert({
    where: { academicSessionId_classId_name: { academicSessionId: session.id, classId: classMap['Class 5'], name: 'Standard 2025-26' } },
    create: {
      schoolId: school.id, academicSessionId: session.id, classId: classMap['Class 5'],
      name: 'Standard 2025-26', status: 'ACTIVE', effectiveFrom: new Date(year, 3, 1),
      createdById: owner.id,
      totalAmount: 0,
      items: {
        create: [
          { feeComponentId: compMap['TUITION'], amount: 185000, frequency: 'MONTHLY', dueDay: 10, installmentCount: 12, feeCategoryId: academicCat.id },
          { feeComponentId: compMap['ANNUAL'], amount: 1200000, frequency: 'ANNUAL', installmentCount: 1, feeCategoryId: academicCat.id },
          { feeComponentId: compMap['EXAM'], amount: 25000, frequency: 'ANNUAL', installmentCount: 3, feeCategoryId: academicCat.id },
          { feeComponentId: compMap['SMART_CLASS'], amount: 10000, frequency: 'MONTHLY', installmentCount: 12, feeCategoryId: academicCat.id },
        ],
      },
    },
    update: {},
  });
  const total = (185000 + 10000) + 1200000 + Math.round(25000 / 3);
  await db.feeStructure.update({ where: { id: structure.id }, data: { totalAmount: total } });

  await db.lateFeeRule.create({
    data: {
      schoolId: school.id, name: 'Standard late fee',
      ruleType: 'FIXED', amount: 5000, gracePeriodDays: 7, maxAmount: 50000,
      academicSessionId: session.id,
    },
  });

  // ---------- Students ----------
  const demoStudents: [string, string, string, string, string][] = [
    ['Aarav', 'Behera', 'Class 5', 'MALE', 'SPIS/2025/0001'],
    ['Ishita', 'Mohanty', 'Class 5', 'FEMALE', 'SPIS/2025/0002'],
    ['Rohan', 'Patra', 'Class 5', 'MALE', 'SPIS/2025/0003'],
    ['Ananya', 'Sahu', 'Class 1', 'FEMALE', 'SPIS/2025/0004'],
    ['Kabir', 'Jena', 'Class 1', 'MALE', 'SPIS/2025/0005'],
  ];
  const studentMap: Record<string, string> = {};
  const parentUser = await db.user.findUnique({ where: { email: 'parent@spinternational.example' } });
  const studentUser = await db.user.findUnique({ where: { email: 'student@spinternational.example' } });

  for (let i = 0; i < demoStudents.length; i++) {
    const [first, last, cls, gender, admNo] = demoStudents[i];
    const existing = await db.student.findUnique({ where: { admissionNumber: admNo } });
    if (existing) { studentMap[first] = existing.id; continue; }
    let guardianId: string | undefined;
    if (first === 'Aarav' && parentUser) {
      const g = await db.guardian.upsert({
        where: { userId: parentUser.id },
        create: {
          schoolId: school.id, fullName: 'Arun Kumar Behera', relationship: 'FATHER',
          mobile: '+9190000000008', email: 'parent@spinternational.example',
          occupation: '[Occupation]', isPrimaryContact: true, isEmergencyContact: true,
          consentStatus: 'APPROVED', consentAt: new Date(), userId: parentUser.id,
        },
        update: {},
      });
      guardianId = g.id;
    }
    const s = await db.student.create({
      data: {
        schoolId: school.id, admissionNumber: admNo, academicSessionId: session.id,
        firstName: first, lastName: last, dateOfBirth: new Date(2014 + (i % 3), 5, 10 + i),
        gender, bloodGroup: ['A+', 'B+', 'O+', 'AB+', 'O-'][i],
        admissionDate: new Date(year, 3, 15),
        classId: classMap[cls], sectionId: cls === 'Class 5' ? sectionA.id : null,
        rollNumber: String(i + 1), status: 'ACTIVE',
        userId: first === 'Aarav' ? studentUser?.id : null,
        createdById: owner.id,
        approvedContacts: {
          create: [
            { contactName: `${first}'s Mother`, relationship: 'MOTHER', mobile: '+91900000001' + i, approvalStatus: 'APPROVED', approvedAt: new Date(), approvedBy: owner.id },
            { contactName: 'House Helper', relationship: 'OTHER', mobile: '+91900000002' + i, approvalStatus: 'PENDING' },
          ],
        },
      },
    });
    studentMap[first] = s.id;
    if (guardianId) {
      await db.studentGuardian.upsert({
        where: { studentId_guardianId: { studentId: s.id, guardianId } },
        create: { studentId: s.id, guardianId, isPrimary: true },
        update: { isPrimary: true },
      });
    }
    await db.studentFeeAssignment.create({
      data: { studentId: s.id, feeStructureId: structure.id, academicSessionId: session.id, assignedBy: owner.id },
    });
  }

  // ---------- Sample invoices + one paid payment ----------
  const accountant = await db.user.findUnique({ where: { email: 'accounts@spinternational.example' } });
  const invoiceCount = await db.invoice.count();
  if (invoiceCount === 0) {
    for (const [first, , cls] of demoStudents) {
      const inv = await db.invoice.create({
        data: {
          schoolId: school.id, invoiceNumber: `INV-${label}-${String(Object.keys(studentMap).indexOf(first) + 1).padStart(6, '0')}`,
          studentId: studentMap[first], academicSessionId: session.id,
          issueDate: new Date(), dueDate: new Date(Date.now() + 12 * 86400000),
          periodLabel: 'Annual 2025-26', status: 'ISSUED',
          subtotal: total, total, balance: total, generatedBy: accountant?.id,
          items: {
            create: [
              { description: 'Tuition Fee (monthly)', amount: 195000, total: 195000, feeComponentId: compMap['TUITION'], periodLabel: 'Annual 2025-26' },
              { description: 'Annual Fee', amount: 1200000, total: 1200000, feeComponentId: compMap['ANNUAL'], periodLabel: 'Annual 2025-26' },
              { description: 'Examination Fee', amount: 8333, total: 8333, feeComponentId: compMap['EXAM'], periodLabel: 'Annual 2025-26' },
            ],
          },
        },
      });
      // first student has a partially paid invoice
      if (first === 'Aarav') {
        const payment = await db.payment.create({
          data: {
            schoolId: school.id, studentId: studentMap[first], invoiceId: inv.id,
            amount: 500000, mode: 'UPI', status: 'CONFIRMED', referenceNumber: 'UPI-DEMO-001',
            paidAt: new Date(), receivedBy: accountant?.id, verifiedBy: accountant?.id, verifiedAt: new Date(),
          },
        });
        await db.paymentAllocation.create({
          data: { paymentId: payment.id, invoiceId: inv.id, amount: 500000, allocatedBy: accountant?.id },
        });
        await db.receipt.create({
          data: {
            schoolId: school.id, receiptNumber: `RCP-${label}-000001`, paymentId: payment.id,
            studentId: studentMap[first], invoiceId: inv.id, amount: 500000, issuedBy: accountant?.id,
          },
        });
        await db.invoice.update({
          where: { id: inv.id },
          data: { paidTotal: 500000, balance: total - 500000, status: 'PARTIALLY_PAID' },
        });
      }
    }
  }

  // ---------- Sample leads ----------
  const leadCount = await db.admissionLead.count();
  if (leadCount === 0) {
    const counsellor = await db.user.findUnique({ where: { email: 'counsellor@spinternational.example' } });
    const leadDefs: [string, string, string, string, string][] = [
      ['Priya Nanda', 'Class 2', 'NEW', 'WALK_IN', 'HIGH'],
      ['Sourav Mishra', 'Class 6', 'CONTACTED', 'WEBSITE_FORM', 'MEDIUM'],
      ['Kavya Reddy', 'LKG', 'FOLLOW_UP', 'WHATSAPP', 'HIGH'],
      ['Aditya Swain', 'Class 9', 'VISIT_SCHEDULED', 'TELEPHONE', 'MEDIUM'],
      ['Naina Panda', 'Nursery', 'APPLICATION_SUBMITTED', 'REFERRAL', 'HIGH'],
      ['Arjun Behera', 'Class 11', 'OFFER_MADE', 'SOCIAL_MEDIA', 'MEDIUM'],
      ['Tanmay Das', 'Class 3', 'LOST', 'WEBSITE_FORM', 'LOW'],
    ];
    for (let i = 0; i < leadDefs.length; i++) {
      const [name, cls, status, source, priority] = leadDefs[i];
      const lead = await db.admissionLead.create({
        data: {
          schoolId: school.id, leadNumber: `LEAD-${label}-${String(i + 1).padStart(6, '0')}`,
          studentName: name, classApplyingFor: cls, academicSessionId: session.id,
          guardianName: `Guardian of ${name}`,
          mobile: `+91900001${String(1000 + i)}`, email: `lead${i + 1}@example.com`,
          city: 'Bhubaneswar', leadSourceId: leadSourceMap[source],
          assignedTo: counsellor?.id, status, priority,
          nextFollowUpDate: i % 2 === 0 ? new Date(Date.now() + (i + 1) * 86400000) : null,
          createdById: owner.id,
        },
      });
      await db.leadActivity.create({
        data: { leadId: lead.id, type: 'NOTE', title: 'Lead created', content: 'Seeded demo lead' },
      });
      if (status === 'VISIT_SCHEDULED') {
        await db.campusVisit.create({
          data: { leadId: lead.id, scheduledAt: new Date(Date.now() + 3 * 86400000), visitorName: `Guardian of ${name}` },
        });
      }
    }
  }

  // ---------- Notices & events ----------
  if ((await db.notice.count()) === 0) {
    await db.notice.createMany({
      data: [
        {
          schoolId: school.id, title: 'Admission Open for 2025-26 Session',
          slug: 'admission-open-2025-26',
          content: 'Admissions are now open for the 2025-26 academic session from Pre-Nursery to Class 11.\n\nParents may submit an online enquiry through the Admissions page or visit the school office between 9:00 AM and 2:00 PM on working days.\n\nLimited seats available. Early enquiry is encouraged.',
          category: 'ADMISSION', audience: 'PUBLIC', isPublished: true, publishedAt: new Date(),
        },
        {
          schoolId: school.id, title: 'Annual Sports Day — Date Announcement',
          slug: 'annual-sports-day',
          content: 'The Annual Sports Day will be held on the school grounds this session. All parents are invited.\n\nDetailed schedule will be shared through the parent portal and circulars.',
          category: 'EVENT', audience: 'ALL', isPublished: true, publishedAt: new Date(),
        },
        {
          schoolId: school.id, title: 'Fee Payment — Quarterly Window',
          slug: 'fee-payment-quarterly-window',
          content: 'The fee payment window for the current term is now open. Parents can pay online through the parent portal or at the school accounts office.\n\nPlease quote the invoice number with offline payments. Late fee applies after the due date as per school policy.',
          category: 'FEE', audience: 'PARENTS', isPublished: true, publishedAt: new Date(),
        },
      ],
    });
    await db.event.createMany({
      data: [
        {
          schoolId: school.id, title: 'Parent-Teacher Meeting',
          slug: 'ptm-' + label, description: 'Term-wise parent-teacher meeting. Class teachers will share progress reports.',
          startsAt: new Date(Date.now() + 10 * 86400000), location: 'School Auditorium', isPublished: true,
        },
        {
          schoolId: school.id, title: 'Science Exhibition',
          slug: 'science-exhibition-' + label, description: 'Student-led science exhibition open to all parents and visitors.',
          startsAt: new Date(Date.now() + 20 * 86400000), location: 'Main Hall', isPublished: true,
        },
      ],
    });
  }

  // ---------- Gallery ----------
  if ((await db.galleryAlbum.count()) === 0) {
    const album = await db.galleryAlbum.create({
      data: { schoolId: school.id, title: 'Campus Life', slug: 'campus-life', description: 'Glimpses of everyday campus life [placeholder album — upload via dashboard]' },
    });
    await db.galleryAlbum.create({
      data: { schoolId: school.id, title: 'Annual Functions', slug: 'annual-functions', description: 'Celebrations and annual day events [placeholder]' },
    });
    void album;
  }

  // ---------- Website pages ----------
  if ((await db.websitePage.count()) === 0) {
    await db.websitePage.createMany({
      data: [
        { schoolId: school.id, slug: 'privacy-policy', title: 'Privacy Policy', content: 'PRIVACY_POLICY_PLACEHOLDER', metaTitle: 'Privacy Policy' },
        { schoolId: school.id, slug: 'refund-policy', title: 'Refund Policy', content: 'REFUND_POLICY_PLACEHOLDER', metaTitle: 'Refund Policy' },
        { schoolId: school.id, slug: 'terms-of-use', title: 'Terms of Use', content: 'TERMS_PLACEHOLDER', metaTitle: 'Terms of Use' },
        { schoolId: school.id, slug: 'child-safety-policy', title: 'Child Safety Policy', content: 'CHILD_SAFETY_PLACEHOLDER', metaTitle: 'Child Safety Policy' },
        { schoolId: school.id, slug: 'fee-policy', title: 'Fee Policy', content: 'FEE_POLICY_PLACEHOLDER', metaTitle: 'Fee Policy' },
      ],
    });
  }

  // ---------- Sync number sequences with existing rows ----------
  const seqSpecs: [string, 'LEAD' | 'APPLICATION' | 'INVOICE' | 'RECEIPT', string][] = [
    ['leadNumber', 'LEAD', 'LEAD'],
    ['applicationNumber', 'APPLICATION', 'APP'],
    ['invoiceNumber', 'INVOICE', 'INV'],
    ['receiptNumber', 'RECEIPT', 'RCP'],
  ];
  for (const [field, kind, prefix] of seqSpecs) {
    type FindTable = { findFirst: (a: unknown) => Promise<Record<string, string> | null> };
    const models: Record<string, FindTable> = {
      LEAD: db.admissionLead, APPLICATION: db.admissionApplication,
      INVOICE: db.invoice, RECEIPT: db.receipt,
    } as unknown as Record<string, FindTable>;
    const table = models[kind];
    const latest = await (table as { findFirst: (a: unknown) => Promise<Record<string, string> | null> }).findFirst({
      where: { schoolId: school.id },
      orderBy: { createdAt: 'desc' },
    });
    const num = latest?.[field] as string | undefined;
    const match = num?.match(/(\d+)$/);
    const nextVal = match ? parseInt(match[1], 10) : 0;
    const key = `${kind}:${label}`;
    await db.numberSequence.upsert({
      where: { schoolId_key: { schoolId: school.id, key } },
      create: { schoolId: school.id, key, prefix, currentValue: nextVal },
      update: { currentValue: nextVal },
    });
  }

  console.log('✅ Seed complete.');
  console.log('   Demo logins (password: School@123):');
  console.log('   • owner@spinternational.example      SUPER_ADMIN');
  console.log('   • principal@spinternational.example  PRINCIPAL');
  console.log('   • counsellor@spinternational.example ADMISSION_COUNSELLOR');
  console.log('   • accounts@spinternational.example   ACCOUNTANT');
  console.log('   • teacher@spinternational.example    TEACHER');
  console.log('   • classteacher@spinternational.example CLASS_TEACHER');
  console.log('   • frontdesk@spinternational.example  FRONT_DESK');
  console.log('   • parent@spinternational.example     PARENT');
  console.log('   • student@spinternational.example    STUDENT');
  console.log('   • itadmin@spinternational.example    IT_ADMIN');
}

main()
  .catch((e) => { console.error('❌ Seed failed:', e); process.exit(1); })
  .finally(() => db.$disconnect());
