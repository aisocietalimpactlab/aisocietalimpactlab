# AI Societal Impact Lab

Plain HTML, CSS, and JavaScript. The files in this repository are the website: no dependencies, installation, or build step.

## Publish with Cloudflare Pages

Connect this repository to Cloudflare Pages and deploy the repository root as a static site, with no build command. Use `aisocietalimpactlab.com` as the custom domain. The site uses absolute canonical URLs for that domain and ordinary relative links between pages.

## Preview and edit

Open `index.html` in your browser. Links to the other pages work locally too.

- `index.html`: homepage and all five team biographies.
- `ourwork/index.html`: research index.
- `ourwork/<article>/index.html`: complete articles, references, and author biographies.
- `fellowship-autumn-2026/index.html`: fellowship information.
- `events/index.html`: events and contact information.
- `privacy-policy/index.html` and `terms-of-service/index.html`: website policies.
- `assets/styles.css`: shared design and responsive layouts.
- `assets/script.js`: mobile menu, research filters, biography dialogs, and copy-link buttons.
- `assets/images`, `assets/artwork`, `assets/fonts`: local assets. Keep the included font licences.

All content and navigation work without JavaScript. JavaScript adds the optional interactive features. Edit text directly in the HTML files; shared navigation and footer changes should be applied to each page.

The fellowship remains marked closed. The privacy and terms pages are drafts for review before deployment. Cloudflare Web Analytics is currently disabled. Confirm the Lab's legal data-controller identity, email provider and retention practice, and update the privacy notice if Cloudflare settings or other practices change.

If changing the domain, update the canonical and social URLs in the HTML files, the homepage link in `404.html`, and the URLs in `sitemap.xml` and `robots.txt`. Ordinary page and asset links are relative and require no changes.

## Homepage slides and announcement

The homepage fits the landing, publications, and team into viewport-height chapters on desktop. Wheel gestures animate between chapters. After leaving the landing screen, the fixed 64px header changes from lavender to grey; subsequent chapters align below it, while the team and footer scroll naturally underneath it. Smaller screens and enlarged content retain readable, natural scrolling; reduced-motion preferences disable the animated transitions.

The `.hero-banner-slot` in `index.html` contains both the lavender research fallback and the Fellowship announcement. Add the `hidden` attribute to `<section class="fellowship-strip">` to show the fallback; remove it to show the announcement in the same slot. Both variants share the same height, and the covered fallback is excluded from keyboard navigation.
