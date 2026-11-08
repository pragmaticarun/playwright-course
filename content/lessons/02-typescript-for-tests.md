---
number: 2
slug: typescript-for-tests
title: TypeScript the test file actually needs
module: Prerequisites
minutes: 35
summary: Types that document fixtures and page objects, and the 1.65 class-field rule that will break a careless page object.
source: TypeScript everyday types | https://www.typescriptlang.org/docs/handbook/2/everyday-types.html
source: TypeScript classes | https://www.typescriptlang.org/docs/handbook/2/classes.html
source: Playwright 1.65 release notes | https://playwright.dev/docs/release-notes
---

## Intuition

TypeScript is a checker laid over JavaScript. Playwright strips the types when it runs the test. If the checker is quiet and the button name is wrong, the test still fails at runtime. Types are for you and for the next edit, not for the browser.

The types you need in week one are small.

A parameter can name a type: `function pin(id: string, qty: number)`. A return type is optional and worth writing on helpers you export. Union types say "one of these": `kind: "cpp" | "rust" | "android"`. That is an enum without the runtime object. Optional fields use `?`: `note?: string` means the property may be missing, which is `undefined`.

`interface` and `type` both name a shape. This course uses `type` for unions and `interface` only when a class implements a contract. You will not need declaration merging.

Generics show up as `Locator` and as `Promise<T>`. You rarely write a generic yourself. You do read them. `Promise<void>` is a future that carries no value. `page.goto` returns one. You `await` it. The next lesson is about why.

`import type { Page, Locator } from "@playwright/test"` imports types that disappear from the output. Use it when a file only mentions those names in type positions. A value import is required for `test` and `expect`, because those exist at runtime.

## The class-field change in 1.65

Playwright 1.65 follows TypeScript's `useDefineForClassFields`. When `tsconfig` targets ES2022 or leaves `target` unset, field initializers run before constructor parameter properties are assigned. This page object throws:

```ts
class LoginPage {
  readonly submit = this.page.getByRole("button", { name: "Unlock notes" });
  constructor(private readonly page: Page) {}
}
```

`this.page` is still unset when `submit` is initialized. The failure is `Cannot read properties of undefined (reading 'getByRole')`. It is not a Playwright bug. It is the same order Rust would complain about if you used a field before the constructor finished, except JavaScript finds out at runtime.

Initialize locators in the constructor body. The capstone page objects in `projects/capstone/pages.ts` do it this way on purpose. Setting `"useDefineForClassFields": false` also restores the old order, but new code should not depend on that switch. Playwright's own note is in the 1.65 release notes.

## Worked example

```ts
import type { Locator, Page } from "@playwright/test";

export class CatalogPage {
  readonly page: Page;
  readonly heading: Locator;

  constructor(page: Page) {
    this.page = page;
    this.heading = page.getByRole("heading", { level: 1, name: "Workshop Bench" });
  }
}
```

`readonly` is a type-level promise that your file will not reassign the field. It does not freeze the locator. Locators are queries, re-run later. `readonly` will not stop a click.

Narrow a union before you use a field that only one side has. If a helper returns `string | undefined`, check it:

```ts
function orderId(name: string | undefined) {
  if (!name) return "BN-GUEST";
  return `BN-${name.toUpperCase()}`;
}
```

After the `if`, TypeScript treats `name` as `string`. That control-flow narrowing is the feature you will use most.

:::callout warn
Do not silence the checker with `any`
`any` turns the file back into untyped JavaScript at that expression. `unknown` is the honest "I do not know yet" type: you must narrow it before reading fields. API JSON from `response.json()` is often `any` in loose tests. Give it a type, or read fields and assert them one by one with `expect`.
:::

## A tsconfig that matches the runner

The course repo typechecks tests with the Next.js `tsconfig`. Its `target` is ES2017, so the dangerous class-field order is not the default here. Your own Ubuntu project may target ES2022, and then the broken page object throws. Write the constructor form anyway. Then both configs run.

Playwright 1.65 also stopped testing the runner on Node.js 20. Use Node 22, 24, or 26. This environment is Node 22, which is inside that list. Check `node -v` before you blame a test.

:::exercise
### Repair the page object

Rewrite the throwing `LoginPage` so `submit` is assigned after `page` exists. Keep the locator on the "Unlock notes" button.

:::hint
Declare `readonly page: Page` and `readonly submit: Locator` without initializers. Assign both inside `constructor(page: Page)`.
:::

:::solution
```ts
import type { Locator, Page } from "@playwright/test";

export class LoginPage {
  readonly page: Page;
  readonly submit: Locator;

  constructor(page: Page) {
    this.page = page;
    this.submit = page.getByRole("button", { name: "Unlock notes" });
  }
}
```
:::
:::

:::exercise
### Narrow the pin

`function firstPin(ids: string[]): string | undefined` returns `ids[0]`. Call it and append `":1"` only when a pin exists. What do you write so TypeScript accepts the concatenation?

:::hint
`ids[0]` is `undefined` when the array is empty. Check the result before using it as a string.
:::

:::solution
```ts
const id = firstPin(["rustc"]);
const item = id ? `${id}:1` : "";
```
The ternary narrows `id` to `string` on the left branch.
:::
:::

:::quiz
Playwright 1.65 runs class field initializers in which order when `useDefineForClassFields` is on?
- After the constructor body, like an older TypeScript default
+ Before constructor parameter properties are assigned
- After the first `await` in the constructor
- Only when the file is plain JavaScript
The initializer `this.page.getByRole(...)` runs before `page` is stored. Move the call into the constructor body.
:::

:::quiz
What does `import type` keep out of the emitted JavaScript?
- The whole module, including `test`
- Only default exports
+ Type-only names such as `Page` and `Locator`
- Comments
`test` and `expect` are values. Import them with a normal import. Import `Page` with `import type` when you only mention it as a type.
:::

:::quiz
Which Node.js lines does Playwright 1.65 still test?
- 18 and 20
+ 22, 24, and 26
- 20 only
- Every even version from 16 up
The 1.65 release notes say Node.js 20 is no longer tested. Use a current 22, 24, or 26.
:::
