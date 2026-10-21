#!/usr/bin/env node

import {
    getProjectName,
    updateLayoutMetadata,
    updateNextConfig,
    copyPublicFolder,
    updateHomePage,
    parseCliArgs,
    getCreateNextAppArgs,
    detectPackageManager,
    getPackageManagerAddArgs,
    runCommand,
    SERWIST_DEPENDENCY,
    SERWIST_DEV_DEPENDENCY,
} from "./src/functions.js";
import { fileURLToPath } from 'url';
import fs from 'fs';
import path from 'path';

const isNpx = process.argv[1]?.includes('create-next-app-pwa');

if (!isNpx) {
    console.log("This package is meant to be used with npx. Please use 'npx create-next-app-pwa' to create a new project.");
    process.exit(1);
}

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const { skip, projectName: requestedName, extraArgs } = parseCliArgs();

console.clear();
console.log('Creating a new Next.js app with PWA setup...');

const projectName = await getProjectName(requestedName);
const projectPath = path.join(process.cwd(), projectName);

try {
    if (skip) {
        console.log('Using preconfigured setup with TypeScript, Tailwind, src directory, and no ESLint...');
    } else {
        console.log('Running create-next-app with interactive prompts...');
    }

    runCommand('npx', getCreateNextAppArgs({ projectName, skip, extraArgs }));

    if (!fs.existsSync(projectPath)) {
        throw new Error(`Expected project directory "${projectName}" was not created.`);
    }

    updateNextConfig(projectPath);

    const packageManager = detectPackageManager(projectPath);
    console.log(`Installing @serwist/next and serwist with ${packageManager}...`);

    runCommand(
        packageManager,
        getPackageManagerAddArgs(packageManager, [SERWIST_DEPENDENCY]),
        { cwd: projectPath }
    );
    runCommand(
        packageManager,
        getPackageManagerAddArgs(packageManager, [SERWIST_DEV_DEPENDENCY], { dev: true }),
        { cwd: projectPath }
    );

    copyPublicFolder(projectPath, path.join(__dirname, 'src', 'public'));
    updateHomePage(projectPath, __dirname);

    fs.copyFileSync(
        path.join(__dirname, 'src', 'sw.ts'),
        path.join(projectPath, 'sw.ts')
    );

    updateLayoutMetadata(projectPath);
} catch (error) {
    console.error(`\nPWA setup failed: ${error.message}`);
    process.exit(error.status ?? 1);
}

console.log(`\nPWA setup complete! Your Next.js PWA is ready to go.`);
