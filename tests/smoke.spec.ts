import { test, expect } from "@playwright/test";

const paths = [
  "/",
  "/pkg/rustc",
  "/shelf",
  "/checkout",
  "/forms",
  "/upload",
  "/download",
  "/frames",
  "/dialogs",
  "/popup",
  "/login",
  "/status",
  "/delayed",
  "/inert",
  "/a11y",
  "/a11y/broken",
  "/visual",
  "/map",
  "/health",
];

for (const path of paths) {
  test(`GET ${path} is served @cross`, async ({ request }) => {
    const response = await request.get(path);
    expect(response.status(), path).toBeLessThan(400);
  });
}

test("unknown pin is a 404 @cross", async ({ request }) => {
  const response = await request.get("/pkg/not-a-tool");
  expect(response.status()).toBe(404);
});
