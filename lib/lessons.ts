import fs from "node:fs";
import path from "node:path";

export type Source = { title: string; url: string };

export type Quiz = {
  id: string;
  question: string;
  choices: string[];
  answer: number;
  explanation: string;
};

export type Exercise = {
  title: string;
  prompt: string;
  hint: string;
  solution: string;
};

export type Callout = {
  tone: "note" | "warn" | "compare";
  title: string;
  body: string;
};

export type Block =
  | { type: "markdown"; text: string }
  | { type: "callout"; callout: Callout }
  | { type: "exercise"; exercise: Exercise }
  | { type: "quiz"; quiz: Quiz };

export type Lesson = {
  number: number;
  slug: string;
  title: string;
  module: string;
  minutes: number;
  summary: string;
  sources: Source[];
  blocks: Block[];
  quizzes: Quiz[];
};

const LESSON_DIR = path.join(process.cwd(), "content", "lessons");

function splitFrontmatter(raw: string) {
  const normalized = raw.replace(/\r\n/g, "\n");
  if (!normalized.startsWith("---\n")) {
    throw new Error("Lesson is missing frontmatter");
  }
  const end = normalized.indexOf("\n---\n", 4);
  if (end < 0) throw new Error("Lesson frontmatter is not closed");
  return {
    header: normalized.slice(4, end),
    body: normalized.slice(end + 5),
  };
}

function parseHeader(header: string, file: string) {
  const sources: Source[] = [];
  const fields: Record<string, string> = {};
  for (const line of header.split("\n")) {
    if (!line.trim()) continue;
    const splitAt = line.indexOf(": ");
    if (splitAt < 0) throw new Error(`${file} has a bad frontmatter line: ${line}`);
    const key = line.slice(0, splitAt).trim();
    const value = line.slice(splitAt + 2).trim();
    if (key === "source") {
      const bar = value.indexOf(" | ");
      if (bar < 0) throw new Error(`${file} source must be "Title | https://..."`);
      sources.push({ title: value.slice(0, bar), url: value.slice(bar + 3) });
    } else {
      fields[key] = value;
    }
  }
  for (const key of ["number", "slug", "title", "module", "minutes", "summary"]) {
    if (!fields[key]) throw new Error(`${file} is missing ${key}`);
  }
  return {
    number: Number(fields.number),
    slug: fields.slug,
    title: fields.title,
    module: fields.module,
    minutes: Number(fields.minutes),
    summary: fields.summary,
    sources,
  };
}

function readUntilClose(lines: string[], start: number) {
  let depth = 1;
  const collected: string[] = [];
  let index = start;
  while (index < lines.length) {
    const line = lines[index];
    if (line.startsWith(":::")) {
      if (line.trim() === ":::") {
        depth -= 1;
        if (depth === 0) return { text: collected.join("\n").trim(), next: index + 1 };
      } else {
        depth += 1;
      }
    }
    collected.push(line);
    index += 1;
  }
  throw new Error("Unclosed lesson block");
}

function sliceBlock(text: string, name: string) {
  const opener = `:::${name}`;
  const start = text.indexOf(opener);
  if (start < 0) return { inner: "", rest: text };
  const after = text.slice(start + opener.length).replace(/^\n/, "");
  const lines = after.split("\n");
  let depth = 1;
  const collected: string[] = [];
  let consumed = 0;
  for (const line of lines) {
    consumed += line.length + 1;
    if (line.startsWith(":::")) {
      if (line.trim() === ":::") {
        depth -= 1;
        if (depth === 0) break;
      } else depth += 1;
    }
    collected.push(line);
  }
  const inner = collected.join("\n").trim();
  const rest = (text.slice(0, start) + after.slice(consumed)).trim();
  return { inner, rest };
}

