#!/usr/bin/env node

import { getProjectName, updateLayoutMetadata, updateNextConfig, copyPublicFolder, updateHomePage } from "./src/functions.js";
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

// Check if the script is run as part of npm install or npm i
const isNpx = process.argv[1].includes('create-next-app-pwa');

if (!isNpx) {
    console.log("This package is meant to be used with npx. Please use 'npx create-next-app-pwa' to create a new project.");
    process.exit(1);
}

const __dirname = path.dirname(fileURLToPath(import.meta.url));

console.clear();
console.log('Creating a new Next.js app with PWA setup...');

// Get the project name from the command line arguments
const projectName = await getProjectName();

// Check if --skip flag is provided
const skipFlag = process.argv.includes('--skip');

// Run the create-next-app command with or without predefined options
if (skipFlag) {
    console.log('Using preconfigured setup with TypeScript, Tailwind, src directory, and no ESLint...');
    execSync(`npx create-next-app@latest ${projectName} --ts --tailwind --src-dir --no-eslint --app --no-import-alias`, { stdio: 'inherit' });
} else {
    console.log('Running create-next-app with interactive prompts...');
    execSync(`npx create-next-app@latest ${projectName}`, { stdio: 'inherit' });
}

const projectPath = path.join(process.cwd(), projectName);

updateNextConfig(projectPath);

// Install @serwist/next and serwist as dependencies
console.log('Installing @serwist/next and serwist...');

execSync(`cd ${projectName} && npm install @serwist/next@latest`, { stdio: 'inherit' });
execSync(`cd ${projectName} && npm install -D serwist@latest`, { stdio: 'inherit' });

copyPublicFolder(projectPath, path.join(__dirname, 'src', 'public'));
updateHomePage(projectPath, __dirname);

// Copy `sw.ts` from src to the root of the new project
fs.copyFileSync(
    path.join(__dirname, 'src', 'sw.ts'),
    path.join(projectPath, 'sw.ts')
);

// Update the layout.tsx metadata
updateLayoutMetadata(projectPath);

console.log(`\nPWA setup complete! Your Next.js PWA is ready to go.`);