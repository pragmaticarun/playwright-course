import { test, expect } from "@playwright/test";

test("GET /api/packages returns the six pins @cross", async ({ request }) => {
  const response = await request.get("/api/packages");
  expect(response.ok()).toBeTruthy();
  const body = await response.json();
  expect(body.packages.map((item: { id: string }) => item.id)).toEqual([
    "build-essential",
    "cmake",
    "rustc",
    "cargo",
    "adb",
    "scrcpy",
  ]);
});

test("POST /api/packages validates and does not persist @cross", async ({ request }) => {
  const missing = await request.post("/api/packages", { data: {} });
  expect(missing.status()).toBe(400);

  const created = await request.post("/api/packages", {
    data: { name: "ninja", version: "bench-1" },
  });
  expect(created.status()).toBe(201);
  expect(await created.json()).toEqual({
    name: "ninja",
    version: "bench-1",
    persisted: false,
  });

  const again = await request.get("/api/packages");
  const body = await again.json();
  expect(body.packages).toHaveLength(6);
});
