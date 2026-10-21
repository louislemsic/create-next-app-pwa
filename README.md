# Create Next.js Progressive Web App
The script for the `npx create-next-app-pwa` command. Making it easier for everyone to create a Next.js Progressive Web App using a simple command. This is made possible by the service worker made by [serwist](https://github.com/serwist/serwist) (see dependencies below).

## ⬇️ Installation
It's easy. Just run the following command in your terminal:
```bash
npx create-next-app-pwa [project-name]
```

This will follow the latest `create-next-app` command; so this means that you will be asked a couple of questions like the following below.
```
✔ Would you like to use TypeScript? … No / Yes
```
The experience should be the same in creating a Next.js app (just that this time, it's a PWA). Extra flags are forwarded to `create-next-app`.

```bash
npx create-next-app-pwa my-app --yes
npx create-next-app-pwa my-app --skip
```

`--skip` uses a TypeScript, Tailwind, `src/`, and App Router setup. Any other arguments are passed through to `create-next-app`.

## 📦 Describing the Script

It's a super straightforward process.

1. Run `npx create-next-app@latest`
2. Add serwist files like `sw.ts` that transforms the project into a PWA.
3. Add `public/manifest.json` (and other files) as it is needed for the browser to consider the project as a PWA
4. Modify `layout.tsx` to include the manifest.

That's basically it. As dumb as it gets.

## 🧱 Dependencies
The script installs [`@serwist/next`](https://www.npmjs.com/package/@serwist/next) and [`serwist`](https://www.npmjs.com/package/serwist) into the generated project, using the same package manager `create-next-app` just used. This is the service worker that enables your Next.js app to be a Progressive Web App.

## 🪪 License
This project is licensed under the MIT License. See the LICENSE file for more details.