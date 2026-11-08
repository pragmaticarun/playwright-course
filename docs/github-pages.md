# GitHub Pages

This course is a static Next.js export. GitHub Pages can host the `out/` directory. This repository is prepared for that. A live URL is not claimed from this draft: publishing needs a GitHub repository you control, with Pages set to GitHub Actions.

## Workflow

`.github/workflows/pages.yml` runs on pushes to `main` and on manual dispatch.

1. `npm ci`
2. `npm run build` with `BASE_PATH` set from the repository name (empty for a user site, `/<repository>` otherwise)
3. Upload the `out` directory as a Pages artifact
4. Deploy with `actions/deploy-pages`

The test suite is a different workflow, `.github/workflows/playwright.yml`. A failing browser test does not block the docs deploy, and a docs failure does not hide a broken suite.

## Base path

Next.js inlines `basePath` at build time. `next.config.ts` reads `BASE_PATH`.

| Site kind | Repository | `BASE_PATH` | Public URL shape |
| --- | --- | --- | --- |
| Project site | `playwright-bench` | `/playwright-bench` | `https://<user>.github.io/playwright-bench/` |
| User site | `<user>.github.io` | empty | `https://<user>.github.io/` |

The workflow sets the base path from the repository name. A repository named `<user>.github.io` is built with an empty base path. Every other repository is built with `/<repository name>`. `next.config.ts` treats a base path of `/` as empty, which is how the workflow passes the user-site case through a GitHub Actions expression.

Local development leaves `BASE_PATH` unset, so the dev server stays at `/`.

## What you still do on GitHub

1. Create a repository you own. Do not point this at an unrelated existing repository.
2. Push this branch to that repository's default branch.
3. In the repository settings, set Pages to **GitHub Actions** as the source.
4. Run the "Deploy course to GitHub Pages" workflow, or push to `main`.
5. Open the URL the deploy job prints. That URL is the one to trust. Do not invent it before the job succeeds.

The lab server is not part of the static site. `Workshop Bench` runs on your machine with `npm run practice` or as the Playwright `webServer`. Pages hosts the reading material only.