function parseExercise(text: string): Exercise {
  const titleLine = text.split("\n").find((line) => line.startsWith("### "));
  if (!titleLine) throw new Error("Exercise is missing a ### title");
  const hint = sliceBlock(text, "hint");
  const withSolution = sliceBlock(hint.rest, "solution");
  const prompt = withSolution.rest
    .split("\n")
    .filter((line) => line.trim() !== titleLine.trim())
    .join("\n")
    .trim();
  if (!hint.inner || !withSolution.inner) throw new Error(`Exercise "${titleLine}" needs a hint and a solution`);
  return {
    title: titleLine.slice(4).trim(),
    prompt,
    hint: hint.inner,
    solution: withSolution.inner,
  };
}

function parseQuiz(text: string, id: string): Quiz {
  const lines = text.split("\n").filter((line) => line.trim());
  const choiceStart = lines.findIndex((line) => /^[+-] /.test(line));
  if (choiceStart < 0) throw new Error(`Quiz ${id} has no choices`);
  const question = lines.slice(0, choiceStart).join(" ").trim();
  const choices: string[] = [];
  let answer = -1;
  let index = choiceStart;
  for (; index < lines.length; index += 1) {
    if (!/^[+-] /.test(lines[index])) break;
    if (lines[index].startsWith("+ ")) {
      if (answer !== -1) throw new Error(`Quiz ${id} has two correct choices`);
      answer = choices.length;
    }
    choices.push(lines[index].slice(2).trim());
  }
  if (answer < 0) throw new Error(`Quiz ${id} has no correct choice`);
  if (choices.length < 2) throw new Error(`Quiz ${id} needs at least two choices`);
  const explanation = lines.slice(index).join(" ").trim();
  if (!explanation) throw new Error(`Quiz ${id} is missing an explanation`);
  return { id, question, choices, answer, explanation };
}

function parseBody(body: string, slug: string): Block[] {
  const lines = body.split("\n");
  const blocks: Block[] = [];
  const buffer: string[] = [];
  let quizCount = 0;

  const flush = () => {
    const text = buffer.join("\n").trim();
    buffer.length = 0;
    if (text) blocks.push({ type: "markdown", text });
  };

  let index = 0;
  while (index < lines.length) {
    const line = lines[index];
    if (line.startsWith(":::callout ")) {
      flush();
      const tone = line.slice(":::callout ".length).trim() as Callout["tone"];
      const region = readUntilClose(lines, index + 1);
      const [title, ...rest] = region.text.split("\n");
      blocks.push({
        type: "callout",
        callout: { tone, title: title.trim(), body: rest.join("\n").trim() },
      });
      index = region.next;
      continue;
    }
    if (line.trim() === ":::exercise") {
      flush();
      const region = readUntilClose(lines, index + 1);
      blocks.push({ type: "exercise", exercise: parseExercise(region.text) });
      index = region.next;
      continue;
    }
    if (line.trim() === ":::quiz") {
      flush();
      const region = readUntilClose(lines, index + 1);
      quizCount += 1;
      blocks.push({ type: "quiz", quiz: parseQuiz(region.text, `${slug}-q${quizCount}`) });
      index = region.next;
      continue;
    }
    buffer.push(line);
    index += 1;
  }
  flush();
  return blocks;
}

function loadFile(file: string): Lesson {
  const raw = fs.readFileSync(path.join(LESSON_DIR, file), "utf8");
  const { header, body } = splitFrontmatter(raw);
  const meta = parseHeader(header, file);
  const blocks = parseBody(body, meta.slug);
  const quizzes = blocks.flatMap((block) => (block.type === "quiz" ? [block.quiz] : []));
  return { ...meta, blocks, quizzes };
}

export function getLessons(): Lesson[] {
  if (!fs.existsSync(LESSON_DIR)) return [];
  return fs
    .readdirSync(LESSON_DIR)
    .filter((file) => file.endsWith(".md"))
    .map(loadFile)
    .sort((a, b) => a.number - b.number);
}

export function getLesson(slug: string) {
  return getLessons().find((lesson) => lesson.slug === slug);
}

export function modulesOf(lessons: Lesson[]) {
  const modules: { name: string; lessons: Lesson[] }[] = [];
  for (const lesson of lessons) {
    const current = modules.at(-1);
    if (!current || current.name !== lesson.module) modules.push({ name: lesson.module, lessons: [lesson] });
    else current.lessons.push(lesson);
  }
  return modules;
}
