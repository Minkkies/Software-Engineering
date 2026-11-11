import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

function formatThaiDate(value) {
  if (!value) return "";
  return new Date(value).toLocaleDateString("th-TH", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

// bucket 'news-files' เป็น public (ดู 005_news_storage.sql)
function attachmentUrl(filePath) {
  const encoded = filePath.split("/").map(encodeURIComponent).join("/");
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/news-files/${encoded}`;
}

function formatSize(bytes) {
  if (!bytes) return "";
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

async function getNews(id) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  );

  const { data } = await supabase
    .from("news")
    .select(
      "id, title, summary, content, cover_url, publish_at, created_at, tags, news_categories(name), news_attachments(id, file_name, file_path, size_bytes, created_at)"
    )
    .eq("id", id)
    .eq("status", "published")
    .maybeSingle();

  return data;
}

export async function generateMetadata({ params }) {
  const { id } = await params;
  const news = await getNews(id);
  return { title: news ? `${news.title} | CS Info Portal` : "ไม่พบข่าว" };
}

export default async function NewsDetailPage({ params }) {
  const { id } = await params;
  const news = await getNews(id);
  if (!news) notFound();

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  );
  const { error: viewError } = await supabase.rpc("increment_news_views", {
    p_id: id,
  });
  if (viewError) console.error("นับยอดเข้าชมข่าวไม่สำเร็จ:", viewError.message);

  return (
    <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <Link
        href="/news"
        className="text-sm font-medium text-blue-800 hover:underline"
      >
        ← กลับไปหน้าข่าวทั้งหมด
      </Link>

      <article className="mt-6">
        {news.news_categories?.name && (
          <span className="rounded-full bg-blue-700 px-3 py-1 text-xs font-semibold text-white">
            {news.news_categories.name}
          </span>
        )}
        <h1 className="mt-4 text-3xl font-extrabold leading-snug text-slate-900">
          {news.title}
        </h1>
        <p className="mt-2 text-sm text-slate-400">
          {formatThaiDate(news.publish_at ?? news.created_at)}
        </p>

        {news.cover_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={news.cover_url}
            alt={news.title}
            className="mt-6 w-full rounded-2xl object-cover"
          />
        )}

        {news.summary && (
          <p className="mt-6 text-lg text-slate-600">{news.summary}</p>
        )}

        <div className="mt-6 whitespace-pre-line leading-relaxed text-slate-800">
          {news.content}
        </div>

        {news.news_attachments?.length > 0 && (
          <section className="mt-8">
            <h2 className="text-lg font-bold text-slate-900">เอกสารแนบ</h2>
            <ul className="mt-3 divide-y divide-slate-200 rounded-xl border border-slate-200 bg-white">
              {[...news.news_attachments]
                .sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
                .map((f) => (
                  <li key={f.id}>
                    <a
                      href={attachmentUrl(f.file_path)}
                      target="_blank"
                      rel="noopener noreferrer"
                      download={f.file_name}
                      className="flex items-center justify-between gap-4 px-4 py-3 text-sm transition hover:bg-slate-50"
                    >
                      <span className="truncate font-medium text-blue-800">
                        {f.file_name}
                      </span>
                      <span className="shrink-0 text-xs text-slate-400">
                        {formatSize(f.size_bytes)}
                      </span>
                    </a>
                  </li>
                ))}
            </ul>
          </section>
        )}

        {news.tags?.length > 0 && (
          <div className="mt-8 flex flex-wrap gap-2">
            {news.tags.map((t) => (
              <span
                key={t}
                className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-600"
              >
                #{t}
              </span>
            ))}
          </div>
        )}
      </article>
    </main>
  );
}
