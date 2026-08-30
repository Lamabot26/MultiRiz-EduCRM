import { redirect } from 'next/navigation';
import { requireUser, hasPermission } from '@/lib/auth-guard';
import { PERMISSIONS } from '@/lib/rbac';
import { getSchoolSettings } from '@/lib/settings';
import { SettingsForm } from '@/components/settings/settings-form';

export const dynamic = 'force-dynamic';

export default async function SettingsPage() {
  const user = await requireUser();
  if (!hasPermission(user, PERMISSIONS.SETTINGS_MANAGE)) redirect('/dashboard?denied=1');

  const settings = await getSchoolSettings();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground">
          School profile, branding and data operations. Every change is audited.
        </p>
      </div>
      <SettingsForm initial={settings} />
    </div>
  );
}
