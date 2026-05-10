import * as cheerio from "cheerio";

export interface ParsedPage {
  url: string;
  title: string;
  description: string;
  content: string;
  sections: { heading: string; text: string }[];
  links: string[];
  wordCount: number;
}

export function parsePage(url: string, html: string): ParsedPage {
  const $ = cheerio.load(html);

  $("script, style, nav, footer, header, iframe, noscript").remove();

  const title =
    $("title").first().text().trim() ||
    $("h1").first().text().trim() ||
    url.split("/").pop()?.replace(/-/g, " ") ||
    "";

  const description =
    $('meta[name="description"]').attr("content")?.trim() ||
    $('meta[property="og:description"]').attr("content")?.trim() ||
    "";

  const sections: { heading: string; text: string }[] = [];
  $("h1, h2, h3").each((_, el) => {
    const heading = $(el).text().trim();
    let text = "";
    let next = $(el).next();
    while (next.length && !next.is("h1, h2, h3")) {
      text += next.text().trim() + " ";
      next = next.next();
    }
    if (heading) {
      sections.push({ heading, text: text.trim().slice(0, 1000) });
    }
  });

  const content = $("body").text().replace(/\s+/g, " ").trim().slice(0, 50000);

  const links: string[] = [];
  $("a[href]").each((_, el) => {
    const href = $(el).attr("href");
    if (href && href.startsWith("http") && !links.includes(href)) {
      links.push(href);
    }
  });

  return {
    url,
    title,
    description,
    content,
    sections,
    links,
    wordCount: content.split(/\s+/).length,
  };
}
