import hljs from "highlight.js/lib/core";
import bash from "highlight.js/lib/languages/bash";
import css from "highlight.js/lib/languages/css";
import json from "highlight.js/lib/languages/json";
import typescript from "highlight.js/lib/languages/typescript";
import xml from "highlight.js/lib/languages/xml";
import yaml from "highlight.js/lib/languages/yaml";
import type { ReactNode } from "react";
import { CopyButton } from "@/components/copy-button";

hljs.registerLanguage("bash", bash);
hljs.registerLanguage("css", css);
hljs.registerLanguage("json", json);
hljs.registerLanguage("typescript", typescript);
hljs.registerLanguage("xml", xml);
hljs.registerLanguage("yaml", yaml);
hljs.registerLanguage("javascript", typescript);
hljs.registerLanguage("js", typescript);
hljs.registerLanguage("ts", typescript);
hljs.registerLanguage("html", xml);
hljs.registerLanguage("sh", bash);
hljs.registerLanguage("yml", yaml);

const LANGS: Record<string, string> = {
  js: "typescript",
  javascript: "typescript",
  ts: "typescript",
  typescript: "typescript",
  bash: "bash",
  sh: "bash",
  shell: "bash",
  html: "xml",
  xml: "xml",
  css: "css",
  json: "json",
  yaml: "yaml",
  yml: "yaml",
};

function highlight(code: string, lang: string) {
  const mapped = LANGS[lang] || "";
  if (mapped && hljs.getLanguage(mapped)) {
    return hljs.highlight(code, { language: mapped }).value;
  }
  return hljs.highlight(code, { language: "typescript" }).value;
}

function renderInline(text: string, keyPrefix: string): ReactNode[] {
  const pattern = /(`[^`]+`)|(\*\*[^*]+\*\*)|(\[[^\]]+\]\([^)\s]+\))/g;
  const nodes: ReactNode[] = [];
  let last = 0;
  let match: RegExpExecArray | null;
  let part = 0;
  while ((match = pattern.exec(text))) {
    if (match.index > last) nodes.push(text.slice(last, match.index));
    const key = `${keyPrefix}-${part}`;
    part += 1;
    if (match[1]) nodes.push(<code key={key}>{match[1].slice(1, -1)}</code>);
    else if (match[2]) nodes.push(<strong key={key}>{match[2].slice(2, -2)}</strong>);
    else if (match[3]) {
      const linked = /\[([^\]]+)\]\(([^)\s]+)\)/.exec(match[3]);
      const href = linked?.[2] || "#";
      const external = href.startsWith("http");
      nodes.push(
        <a key={key} href={href} {...(external ? { target: "_blank", rel: "noreferrer" } : {})}>
          {linked?.[1]}
        </a>,
      );
    }
    last = match.index + match[0].length;
  }
  if (last < text.length) nodes.push(text.slice(last));
  return nodes;
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function createKeygen() {
  let key = 0;
  return () => {
    key += 1;
    return `md-${key}`;
  };
}

export function Markdown({ text }: { text: string }) {
  const lines = text.replace(/\r\n/g, "\n").split("\n");
  const blocks: ReactNode[] = [];
  let index = 0;
  const nextKey = createKeygen();

  while (index < lines.length) {
    const line = lines[index];
    if (!line.trim()) {
      index += 1;
      continue;
    }
    if (line.startsWith("```")) {
      const lang = line.slice(3).trim();
      const code: string[] = [];
      index += 1;
      while (index < lines.length && !lines[index].startsWith("```")) {
        code.push(lines[index]);
        index += 1;
      }
      index += 1;
      const source = code.join("\n");
      const html = highlight(source, lang);
      blocks.push(
        <figure key={nextKey()} className="code-figure">
          <figcaption>{lang || "text"}</figcaption>
          <div className="code-wrap">
            <CopyButton code={source} />
            <pre>
              <code className="hljs" dangerouslySetInnerHTML={{ __html: html }} />
            </pre>
          </div>
        </figure>,
      );
      continue;
    }
    if (line.startsWith("### ")) {
      const title = line.slice(4);
      blocks.push(<h3 key={nextKey()} id={slugify(title)}>{renderInline(title, nextKey())}</h3>);
      index += 1;
      continue;
    }
    if (line.startsWith("## ")) {
      const title = line.slice(3);
      blocks.push(<h2 key={nextKey()} id={slugify(title)}>{renderInline(title, nextKey())}</h2>);
      index += 1;
      continue;
    }
    if (line.startsWith("> ")) {
      const quote: string[] = [];
      while (index < lines.length && lines[index].startsWith("> ")) {
        quote.push(lines[index].slice(2));
        index += 1;
      }
      blocks.push(<blockquote key={nextKey()}>{renderInline(quote.join(" "), nextKey())}</blockquote>);
      continue;
    }
    if (line.startsWith("- ")) {
      const items: string[] = [];
      while (index < lines.length && lines[index].startsWith("- ")) {
        items.push(lines[index].slice(2));
        index += 1;
      }
      blocks.push(
        <ul key={nextKey()}>
          {items.map((item) => (
            <li key={item}>{renderInline(item, nextKey())}</li>
          ))}
        </ul>,
      );
      continue;
    }
    if (/^\d+\. /.test(line)) {
      const items: string[] = [];
      while (index < lines.length && /^\d+\. /.test(lines[index])) {
        items.push(lines[index].replace(/^\d+\. /, ""));
        index += 1;
      }
      blocks.push(
        <ol key={nextKey()}>
          {items.map((item) => (
            <li key={item}>{renderInline(item, nextKey())}</li>
          ))}
        </ol>,
      );
      continue;
    }
    const paragraph: string[] = [];
    while (index < lines.length && lines[index].trim() && !lines[index].startsWith("```") && !lines[index].startsWith("#") && !lines[index].startsWith("- ") && !lines[index].startsWith("> ") && !/^\d+\. /.test(lines[index])) {
      paragraph.push(lines[index]);
      index += 1;
    }
    blocks.push(<p key={nextKey()}>{renderInline(paragraph.join(" "), nextKey())}</p>);
  }

  return <div className="prose-bench">{blocks}</div>;
}
