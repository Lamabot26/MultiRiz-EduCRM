import Link from 'next/link';
import { db } from '@/lib/db';
import { getSchoolSettings } from '@/lib/settings';
import { fmtDate } from '@/lib/date-utils';
import { ArrowLeft, Image as ImageIcon, Images, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export const metadata = {
  title: 'Gallery',
  description:
    'Photo albums from SP International School, Bhubaneswar — events, celebrations, classroom moments and campus life.',
};

export const dynamic = 'force-dynamic';

type Search = { slug?: string };

async function fetchAlbums() {
  return db.galleryAlbum.findMany({
    where: { isPublished: true },
    orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
    include: { _count: { select: { items: true } } },
  });
}

async function fetchAlbumWithItems(slug: string) {
  if (!slug) return null;
  return db.galleryAlbum.findUnique({
    where: { slug },
    include: {
      items: {
        where: { isPublished: true },
        orderBy: { sortOrder: 'asc' },
        select: {
          id: true,
          caption: true,
          mediaFile: { select: { publicUrl: true, originalName: true } },
        },
      },
    },
  });
}

export default async function GalleryPage({ searchParams }: { searchParams: Promise<Search> }) {
  const { slug = '' } = await searchParams;
  const settings = await getSchoolSettings();

  if (slug) {
    let album: Awaited<ReturnType<typeof fetchAlbumWithItems>> = null;
    try {
      album = await fetchAlbumWithItems(slug);
    } catch {
      album = null;
    }

    if (!album || !album.isPublished) {
      return (
        <section className="mx-auto max-w-2xl px-4 py-20 lg:px-8 lg:py-28" aria-labelledby="album-missing">
          <Card className="sp-card-shadow">
            <CardContent className="flex flex-col items-center p-10 text-center">
              <span className="flex h-16 w-16 items-center justify-center rounded-full bg-secondary" aria-hidden="true">
                <Images className="h-8 w-8 text-primary" />
              </span>
              <h1 id="album-missing" className="mt-5 text-2xl font-bold text-primary">
                Album not found
              </h1>
              <p className="mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
                This album may have been unpublished or renamed. All published albums are
                listed on the gallery page.
              </p>
              <Button asChild className="mt-6 h-11 sp-gold-gradient font-semibold text-primary hover:opacity-90">
                <Link href="/gallery">
                  <ArrowLeft className="mr-2 h-4 w-4" aria-hidden="true" />
                  Back to Gallery
                </Link>
              </Button>
            </CardContent>
          </Card>
        </section>
      );
    }

    return (
      <>
        <article className="mx-auto max-w-7xl px-4 py-12 lg:px-8 lg:py-16">
          <nav aria-label="Breadcrumb">
            <Link
              href="/gallery"
              className="inline-flex min-h-11 items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-primary focus-visible:outline-2 focus-visible:outline-ring"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              All albums
            </Link>
          </nav>

          <header className="mt-5">
            <Badge variant="secondary" className="text-[11px] font-semibold uppercase tracking-wide">
              {album.items.length} {album.items.length === 1 ? 'photo' : 'photos'}
            </Badge>
            <h1 className="mt-3 text-3xl font-extrabold text-primary sm:text-4xl">{album.title}</h1>
            {album.description && (
              <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-muted-foreground">{album.description}</p>
            )}
          </header>

          {album.items.length === 0 ? (
            <div className="mt-10 flex flex-col items-center rounded-2xl border border-dashed border-border bg-card p-12 text-center">
              <Images className="h-10 w-10 text-muted-foreground/50" aria-hidden="true" />
              <p className="mt-4 font-semibold text-foreground">Photos coming soon</p>
              <p className="mt-1 max-w-md text-sm text-muted-foreground">
                This album has been created but photographs are still being curated —
                they are managed from the Admin Dashboard and will appear here shortly.
              </p>
            </div>
          ) : (
            <ul className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {album.items.map((item) => {
                const url = item.mediaFile.publicUrl;
                const caption = item.caption ?? item.mediaFile.originalName;
                return (
                  <li key={item.id} className="group">
                    <div
                      className="flex h-52 items-center justify-center overflow-hidden rounded-2xl border bg-card transition-all group-hover:-translate-y-1 group-hover:shadow-lg"
                      role={url ? 'img' : undefined}
                      aria-label={url ? caption : undefined}
                      style={url ? { backgroundImage: `url(${url})`, backgroundSize: 'cover', backgroundPosition: 'center' } : undefined}
                    >
                      {!url && <ImageIcon className="h-10 w-10 text-muted-foreground/40" aria-hidden="true" />}
                    </div>
                    <p className="mt-2 truncate px-1 text-sm text-muted-foreground" title={caption}>
                      {caption}
                    </p>
                  </li>
                );
              })}
            </ul>
          )}
        </article>
      </>
    );
  }

  // ---- Albums grid ----
  let albums: Awaited<ReturnType<typeof fetchAlbums>> = [];
  try {
    albums = await fetchAlbums();
  } catch {
    albums = [];
  }
  const coverIds = albums.map((a) => a.coverImageId).filter((id): id is string => Boolean(id));
  let covers: { id: string; publicUrl: string | null }[] = [];
  if (coverIds.length > 0) {
    try {
      covers = await db.mediaFile.findMany({
        where: { id: { in: coverIds } },
        select: { id: true, publicUrl: true },
      });
    } catch {
      covers = [];
    }
  }
  const coverMap = new Map(covers.map((c) => [c.id, c.publicUrl]));

  return (
    <>
      {/* Page hero */}
      <section className="sp-hero-gradient text-primary-foreground" aria-labelledby="gallery-hero">
        <div className="mx-auto max-w-7xl px-4 py-14 lg:px-8 lg:py-20">
          <p className="text-sm font-semibold uppercase tracking-widest text-accent-foreground/90">Gallery</p>
          <h1 id="gallery-hero" className="mt-2 max-w-3xl text-4xl font-extrabold sm:text-5xl">
            Moments that make a school year
          </h1>
          <p className="mt-4 max-w-2xl text-primary-foreground/85">
            Assemblies, annual days, science fairs, sports meets and the quiet everyday
            joy in between — browse albums from life at {settings.schoolName}.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-12 lg:px-8 lg:py-16" aria-labelledby="albums-heading">
        <h2 id="albums-heading" className="sr-only">
          Photo albums
        </h2>
        {albums.length === 0 ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {['Annual Day', 'Sports Meet', 'Science Fair', 'Cultural Fest', 'Classroom Moments', 'Trips & Excursions'].map(
              (label) => (
                <div
                  key={label}
                  className="flex h-48 flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-border bg-card p-6 text-center"
                >
                  <ImageIcon className="h-8 w-8 text-muted-foreground/50" aria-hidden="true" />
                  <p className="font-medium text-foreground">{label}</p>
                  <p className="text-xs text-muted-foreground">Album placeholder — photos coming soon</p>
                </div>
              ),
            )}
            <p className="col-span-full mt-4 flex items-center justify-center gap-2 text-center text-sm text-muted-foreground">
              <Info className="h-4 w-4 shrink-0" aria-hidden="true" />
              Albums published from the Admin Dashboard will appear here automatically.
            </p>
          </div>
        ) : (
          <ul className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {albums.map((album) => {
              const coverUrl = album.coverImageId ? (coverMap.get(album.coverImageId) ?? null) : null;
              return (
                <li key={album.id}>
                  <Link
                    href={`/gallery?slug=${album.slug}`}
                    className="group block overflow-hidden rounded-2xl border bg-card sp-card-shadow transition-all hover:-translate-y-1 hover:shadow-lg focus-visible:outline-2 focus-visible:outline-ring"
                  >
                    <div
                      className="relative flex h-52 items-center justify-center sp-hero-gradient"
                      role={coverUrl ? 'img' : undefined}
                      aria-label={coverUrl ? `Cover of album ${album.title}` : undefined}
                      style={coverUrl ? { backgroundImage: `url(${coverUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' } : undefined}
                    >
                      {!coverUrl && <ImageIcon className="h-12 w-12 text-white/40" aria-hidden="true" />}
                      <Badge className="absolute right-3 top-3 bg-black/40 text-xs font-semibold text-white backdrop-blur">
                        {album._count.items} {album._count.items === 1 ? 'photo' : 'photos'}
                      </Badge>
                    </div>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg text-primary group-hover:underline">{album.title}</CardTitle>
                      {album.description && (
                        <CardDescription className="line-clamp-2">{album.description}</CardDescription>
                      )}
                    </CardHeader>
                    <CardContent className="pt-0">
                      <p className="text-xs text-muted-foreground">
                        Updated {fmtDate(album.updatedAt)} · View album
                      </p>
                    </CardContent>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </>
  );
}
