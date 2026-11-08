---
number: 1
slug: js-for-systems-programmers
title: JavaScript for systems programmers
module: Prerequisites
minutes: 35
summary: The values, objects, and modules a C++ or Rust programmer actually meets inside a Playwright test.
source: JavaScript Guide | https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide
source: JavaScript data types and data structures | https://developer.mozilla.org/en-US/docs/Web/JavaScript/Data_structures
source: Playwright installation | https://playwright.dev/docs/intro
---

## Intuition

A Playwright test file is ordinary JavaScript, or TypeScript that erases down to it. You do not need a frontend career to read it. You do need to stop mapping it onto C++ line by line, because several familiar words mean something else.

There is no separate compile step that checks the test before Node runs it. Playwright's runner transpiles TypeScript for you. A typo in a string is still a runtime miss, the same way a wrong `adb shell` argument is a runtime miss. The type checker catches the shape of `page` and `expect`. It does not catch a button name you invented.

Values are dynamically typed. `const name = "rustc"` does not freeze the type the way `const std::string` documents a type. `const` only freezes the binding. The object on the other end of a binding can still grow fields. That is closer to a `const` pointer than to a const object.

Objects are bags of properties, not structs with a fixed layout. `{ id: "rustc", qty: 1 }` is a dictionary. Missing fields are `undefined`, not a compile error, unless TypeScript is watching. Arrays are objects with magic indexes. They resize. They are not `std::vector` and they are not slices: there is no borrow checker, so two variables can point at the same array and both can push.

Equality will bite you. `===` compares values for primitives and identity for objects. `==` coerces and is not welcome in this course. `0 === false` is false. `"0" === 0` is false. Use `===` the way you use an explicit cast you meant.

Functions are values. You can pass `dialog.accept` around the way you pass a function pointer, except the call also carries a hidden `this`. If you detach a method and call it later, `this` may be undefined. Arrow functions capture `this` from the surrounding scope and do not have their own. In tests you will mostly write arrows: `async ({ page }) => { ... }`.

Modules are files. `import { test, expect } from "@playwright/test"` is a static import. It is not `#include`. The binding is live and read-only. Default exports exist; this course prefers named imports so the call site says what it pulled in.

## Worked example

The shelf in Workshop Bench is a JSON array in `localStorage`. This is the same shape you will assert on later, written as plain JavaScript.

```js
const shelf = [];
function add(id) {
  const found = shelf.find((item) => item.id === id);
  if (found) found.qty += 1;
  else shelf.push({ id, qty: 1 });
}
add("rustc");
add("rustc");
console.log(JSON.stringify(shelf));
```

`find` walks the array and returns the object or `undefined`. The `if (found)` test treats `undefined` as false. That is a truthiness check, not a null-pointer check with a type. `qty += 1` mutates the object already stored in the array. The second `add` does not push a second row. `JSON.stringify` is the serialization you would log from a test when a shelf assertion surprises you.

## What you can ignore for now

Classes, prototypes, and `this` games matter later for page objects. Generators, proxies, and decorators do not matter for this course. You will not hand-write a bundler. The test runner loads the file.

:::callout compare
Rust ownership versus JavaScript aliases
A JavaScript object has no single owner. Two names, two array slots, and a field on another object can all reach it. When a test shares a mutable fixture across cases, you get the aliasing bugs Rust's borrow checker refuses to compile. Playwright's isolation, in a later lesson, is how you get a fresh heap per test without a borrow checker.
:::

## Try this on the lab

Open `practice-app/assets/catalog.js` and find `readShelf`. It parses JSON and, if the parse throws or the value is not an array, returns `[]`. That `try/catch` is the JavaScript version of "do not trust the bytes on disk." `localStorage` belongs to the origin, which for the lab is `http://127.0.0.1:4471`. A second browser context does not see it. That fact becomes a test in the isolation lesson.

:::exercise
### Predict the shelf

Walk `add` by hand for the calls `add("adb")`, `add("cmake")`, `add("adb")`. Write the JSON you expect, then run the snippet with `node`.

:::hint
`find` returns the existing object. The increment hits `qty` on that object. The array length stays 2.
:::

:::solution
```json
[{"id":"adb","qty":2},{"id":"cmake","qty":1}]
```
:::
:::

:::exercise
### Spot the coercion

What does `"5" + 1` produce, and what does `"5" - 1` produce? Why is that a terrible foundation for an assertion?

:::hint
`+` concatenates if either side is a string. `-` coerces to numbers. `expect` comparisons in Playwright are not this operator, but your own helper functions might be.
:::

:::solution
`"5" + 1` is `"51"`. `"5" - 1` is `4`. An assertion written with `+` can pass while the number you meant never existed. Prefer `Number("5") + 1` or, in a test, `expect(value).toBe(6)`.
:::
:::

:::quiz
Which binding does `const` protect?
- The fields inside the object it points at
- The memory layout of the object
+ The name, so you cannot reassign that name
- The type of the value, the way a C++ const reference does
`const` stops a second assignment to the binding. The object's properties stay mutable.
:::

:::quiz
What does `===` do when both sides are objects?
- Deep-compares every field
- Compares JSON text
+ Compares identity: they are the same object
- Compares the constructor name
Two different `{ id: "rustc" }` objects are not `===`, even when every field matches. Use a field comparison or Playwright's `toEqual` on JSON from an API.
:::

:::quiz
A static `import` of `@playwright/test` is closest to which idea?
- A textual `#include` that pastes the file into yours
- A dynamic `dlopen` you must call yourself
+ A module binding resolved before the file runs
- A Rust crate feature flag
The runner loads the module graph, then runs the test. You do not call the loader yourself inside the test.
:::
