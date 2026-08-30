import { ok, fail, withApi, parseBody, auditFrom, writeAudit, ApiError } from '@/lib/api-helpers';
import { hasPermission, isStaff } from '@/lib/auth-guard';
import { PERMISSIONS } from '@/lib/rbac';
import { settingsSchema } from '@/lib/validation';
import { getSchoolSettings, saveSchoolSettings, type SchoolSettings } from '@/lib/settings';

// =====================================================================
// GET /api/settings — school profile JSON (settings.manage, or any
//     staff member for the basic profile).
// PUT /api/settings — update (settings.manage). Only known SchoolSettings
//     keys are accepted; the audit row records changed keys only.
// Audited: SETTINGS_UPDATE.
// =====================================================================

const KNOWN_KEYS: (keyof SchoolSettings)[] = [
  'schoolName', 'tagline', 'addressLine', 'city', 'state', 'pincode',
  'phonePrimary', 'phoneAdmissions', 'emailPrimary', 'emailAdmissions',
  'workingHours', 'boardAffiliation', 'establishedYear', 'logoUrl',
  'primaryColor', 'accentColor',
  'facebookUrl', 'instagramUrl', 'youtubeUrl', 'twitterUrl', 'linkedinUrl',
  'mapEmbedUrl', 'admissionOpen', 'sessionLabel',
  'principalName', 'principalMessage', 'feePolicyNote', 'refundPolicyNote',
];

export const GET = withApi(
  async (_req, { user }) => {
    if (!user) return fail('Authentication required', 401);
    if (!isStaff(user) && !hasPermission(user, PERMISSIONS.SETTINGS_MANAGE)) {
      return fail('You do not have permission to perform this action', 403);
    }
    const settings = await getSchoolSettings();
    return ok(settings);
  },
);

export const PUT = withApi(
  async (req, { user, ip }) => {
    if (!user) return fail('Authentication required', 401);
    if (!hasPermission(user, PERMISSIONS.SETTINGS_MANAGE)) {
      return fail('You do not have permission to perform this action', 403);
    }

    const body = await parseBody(req, settingsSchema);

    // Build a safe patch of known keys only.
    const patch: Record<string, string | boolean> = {};
    for (const key of KNOWN_KEYS) {
      if (!(key in body)) continue;
      const value = (body as Record<string, unknown>)[key];
      if (key === 'admissionOpen') {
        patch[key] = Boolean(value);
      } else if (typeof value === 'string' || typeof value === 'number') {
        patch[key] = String(value).slice(0, 2000);
      } else if (value === null) {
        patch[key] = '';
      }
      // anything else (objects/arrays) is ignored
    }
    if (Object.keys(patch).length === 0) {
      throw new ApiError('No valid setting fields provided', 422);
    }

    const before = await getSchoolSettings();
    const after = await saveSchoolSettings(patch, user.id);

    // Record only what actually changed.
    const changed: Record<string, { before: unknown; after: unknown }> = {};
    for (const key of Object.keys(patch)) {
      const k = key as keyof SchoolSettings;
      if (JSON.stringify(before[k]) !== JSON.stringify(after[k])) {
        changed[key] = { before: before[k], after: after[k] };
      }
    }

    await writeAudit({
      ...auditFrom(user, ip, req),
      action: 'SETTINGS_UPDATE',
      entityType: 'setting',
      entityId: 'school.profile',
      before: { changedKeys: Object.keys(changed), ...Object.fromEntries(Object.entries(changed).map(([k, v]) => [k, v.before])) },
      after: Object.fromEntries(Object.entries(changed).map(([k, v]) => [k, v.after])),
    });

    return ok(after);
  },
);
