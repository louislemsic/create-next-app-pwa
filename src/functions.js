import readline from 'readline';
import { spawnSync } from 'child_process';
import fs from 'fs';
import path from 'path';

export const metadataTS = `
export const metadata: Metadata = {
    manifest: "/manifest.json",
    title: "Next.js PWA",
    description: "Welcome to the Next.js Progressive Web App!",
};
`;

export const metadataJS = `
const metadata = {
    manifest: "/manifest.json",
    title: "Next.js PWA",
    description: "Welcome to the Next.js Progressive Web App!",
};
`;

export const serwistImport = `import withSerwistInit from "@serwist/next";`;

export const serwistExport = `/**
 * This is the configuration for the Serwist service worker
 * that transforms the Next.js application into a PWA
 */
const withSerwist = withSerwistInit({
  swSrc: "sw.ts",
  swDest: "public/sw.js",
  disable: process.env.NODE_ENV !== "production",
});

export default withSerwist(nextConfig);`;

export const SERWIST_DEPENDENCY = '@serwist/next@^9';
export const SERWIST_DEV_DEPENDENCY = 'serwist@^9';
export const SKIP_FLAG = '--skip';
export const DEPLOY_NOW_ANCHOR = /<a\b[^>]*>(?:(?!<\/a>)[\s\S])*Deploy Now\s*<\/a>/;
export const NEXT_LOGO_SRC = /src=["']\/next\.svg["']/;

const PACKAGE_MANAGER_LOCKFILES = [
    ['bun.lock', 'bun'],
    ['bun.lockb', 'bun'],
    ['pnpm-lock.yaml', 'pnpm'],
    ['yarn.lock', 'yarn'],
    ['package-lock.json', 'npm'],
];

// Function to check if the project name is valid
export function isValidProjectName(name) {
    return /^[a-zA-Z0-9-_]+$/.test(name);
}

export function parseCliArgs(argv = process.argv) {
    const extraArgs = [];
    let skip = false;
    let projectName;

    for (const arg of argv.slice(2)) {
        if (arg === SKIP_FLAG) {
            skip = true;
            continue;
        }

        extraArgs.push(arg);
    }

    const nameIndex = extraArgs.findIndex((arg) => !arg.startsWith('-'));
    if (nameIndex !== -1) {
        projectName = extraArgs.splice(nameIndex, 1)[0];
    }

    return { skip, projectName, extraArgs };
}

export function getCreateNextAppArgs({ projectName, skip, extraArgs = [] }) {
    const args = ['create-next-app@latest', projectName];

    if (skip) {
        args.push('--ts', '--tailwind', '--src-dir', '--no-eslint', '--app', '--no-import-alias');
    }

    args.push(...extraArgs);
    return args;
}

export function detectPackageManager(projectPath) {
    for (const [fileName, packageManager] of PACKAGE_MANAGER_LOCKFILES) {
        if (fs.existsSync(path.join(projectPath, fileName))) {
            return packageManager;
        }
    }

    return 'npm';
}

export function getPackageManagerAddArgs(packageManager, packages, { dev = false } = {}) {
    switch (packageManager) {
        case 'npm':
            return ['install', ...(dev ? ['-D'] : []), ...packages];
        case 'yarn':
        case 'pnpm':
            return ['add', ...(dev ? ['-D'] : []), ...packages];
        case 'bun':
            return ['add', ...(dev ? ['-d'] : []), ...packages];
        default:
            throw new Error(`Unsupported package manager: ${packageManager}`);
    }
}

export function runCommand(command, args, options = {}) {
    const result = spawnSync(command, args, {
        stdio: 'inherit',
        ...options,
    });

    if (result.error) {
        throw result.error;
    }

    if (result.status !== 0) {
        const error = new Error(`Command failed (${result.status}): ${command} ${args.join(' ')}`);
        error.status = result.status ?? 1;
        throw error;
    }

    return result;
}

// Function to prompt for project name
export function promptForProjectName() {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    return new Promise((resolve) => {
        rl.question('Please enter a project name: ', (answer) => {
            rl.close();
            resolve(answer.trim());
        });
    });
}

export async function getProjectName(initialName = process.argv[2]) {
    let projectName = initialName;

    while (!projectName || !isValidProjectName(projectName)) {
        if (projectName) {
            console.log('Invalid project name. Please use only letters, numbers, hyphens, and underscores.');
        }
        projectName = await promptForProjectName();
    }

    projectName = projectName.toLowerCase();

    console.clear();
    console.log(`Creating Next.js PWA project: ${projectName} \n`);

    return projectName;
}

// Function to update the layout.tsx file with new metadata
export async function updateLayoutMetadata(projectPath) {
    const possiblePaths = [
        // Typescript
        path.join(projectPath, 'src', 'app', 'layout.tsx'),
        path.join(projectPath, 'app', 'layout.tsx'),
        path.join(projectPath, 'layout.tsx'),

        // Javascript
        path.join(projectPath, 'src', 'app', 'layout.js'),
        path.join(projectPath, 'app', 'layout.js'),
        path.join(projectPath, 'layout.js')
    ];

    for (const filePath of possiblePaths) {
        if (fs.existsSync(filePath)) {
            let fileContent = fs.readFileSync(filePath, 'utf8');

            // Regex to find and replace the metadata export
            if (filePath.endsWith('.tsx')) {
                fileContent = fileContent.replace(/export const metadata: Metadata = \{[^}]*\};/, metadataTS.trim());
            } 
            else if (filePath.endsWith('.js')) {
                fileContent = fileContent.replace(/const metadata = \{[^}]*\};/, metadataJS.trim());
            }

            fs.writeFileSync(filePath, fileContent, 'utf8');
            console.log(`Updated metadata in ${filePath}`);
            
            break; // Exit after the first match
        }
    }
}

