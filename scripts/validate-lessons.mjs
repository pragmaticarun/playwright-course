import fs from "node:fs";
import path from "node:path";

const dir = path.join(process.cwd(), "content", "lessons");
const files = fs.readdirSync(dir).filter((file) => file.endsWith(".md")).sort();
const allowedHosts = new Set([
  "playwright.dev",
  "github.com",
  "www.npmjs.com",
  "developer.mozilla.org",
  "www.w3.org",
  "html.spec.whatwg.org",
  "www.typescriptlang.org",
  "www.rfc-editor.org",
  "nodejs.org",
  "modelcontextprotocol.io",
  "dequeuniversity.com",
]);

const errors = [];
const numbers = [];

function words(body) {
  const withoutFences = body.replace(/```[\s\S]*?```/g, " ");
  return withoutFences.split(/\s+/).filter(Boolean).length;
}

for (const file of files) {
  const raw = fs.readFileSync(path.join(dir, file), "utf8").replace(/\r\n/g, "\n");
  if (!raw.startsWith("---\n")) errors.push(`${file}: missing frontmatter`);
  const end = raw.indexOf("\n---\n");
  const header = raw.slice(4, end);
  const body = raw.slice(end + 5);
  const fields = {};
  const sources = [];
  for (const line of header.split("\n")) {
    if (!line.trim()) continue;
    const splitAt = line.indexOf(": ");
    if (splitAt < 0) {
      errors.push(`${file}: bad header line ${line}`);
      continue;
    }
    const key = line.slice(0, splitAt);
    const value = line.slice(splitAt + 2);
    if (key === "source") sources.push(value);
    else fields[key] = value;
  }
  for (const key of ["number", "slug", "title", "module", "minutes", "summary"]) {
    if (!fields[key]) errors.push(`${file}: missing ${key}`);
  }
  numbers.push(Number(fields.number));
  if (!file.includes(fields.slug)) errors.push(`${file}: slug ${fields.slug} is not in the filename`);
  if (sources.length < 2) errors.push(`${file}: need at least two sources`);
  for (const source of sources) {
    const url = source.split(" | ")[1];
    if (!url || !url.startsWith("https://")) {
      errors.push(`${file}: source is not https: ${source}`);
      continue;
    }
    const host = new URL(url).host;
    if (!allowedHosts.has(host)) errors.push(`${file}: host not in the primary-source list: ${host}`);
  }
  if (!body.includes("## Intuition")) errors.push(`${file}: missing Intuition`);
  if (!body.includes("## Worked example")) errors.push(`${file}: missing Worked example`);
  const exercises = body.split(":::exercise").length - 1;
  if (exercises < 2) errors.push(`${file}: need two exercises`);
  if (!body.includes(":::hint") || !body.includes(":::solution")) errors.push(`${file}: exercises need hints and solutions`);
  const quizzes = body.split(":::quiz").length - 1;
  if (quizzes < 3) errors.push(`${file}: need three quizzes`);
  const quizBodies = body.split(":::quiz").slice(1).map((part) => part.split(":::")[0]);
  quizBodies.forEach((quiz, index) => {
    const correct = quiz.split("\n").filter((line) => line.startsWith("+ ")).length;
    if (correct !== 1) errors.push(`${file}: quiz ${index + 1} has ${correct} correct choices`);
  });
  const count = words(body);
  if (count < 320) errors.push(`${file}: only ${count} words`);
}

const expected = files.map((_, index) => index + 1);
if (files.length < 30 || files.length > 40) errors.push(`lesson count ${files.length} is outside 30-40`);
if (numbers.join(",") !== expected.join(",")) errors.push(`lesson numbers are ${numbers.join(",")}`);

if (errors.length) {
  console.error(errors.join("\n"));
  process.exit(1);
}

console.log(`Validated ${files.length} lessons.`);
