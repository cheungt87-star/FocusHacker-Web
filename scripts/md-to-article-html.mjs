import { readFileSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");

function inlineFormat(text) {
  return text.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
}

function isTableRow(line) {
  return line.trim().startsWith("|");
}

function parseTable(lines, start) {
  const rows = [];
  let i = start;
  while (i < lines.length && isTableRow(lines[i])) {
    const cells = lines[i]
      .trim()
      .replace(/^\|/, "")
      .replace(/\|$/, "")
      .split("|")
      .map((c) => c.trim());
    if (!cells.every((c) => /^[-:]+$/.test(c))) {
      rows.push(cells);
    }
    i++;
  }
  if (rows.length < 2) return { html: "", next: start };
  const [header, ...body] = rows;
  let html = "<table>\n<thead><tr>";
  for (const cell of header) {
    html += `<th>${inlineFormat(cell)}</th>`;
  }
  html += "</tr></thead>\n<tbody>\n";
  for (const row of body) {
    html += "<tr>";
    for (const cell of row) {
      html += `<td>${inlineFormat(cell)}</td>`;
    }
    html += "</tr>\n";
  }
  html += "</tbody>\n</table>";
  return { html, next: i };
}

function convert(md, { skipUntil = "## Introduction", stopAt = "## SEO Notes" } = {}) {
  let text = md;
  const introIdx = text.indexOf(skipUntil);
  if (introIdx >= 0) text = text.slice(introIdx);
  const stopIdx = text.indexOf(stopAt);
  if (stopIdx >= 0) text = text.slice(0, stopIdx);

  const lines = text.split("\n");
  const out = [];
  let i = 0;
  let inUl = false;
  let inOl = false;

  function closeLists() {
    if (inUl) {
      out.push("</ul>");
      inUl = false;
    }
    if (inOl) {
      out.push("</ol>");
      inOl = false;
    }
  }

  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    if (trimmed === "---") {
      i++;
      continue;
    }

    if (isTableRow(trimmed)) {
      closeLists();
      const { html, next } = parseTable(lines, i);
      out.push(html);
      i = next;
      continue;
    }

    if (trimmed.startsWith("### ")) {
      closeLists();
      out.push(`<h3>${inlineFormat(trimmed.slice(4))}</h3>`);
      i++;
      continue;
    }

    if (trimmed.startsWith("## ")) {
      closeLists();
      out.push(`<h2>${inlineFormat(trimmed.slice(3))}</h2>`);
      i++;
      continue;
    }

    if (/^\d+\.\s/.test(trimmed)) {
      if (inUl) {
        out.push("</ul>");
        inUl = false;
      }
      if (!inOl) {
        out.push("<ol>");
        inOl = true;
      }
      out.push(`<li>${inlineFormat(trimmed.replace(/^\d+\.\s/, ""))}</li>`);
      i++;
      continue;
    }

    if (trimmed.startsWith("- ")) {
      if (inOl) {
        out.push("</ol>");
        inOl = false;
      }
      if (!inUl) {
        out.push("<ul>");
        inUl = true;
      }
      let item = trimmed.slice(2);
      item = item.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');
      out.push(`<li>${inlineFormat(item)}</li>`);
      i++;
      continue;
    }

    if (trimmed === "") {
      closeLists();
      i++;
      continue;
    }

    closeLists();
    let para = trimmed;
    para = para.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');
    out.push(`<p>${inlineFormat(para)}</p>`);
    i++;
  }

  closeLists();
  return out.join("\n");
}

const files = [
  ["Blogs/MVP03_DRAFT_v3.md", "blog/_why-focus-systems-matter-body.html"],
  ["Blogs/MVP04_DRAFT_v2.md", "blog/_focus-apps-vs-systems-body.html"],
  ["Blogs/MVP05_DRAFT_v2.md", "blog/_best-focus-tools-mac-body.html"],
];

for (const [src, dest] of files) {
  const md = readFileSync(resolve(root, src), "utf8");
  const html = convert(md);
  writeFileSync(resolve(root, dest), html, "utf8");
  console.log("Wrote", dest);
}