function ensureSerwistImport(fileContent) {
    if (/from\s+["']@serwist\/next["']/.test(fileContent)) {
        return fileContent;
    }

    const importMatches = [...fileContent.matchAll(/^import .+$/gm)];
    if (importMatches.length > 0) {
        const lastImport = importMatches[importMatches.length - 1];
        const insertAt = lastImport.index + lastImport[0].length;
        return `${fileContent.slice(0, insertAt)}\n${serwistImport}${fileContent.slice(insertAt)}`;
    }

    return `${serwistImport}\n\n${fileContent}`;
}

function ensureTurbopack(fileContent) {
    if (/turbopack\s*:/.test(fileContent)) {
        return fileContent;
    }

    const emptyNextConfig = /const nextConfig(?:\s*:\s*[^{\n=]+)?\s*=\s*\{\s*\}/;
    if (emptyNextConfig.test(fileContent)) {
        return fileContent.replace(emptyNextConfig, (match) =>
            match.replace(/\{\s*\}/, '{\n  turbopack: {},\n}')
        );
    }

    return fileContent.replace(
        /(const nextConfig(?:\s*:\s*[^{\n=]+)?\s*=\s*\{)/,
        '$1\n  turbopack: {},'
    );
}

function replaceDefaultExport(fileContent) {
    if (/export\s+default\s+withSerwist\s*\(\s*nextConfig\s*\)/.test(fileContent)) {
        return fileContent;
    }

    if (/export\s+default\s+nextConfig;?/.test(fileContent)) {
        return fileContent.replace(/export\s+default\s+nextConfig;?/, serwistExport);
    }

    return `${fileContent.trimEnd()}\n\n${serwistExport}\n`;
}

export function updateNextConfig(projectPath) {
    const possiblePaths = [
        path.join(projectPath, 'next.config.ts'),
        path.join(projectPath, 'next.config.mjs'),
        path.join(projectPath, 'next.config.js'),
    ];

    for (const filePath of possiblePaths) {
        if (fs.existsSync(filePath)) {
            let fileContent = fs.readFileSync(filePath, 'utf8');

            fileContent = ensureSerwistImport(fileContent);
            fileContent = ensureTurbopack(fileContent);
            fileContent = replaceDefaultExport(fileContent);

            fs.writeFileSync(filePath, fileContent, 'utf8');
            console.log(`Updated ${path.basename(filePath)} with PWA configuration`);

            break;
        }
    }
}

export function copyPublicFolder(projectPath, templatePublicDir) {
    const publicDir = path.join(projectPath, 'public');

    if (fs.existsSync(publicDir)) {
        fs.rmSync(publicDir, { recursive: true, force: true });
    }

    fs.cpSync(templatePublicDir, publicDir, { recursive: true });
    console.log('Replaced public/ with PWA assets');
}

export function updateHomePage(projectPath, packageRoot) {
    const possiblePaths = [
        path.join(projectPath, 'src', 'app', 'page.tsx'),
        path.join(projectPath, 'app', 'page.tsx'),
        path.join(projectPath, 'src', 'app', 'page.js'),
        path.join(projectPath, 'app', 'page.js'),
    ];

    for (const filePath of possiblePaths) {
        if (!fs.existsSync(filePath)) {
            continue;
        }

        const isTs = filePath.endsWith('.tsx');
        const componentName = isTs ? 'install-button.tsx' : 'install-button.js';

        fs.copyFileSync(
            path.join(packageRoot, 'src', componentName),
            path.join(path.dirname(filePath), componentName)
        );

        let fileContent = fs.readFileSync(filePath, 'utf8');
        const installButtonImport = 'import { InstallButton } from "./install-button";';

        if (!fileContent.includes('InstallButton')) {
            if (/import Image from ["']next\/image["'];?/.test(fileContent)) {
                fileContent = fileContent.replace(
                    /import Image from ["']next\/image["'];?/,
                    (match) => `${match}\n${installButtonImport}`
                );
            } else {
                fileContent = `${installButtonImport}\n${fileContent}`;
            }

            if (DEPLOY_NOW_ANCHOR.test(fileContent)) {
                fileContent = fileContent.replace(DEPLOY_NOW_ANCHOR, '<InstallButton />');
            } else {
                console.warn(
                    'Could not find the create-next-app "Deploy Now" button. Add <InstallButton /> to the homepage manually.'
                );
            }
        }

        fileContent = fileContent.replace(NEXT_LOGO_SRC, 'src="/svgs/next.svg"');

        fs.writeFileSync(filePath, fileContent, 'utf8');
        console.log(`Updated ${path.basename(filePath)} with an Install button`);

        break;
    }
}
