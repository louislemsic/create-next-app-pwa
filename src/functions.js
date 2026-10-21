import readline from 'readline';
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

// Function to check if the project name is valid
export function isValidProjectName(name) {
    return /^[a-zA-Z0-9-_]+$/.test(name);
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

export async function getProjectName() {
    // Get the project name from the command line arguments and convert it to lowercase
    let projectName = process.argv[2];

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

        if (!fileContent.includes('InstallButton')) {
            fileContent = fileContent.replace(
                /import Image from ["']next\/image["'];?/,
                (match) => `${match}\nimport { InstallButton } from "./install-button";`
            );

            // Only replace the Deploy Now <a>, not earlier links such as Templates.
            fileContent = fileContent.replace(
                /<a\b[^>]*>(?:(?!<\/a>)[\s\S])*Deploy Now\s*<\/a>/,
                '<InstallButton />'
            );
        }

        fileContent = fileContent.replace(
            /src=["']\/next\.svg["']/,
            'src="/svgs/next.svg"'
        );

        fs.writeFileSync(filePath, fileContent, 'utf8');
        console.log(`Updated ${path.basename(filePath)} with an Install button`);

        break;
    }
}
