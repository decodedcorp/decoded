/**
 * JSON-LD structured data components for SEO
 */

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://decoded.style";

function JsonLdScript({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

/**
 * Organization + WebSite schema for the root layout
 */
export function JsonLdOrganization() {
  return (
    <JsonLdScript
      data={{
        "@context": "https://schema.org",
        "@graph": [
          {
            "@type": "Organization",
            "@id": `${SITE_URL}/#organization`,
            name: "Decoded",
            url: SITE_URL,
            description:
              "The style search engine — AI-powered item detection, editorial magazines, and virtual try-on.",
          },
          {
            "@type": "WebSite",
            "@id": `${SITE_URL}/#website`,
            url: SITE_URL,
            name: "Decoded",
            publisher: { "@id": `${SITE_URL}/#organization` },
            potentialAction: {
              "@type": "SearchAction",
              target: {
                "@type": "EntryPoint",
                urlTemplate: `${SITE_URL}/search?q={search_term_string}`,
              },
              "query-input": "required name=search_term_string",
            },
          },
        ],
      }}
    />
  );
}

/**
 * Article schema for individual post pages
 */
export function JsonLdArticle({
  title,
  description,
  imageUrl,
  publishedTime,
  url,
  artistName,
}: {
  title: string;
  description: string;
  imageUrl: string | null;
  publishedTime: string;
  url: string;
  artistName: string;
}) {
  return (
    <JsonLdScript
      data={{
        "@context": "https://schema.org",
        "@type": "Article",
        headline: title,
        description,
        ...(imageUrl ? { image: imageUrl } : {}),
        datePublished: publishedTime,
        url,
        author: {
          "@type": "Person",
          name: artistName,
        },
        publisher: {
          "@type": "Organization",
          name: "Decoded",
          url: SITE_URL,
        },
        mainEntityOfPage: {
          "@type": "WebPage",
          "@id": url,
        },
      }}
    />
  );
}

/**
 * BreadcrumbList schema
 */
export function JsonLdBreadcrumb({
  items,
}: {
  items: { name: string; url: string }[];
}) {
  return (
    <JsonLdScript
      data={{
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: items.map((item, i) => ({
          "@type": "ListItem",
          position: i + 1,
          name: item.name,
          item: item.url,
        })),
      }}
    />
  );
}
