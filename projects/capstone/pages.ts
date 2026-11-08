import type { Locator, Page } from "@playwright/test";

export class CatalogPage {
  readonly page: Page;
  readonly heading: Locator;
  readonly status: Locator;

  constructor(page: Page) {
    this.page = page;
    this.heading = page.getByRole("heading", { level: 1, name: "Workshop Bench" });
    this.status = page.getByRole("status");
  }

  async open() {
    await this.page.goto("/");
  }

  async filter(name: "All" | "C++" | "Rust" | "Android") {
    await this.page.getByRole("button", { name, exact: true }).click();
  }

  async add(name: string) {
    await this.page.getByRole("button", { name: `Add ${name} to shelf` }).click();
    await this.status.filter({ hasText: `Added ${name} to the shelf` }).waitFor();
  }
}

export class ShelfPage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async open() {
    await this.page.goto("/shelf");
  }
}

export class CheckoutPage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async open() {
    await this.page.goto("/checkout");
  }

  async place(who: string, email: string, note: string) {
    await this.page.getByLabel("Your name").fill(who);
    await this.page.getByLabel("Email").fill(email);
    await this.page.getByLabel("Note").fill(note);
    await this.page.getByRole("checkbox", { name: "I am testing this local bench" }).check();
    await this.page.getByRole("button", { name: "Place bench order" }).click();
  }
}

export class NotesPage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async open() {
    await this.page.goto("/maintainer");
  }
}
