import { getSchoolSettings } from '@/lib/settings';
import { SiteHeader } from '@/components/public/site-header';
import { SiteFooter } from '@/components/public/site-footer';

// Public website shell: sticky header + content + sticky-to-bottom footer.
// The min-h-screen flex wrapper guarantees the footer hugs the viewport bottom
// on short pages and is pushed down naturally on long pages.

export default async function PublicLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const settings = await getSchoolSettings();

  return (
    <div className="flex min-h-screen flex-1 flex-col">
      <SiteHeader settings={settings} />
      <main id="main-content" className="flex-1">
        {children}
      </main>
      <SiteFooter settings={settings} />
    </div>
  );
}
