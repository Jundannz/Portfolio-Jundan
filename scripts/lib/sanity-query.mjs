/* ==========================================================================
   Query publik ke Sanity (dipakai saat build).
   - Hanya dokumen published (perspective=published, draft dikecualikan).
   - Proyeksi hanya berisi field publik. Field internal (reviewNotes,
     dateIsPlaceholder, legacyId, dll.) TIDAK diambil sehingga tidak pernah
     masuk ke data/works.json yang dikirim ke browser.
   ========================================================================== */

export const API_VERSION = 'v2025-02-19';

export const PUBLIC_WORKS_QUERY = `*[_type == "work" && defined(slug.current) && !(_id in path("drafts.**")) && !(_id in path("versions.**"))]
| order(manualOrder asc, _id asc) {
  "id": _id,
  title,
  "slug": slug.current,
  category,
  description,
  tools,
  "thumbnail": select(defined(thumbnail.asset) => {
    "url": thumbnail.asset->url,
    "alt": thumbnail.alt,
    "hotspot": thumbnail.hotspot
  }),
  "detailImage": select(defined(detailImage.asset) => {
    "url": detailImage.asset->url,
    "alt": detailImage.alt
  }),
  mediaType,
  youtubeUrl,
  "videoUrl": coalesce(videoFile.asset->url, videoUrl),
  links[]{ label, url },
  workDate,
  "order": manualOrder,
  "featured": featured == true,
  "previousSlugs": previousSlugs
}`;

export function readSanityEnv(env = process.env) {
  return {
    projectId: (env.SANITY_PROJECT_ID || '').trim(),
    dataset: (env.SANITY_DATASET || 'production').trim(),
    // Opsional: hanya diperlukan bila dataset dibuat private. Jangan pernah
    // dikirim ke browser — token ini hanya dipakai di proses build.
    readToken: (env.SANITY_READ_TOKEN || '').trim()
  };
}

export async function fetchPublishedWorks({ projectId, dataset, readToken }, fetchImpl = fetch) {
  if (!/^[a-z0-9-]+$/.test(projectId)) {
    throw new Error('SANITY_PROJECT_ID belum diisi atau formatnya salah.');
  }
  if (!/^[a-z0-9_-]+$/i.test(dataset)) throw new Error('SANITY_DATASET formatnya salah.');

  // api.sanity.io (bukan CDN) agar build selalu mendapat data published terbaru
  const url = new URL(`https://${projectId}.api.sanity.io/${API_VERSION}/data/query/${dataset}`);
  url.searchParams.set('query', PUBLIC_WORKS_QUERY);
  url.searchParams.set('perspective', 'published');
  url.searchParams.set('returnQuery', 'false');
  url.searchParams.set('tag', 'portfolio-build');

  const headers = { Accept: 'application/json' };
  if (readToken) headers.Authorization = `Bearer ${readToken}`;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 30000);
  let res;
  try {
    res = await fetchImpl(url, { headers, signal: controller.signal });
  } catch (err) {
    throw new Error('Tidak bisa menghubungi Sanity: ' + err.message);
  } finally {
    clearTimeout(timer);
  }

  const text = await res.text();
  if (!res.ok) {
    throw new Error(`Sanity menolak query (HTTP ${res.status}): ${text.slice(0, 300)}`);
  }
  let body;
  try {
    body = JSON.parse(text);
  } catch {
    throw new Error('Respons Sanity bukan JSON yang valid.');
  }
  if (!Array.isArray(body.result)) throw new Error('Respons Sanity tidak berisi daftar karya.');
  return body.result;
}

