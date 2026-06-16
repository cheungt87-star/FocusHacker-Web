import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");
const SITE = "https://focushacker.app";
const OG_IMAGE = `${SITE}/logo.png`;

function nav() {
  return `  <div class="nav-wrap">
    <nav class="nav" id="nav" aria-label="Primary">
      <a href="/" class="nav-logo">
        <span class="logo-mark">
          <img src="/logo.png?v=2" srcset="/logo.png?v=2 1x, /logo@2x.png?v=2 2x" alt="" width="28" height="28" decoding="async" />
        </span>
        FocusHacker
      </a>
      <div class="nav-links" id="navLinks">
        <a href="/">Home</a>
        <a href="/#how">How It Works</a>
        <a href="/blog/">Blog</a>
        <a href="/#faq">Help &amp; Support</a>
      </div>
      <div class="nav-actions">
        <button type="button" class="nav-menu-btn" id="navMenuBtn" aria-expanded="false" aria-controls="navLinks" aria-label="Open menu">
          <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>
        </button>
        <div class="right">
          <button class="btn btn-primary" type="button"><span class="btn-label-long">Start your 7-day free trial</span><span class="btn-label-short">Free trial</span></button>
        </div>
      </div>
    </nav>
  </div>`;
}

function footer() {
  return `  <footer class="footer">
    <div class="wrap">
      <div class="footer-grid">
        <div class="footer-brand">
          <div class="logo-row">
            <span class="logo-mark">
              <img src="/logo.png?v=2" srcset="/logo.png?v=2 1x, /logo@2x.png?v=2 2x" alt="" width="28" height="28" decoding="async" />
            </span>
            FocusHacker
          </div>
          <p class="tag">Build your unbreakable focus streak.</p>
        </div>
        <div class="footer-col">
          <h4>Product</h4>
          <ul>
            <li><a href="/#how">How It Works</a></li>
            <li><a href="/#how">Features overview</a></li>
            <li><a href="/#pricing">Pricing</a></li>
            <li><a href="/?waitlist=1">Download on Mac App Store</a></li>
          </ul>
        </div>
        <div class="footer-col">
          <h4>Company</h4>
          <ul>
            <li><a href="/blog/">Blog</a></li>
            <li><a href="/#faq">Help &amp; Support</a></li>
            <li><a href="mailto:focushackapp@gmail.com">Contact</a></li>
            <li><a href="/">About</a></li>
          </ul>
        </div>
        <div class="footer-col">
          <h4>Legal &amp; Trust</h4>
          <ul>
            <li><a href="/privacy-policy">Privacy Policy</a></li>
            <li><a href="/terms-of-service">Terms of Service</a></li>
            <li><a href="/privacy-policy#local-data">All data stays local</a></li>
          </ul>
        </div>
      </div>
      <div class="footer-bottom">
        <span>© 2026 FocusHacker · Built natively for Mac</span>
        <div class="links">
          <span>macOS app</span>
          <span style="opacity:.4">·</span>
          <span>All data local</span>
        </div>
      </div>
    </div>
  </footer>`;
}

