import { db } from './db';

// =====================================================================
// School settings — configurable placeholders for everything the spec
// says NOT to hard-code (name, address, phone, colours, socials, etc).
// Stored in the Setting table as JSON; falls back to safe defaults.
// =====================================================================

export type SchoolSettings = {
  schoolName: string;
  tagline: string;
  addressLine: string;
  city: string;
  state: string;
  pincode: string;
  phonePrimary: string;
  phoneAdmissions: string;
  emailPrimary: string;
  emailAdmissions: string;
  workingHours: string;
  boardAffiliation: string;
  establishedYear: string;
  logoUrl: string;
  primaryColor: string;
  accentColor: string;
  facebookUrl: string;
  instagramUrl: string;
  youtubeUrl: string;
  twitterUrl: string;
  linkedinUrl: string;
  mapEmbedUrl: string;
  admissionOpen: boolean;
  sessionLabel: string;
  principalName: string;
  principalMessage: string;
  feePolicyNote: string;
  refundPolicyNote: string;
};

export const DEFAULT_SETTINGS: SchoolSettings = {
  schoolName: 'SP International School',
  tagline: 'Nurturing global citizens with Indian values',
  addressLine: '[Campus Address — configurable placeholder]',
  city: 'Bhubaneswar',
  state: 'Odisha',
  pincode: '[PIN]',
  phonePrimary: '+91-XXXXX-XXXXX',
  phoneAdmissions: '+91-XXXXX-XXXXX',
  emailPrimary: 'info@spinternational.example',
  emailAdmissions: 'admissions@spinternational.example',
  workingHours: 'Mon – Sat, 8:00 AM – 3:00 PM',
  boardAffiliation: '[Board affiliation — configurable placeholder]',
  establishedYear: '[Year]',
  logoUrl: '',
  primaryColor: '#1e3a8a',
  accentColor: '#b45309',
  facebookUrl: '#',
  instagramUrl: '#',
  youtubeUrl: '#',
  twitterUrl: '#',
  linkedinUrl: '#',
  mapEmbedUrl: '',
  admissionOpen: true,
  sessionLabel: '2025-26',
  principalName: '[Principal Name]',
  principalMessage: 'Welcome message placeholder — editable by the school from Settings.',
  feePolicyNote: 'Fee structure details for the current session are available at the school office. This is a configurable placeholder.',
  refundPolicyNote: 'Refund policy content is a configurable placeholder managed by the school.',
};

const SETTINGS_KEY = 'school.profile';

export async function getSchoolSettings(): Promise<SchoolSettings> {
  try {
    const row = await db.setting.findUnique({ where: { key: SETTINGS_KEY } });
    if (!row) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...(JSON.parse(row.value) as Partial<SchoolSettings>) };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export async function saveSchoolSettings(patch: Partial<SchoolSettings>, updatedBy?: string): Promise<SchoolSettings> {
  const current = await getSchoolSettings();
  const next = { ...current, ...patch };
  const value = JSON.stringify(next);
  const existing = await db.setting.findUnique({ where: { key: SETTINGS_KEY } });
  if (existing) {
    await db.setting.update({ where: { key: SETTINGS_KEY }, data: { value, updatedBy } });
  } else {
    await db.setting.create({ data: { key: SETTINGS_KEY, value, category: 'school', updatedBy } });
  }
  return next;
}
