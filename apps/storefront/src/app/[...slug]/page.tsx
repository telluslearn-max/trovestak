import { notFound } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { createSupabaseAdminClient } from "@/lib/supabase-admin";

interface PageProps {
  params: Promise<{ slug: string[] }>;
}

export async function generateStaticParams() {
  // generateStaticParams runs in a static context, use Admin client (no cookies)
  const supabase = createSupabaseAdminClient();
  const { data: pages } = await supabase
    .from("cms_pages")
    .select("slug")
    .eq("status", "published");

  return pages?.map((page: { slug: string }) => ({
    slug: page.slug.split("/"),
  })) || [];
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  const fullSlug = slug.join("/");
  const supabase = await createSupabaseServerClient();

  const { data: page } = await supabase
    .from("cms_pages")
    .select("title, meta_title, meta_description")
    .eq("slug", fullSlug)
    .eq("status", "published")
    .single();

  if (!page) return { title: "Page Not Found" };

  return {
    title: page.meta_title || page.title,
    description: page.meta_description,
  };
}

export default async function CMSPageRoute({ params }: PageProps) {
  const { slug } = await params;
  const fullSlug = slug.join("/");
  const supabase = await createSupabaseServerClient();

  const { data: page } = await supabase
    .from("cms_pages")
    .select("*")
    .eq("slug", fullSlug)
    .eq("status", "published")
    .single();

  if (!page) {
    notFound();
  }


  return (
    <>
      <div className="min-h-screen bg-background">
        <main className="max-w-4xl mx-auto px-6 py-24">
          <article className="prose prose-neutral dark:prose-invert max-w-none">
            <h1 className="text-4xl font-black tracking-tight mb-8">{page.title}</h1>
            <div
              dangerouslySetInnerHTML={{ __html: page.content || "" }}
              className="[&>p]:text-muted-foreground [&>h2]:text-2xl [&>h2]:font-black [&>h2]:mt-12 [&>h2]:mb-4 [&>h3]:text-xl [&>h3]:font-bold [&>h3]:mt-8 [&>h3]:mb-3 [&>ul]:my-6 [&>ol]:my-6 [&>blockquote]:border-l-4 [&>blockquote]:border-primary [&>blockquote]:pl-6 [&>blockquote]:italic [&>img]:rounded-2xl [&>img]:shadow-lg"
            />
          </article>
        </main>
      </div>
    </>
  );
}