function headMeta({ title, description, url, datePublished, headline }) {
  const jsonLd = JSON.stringify(
    {
      "@context": "https://schema.org",
      "@type": "BlogPosting",
      headline,
      description,
      datePublished,
      author: { "@type": "Organization", name: "FocusHacker" },
      publisher: { "@type": "Organization", name: "FocusHacker" },
      mainEntityOfPage: { "@type": "WebPage", "@id": url },
    },
    null,
    2
  );

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
  <title>${title}</title>
  <meta name="description" content="${description}" />
  <link rel="icon" href="/favicon.png?v=2" type="image/png" sizes="32x32" />
  <link rel="apple-touch-icon" href="/apple-touch-icon.png?v=2" sizes="180x180" />
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500&family=Space+Grotesk:wght@500;600;700&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="/styles-v3.css" />
  <meta property="og:title" content="${headline}" />
  <meta property="og:description" content="${description}" />
  <meta property="og:type" content="article" />
  <meta property="og:url" content="${url}" />
  <meta property="og:image" content="${OG_IMAGE}" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${headline}" />
  <meta name="twitter:description" content="${description}" />
  <meta name="twitter:image" content="${OG_IMAGE}" />
  <script type="application/ld+json">
${jsonLd}
  </script>
</head>
<body>`;
}

function fixBody(html, slug) {
  let out = html.replace(/(?<![\w*])\*([^*\n]+)\*(?!\*)/g, "<em>$1</em>");
  if (slug === "best-focus-tools-mac") {
    out = out
      .replace(
        '<a href="/">Why Multiple Focus Tools Don\'t Work</a>',
        '<a href="/blog/why-focus-systems-matter">Why Multiple Focus Tools Don\'t Work</a>'
      )
      .replace(
        '<a href="/">Focus Apps vs. Focus Systems</a>',
        '<a href="/blog/focus-apps-vs-systems">Focus Apps vs. Focus Systems</a>'
      );
  }
  return out;
}

function articlePage(article) {
  const body = fixBody(
    readFileSync(resolve(root, `blog/_${article.slug}-body.html`), "utf8"),
    article.slug
  );
  const url = `${SITE}/blog/${article.slug}`;
  return `${headMeta({
    title: `${article.headline} | FocusHacker`,
    description: article.description,
    url,
    datePublished: article.datePublished,
    headline: article.headline,
  })}
${nav()}

  <main>
    <article class="blog-post">
      <h1>${article.headline}</h1>
      <p class="meta">${article.dateDisplay} • ${article.readTime}</p>
${body}
    </article>
    <div class="cta-box">
      <p>Ready to build a focus habit? Try FocusHacker free for 7 days.</p>
      <a class="btn" href="/">Start your free trial</a>
    </div>
  </main>

${footer()}

  <script type="module" src="/src/main.js"></script>
</body>
</html>
`;
}

const READ_ARROW = `<svg width="12" height="12" viewBox="0 0 12 12" fill="none" class="arr" aria-hidden="true"><path d="M3 6h6m0 0L6 3m3 3L6 9" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

function postCard(article) {
  const href = `/blog/${article.slug}`;
  return `      <article class="post-card reveal">
        <h2><a href="${href}">${article.headline}</a></h2>
        <p class="post-meta">${article.dateDisplay} · ${article.readTime}</p>
        <p class="post-excerpt">${article.description}</p>
        <a class="post-link" href="${href}">Read article ${READ_ARROW}</a>
      </article>`;
}

function blogIndexPage() {
  const cards = articles.map(postCard).join("\n\n");
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
  <title>Blog | FocusHacker</title>
  <meta name="description" content="Focus systems, productivity psychology, and Mac focus tool guides from FocusHacker." />
  <link rel="icon" href="/favicon.png?v=2" type="image/png" sizes="32x32" />
  <link rel="apple-touch-icon" href="/apple-touch-icon.png?v=2" sizes="180x180" />
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500&family=Space+Grotesk:wght@500;600;700&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="/styles-v3.css" />
  <meta property="og:title" content="FocusHacker Blog" />
  <meta property="og:description" content="Focus systems, productivity psychology, and Mac focus tool guides from FocusHacker." />
  <meta property="og:type" content="website" />
  <meta property="og:url" content="${SITE}/blog" />
  <meta property="og:image" content="${OG_IMAGE}" />
</head>
<body>
${nav()}

  <header class="blog-hero hero tuck">
    <div class="wrap hero-inner">
      <div class="hero-content reveal">
        <h1>Focus <em>systems</em> &amp; Mac guides</h1>
        <p class="hero-sub">Guides on focus systems, habit building, and choosing the right tools for Mac.</p>
        <div class="hero-cta-row">
          <a class="btn btn-ghost btn-lg" href="/#how">See how FocusHacker works</a>
        </div>
      </div>
    </div>
  </header>

  <section class="blog-list tuck" aria-label="Articles">
    <div class="wrap">
      <div class="blog-grid">
${cards}
      </div>
    </div>
  </section>

  <section class="blog-cta tuck">
    <div class="wrap">
      <div class="blog-cta__inner reveal">
        <h2>Build your focus <em>system</em></h2>
        <p>Block distractions, run guided sessions, and track streaks—all in one native Mac app.</p>
        <button class="btn btn-primary btn-lg" type="button">
          Start your 7-day free trial
          ${READ_ARROW}
        </button>
      </div>
    </div>
  </section>

${footer()}

  <script type="module" src="/src/main.js"></script>
</body>
</html>`;
}

const articles = [
  {
    slug: "why-focus-systems-matter",
    headline: "You Don't Need Better Tools. You Need a Better System.",
    description:
      "The problem with focus tools isn't the tools. It's that they work in isolation. Learn why systems beat tools.",
    datePublished: "2026-06-15",
    dateDisplay: "June 15, 2026",
    readTime: "7 min read",
  },
  {
    slug: "focus-apps-vs-systems",
    headline: "Focus Apps vs. Focus Systems: Which One Actually Works?",
    description:
      "Understand the difference between a focus app and a focus system. Learn why one builds better habits.",
    datePublished: "2026-06-16",
    dateDisplay: "June 16, 2026",
    readTime: "7 min read",
  },
  {
    slug: "best-focus-tools-mac",
    headline:
      "The Best Focus Tools for Mac in 2026: Systems vs. Single-Purpose Apps",
    description:
      "We tested the top focus tools for Mac. Here's which ones are systems, which are single apps—and which one actually wins.",
    datePublished: "2026-06-17",
    dateDisplay: "June 17, 2026",
    readTime: "6 min read",
  },
];

writeFileSync(resolve(root, "blog/index.html"), blogIndexPage(), "utf8");
console.log("Wrote blog/index.html");

for (const a of articles) {
  const bodyPath = resolve(root, `blog/_${a.slug}-body.html`);
  if (!existsSync(bodyPath)) {
    console.warn("Skip blog/" + a.slug + ".html (missing " + bodyPath + ")");
    continue;
  }
  writeFileSync(resolve(root, `blog/${a.slug}.html`), articlePage(a), "utf8");
  console.log("Wrote blog/" + a.slug + ".html");
}
