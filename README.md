# Create Next.js Progressive Web App
The script for the `npx create-next-app-pwa` command. Making it easier for everyone to create a Next.js Progressive Web App using a simple command. This is made possible by the service worker made by [serwist](https://github.com/serwist/serwist) (see dependencies below).

## Installation
It's easy. Just run the following command in your terminal:
```bash
npx create-next-app-pwa [project-name]
```

This will follow the standard `create-next-app` command so this means that you will be asked a couple of questions like the following below.
```
✔ Would you like to use TypeScript? … No / Yes
```
After answering the questions, it will start the installation process. It's like installing a normal Next.js app.

> [!NOTE]
> The creator of this script suggests adding a `--skip` flag to the command. Because we already know what we want.

## Describing the Script

> [!IMPORTANT]
> The following information is only describing the script. <u>You don't need</u> to do them. This is just for transparency and accountabilty.

After initializing the Next.js app, the following files will be then added:
- `next.config.mjs` - The configuration file for the Next.js app to align with the Progressive Web App.
- `public/manifest.json` - The manifest file as a requirement for a Progressive Web App.
- `public/favicon.ico` - The favicon, likewise, a requirement for a Progressive Web App.

The script then edits the `layout.tsx` file and adds the manifest attribute to the `metadata` object.

## Dependencies
The script also installs [`@serwist/next`](https://www.npmjs.com/package/@serwist/next) and [`serwist`](https://www.npmjs.com/package/serwist) as dependencies. This is the service worker that enable your Next.js app to be a Progressive Web App.

## License
This project is licensed under the MIT License. See the LICENSE file for more details.