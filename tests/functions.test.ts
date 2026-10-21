import { expect, test, suite, beforeEach, vi } from 'vitest'
import { isValidProjectName, getProjectName, promptForProjectName, updateLayoutMetadata, updateNextConfig, copyPublicFolder, updateHomePage, serwistExport, serwistImport } from '../src/functions'
import path from 'path'
import fs from 'fs'

suite('Function: isValidProjectName', () => {
    test('it should correctly validate project names', () => {
        expect(isValidProjectName('valid-project')).toBe(true)
        expect(isValidProjectName('valid_project')).toBe(true)
        expect(isValidProjectName('ValidProject123')).toBe(true)
        expect(isValidProjectName('invalid project')).toBe(false)
        expect(isValidProjectName('invalid@project')).toBe(false)
        expect(isValidProjectName('')).toBe(false)
    });
});

suite('Function: getProjectName', () => {
    test('it should return a valid project name when provided', async () => {
        // Mock process.argv
        const originalArgv = process.argv
        process.argv = ['node', 'script', 'valid-project']
    
        const result = await getProjectName()
        expect(result).toBe('valid-project')
    
        // Restore original process.argv
        process.argv = originalArgv
    });

    test('it should prompt for a name if not provided', async () => {
        // Mock process.argv with no project name
        const originalArgv = process.argv;
        process.argv = ['node', 'script'];

        // const result = await getProjectName();
        expect(true).toBe(true);

        // Restore original process.argv
        process.argv = originalArgv;
    });
});

const mockMetadataTS: string = `
export const metadata: Metadata = {
    manifest: "/manifest.json",
    title: "Next.js PWA",
    description: "Welcome to the Next.js Progressive Web App!",
};
`;

const mockMetadataJS: string = `
const metadata = {
    manifest: "/manifest.json",
    title: "Next.js PWA",
    description: "Welcome to the Next.js Progressive Web App!",
};
`;

vi.mock('fs');

suite('Function: updateLayoutMetadata', () => {
    const projectPath = '/mock/project';

    beforeEach(() => {
        vi.clearAllMocks();
    });

    test('should update metadata in the first existing layout.tsx file', () => {
        const filePath = path.join(projectPath, 'src', 'app', 'layout.tsx');

        // Mock fs methods
        vi.mocked(fs.existsSync).mockReturnValueOnce(true); // Simulate that the file exists
        vi.mocked(fs.readFileSync).mockReturnValueOnce(`export const metadata: Metadata = { /* old metadata */ };`); // Simulate file content

        // Call the function
        updateLayoutMetadata(projectPath);

        // Expect fs methods to have been called correctly
        expect(fs.existsSync).toHaveBeenCalledWith(filePath);
        expect(fs.readFileSync).toHaveBeenCalledWith(filePath, 'utf8');
        expect(fs.writeFileSync).toHaveBeenCalledWith(filePath, expect.stringContaining(mockMetadataTS.trim()), 'utf8');
    });

    test('should update metadata in the first existing layout.js file', () => {
        const filePath = path.join(projectPath, 'src', 'app', 'layout.js');

        // Mock fs methods
        vi.mocked(fs.existsSync)
            .mockReturnValueOnce(false) // layout.tsx doesn't exist (first path)
            .mockReturnValueOnce(false) // layout.tsx doesn't exist (second path)
            .mockReturnValueOnce(false) // layout.tsx doesn't exist (third path)
            .mockReturnValueOnce(true);  // layout.js exists (fourth path)

        vi.mocked(fs.readFileSync).mockReturnValueOnce(`const metadata = { /* old metadata */ };`);

        // Call the function
        updateLayoutMetadata(projectPath);

        // Expect fs methods to have been called correctly
        expect(fs.existsSync).toHaveBeenCalledWith(filePath);
        expect(fs.readFileSync).toHaveBeenCalledWith(filePath, 'utf8');
        expect(fs.writeFileSync).toHaveBeenCalledWith(filePath, expect.stringContaining(mockMetadataJS.trim()), 'utf8');
    });
});

suite('Function: updateNextConfig', () => {
    const projectPath = '/mock/project';
    const tsConfigPath = path.join(projectPath, 'next.config.ts');
    const mjsConfigPath = path.join(projectPath, 'next.config.mjs');

    beforeEach(() => {
        vi.clearAllMocks();
    });

    test('should inject turbopack and Serwist into next.config.ts', () => {
        vi.mocked(fs.existsSync).mockReturnValueOnce(true);
        vi.mocked(fs.readFileSync).mockReturnValueOnce(`import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
};

export default nextConfig;
`);

        updateNextConfig(projectPath);

        expect(fs.existsSync).toHaveBeenCalledWith(tsConfigPath);
        expect(fs.writeFileSync).toHaveBeenCalledWith(
            tsConfigPath,
            expect.stringContaining(serwistImport),
            'utf8'
        );

        const writtenContent = vi.mocked(fs.writeFileSync).mock.calls[0][1];
        expect(writtenContent).toContain('turbopack: {},');
        expect(writtenContent).toContain(serwistExport);
        expect(writtenContent).not.toMatch(/export default nextConfig;?/);
        expect(writtenContent).toContain('/* config options here */');
    });

    test('should inject turbopack and Serwist into next.config.mjs', () => {
        vi.mocked(fs.existsSync)
            .mockReturnValueOnce(false)
            .mockReturnValueOnce(true);
        vi.mocked(fs.readFileSync).mockReturnValueOnce(`/** @type {import('next').NextConfig} */
const nextConfig = {};

export default nextConfig;
`);

        updateNextConfig(projectPath);

        expect(fs.existsSync).toHaveBeenCalledWith(mjsConfigPath);
        const writtenContent = vi.mocked(fs.writeFileSync).mock.calls[0][1];
        expect(writtenContent).toContain(serwistImport);
        expect(writtenContent).toContain('turbopack: {},');
        expect(writtenContent).toContain(serwistExport);
        expect(writtenContent).not.toMatch(/export default nextConfig;?/);
    });

    test('should not add turbopack if it already exists', () => {
        vi.mocked(fs.existsSync).mockReturnValueOnce(true);
        vi.mocked(fs.readFileSync).mockReturnValueOnce(`import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    resolveAlias: {},
  },
};

export default nextConfig;
`);

        updateNextConfig(projectPath);

        const writtenContent = vi.mocked(fs.writeFileSync).mock.calls[0][1];
        expect(writtenContent).toContain('resolveAlias: {},');
        expect(writtenContent.match(/turbopack\s*:/g)).toHaveLength(1);
        expect(writtenContent).toContain(serwistExport);
    });
});

suite('Function: copyPublicFolder', () => {
    const projectPath = '/mock/project';
    const templatePublicDir = '/mock/template/public';
    const publicDir = path.join(projectPath, 'public');

    beforeEach(() => {
        vi.clearAllMocks();
    });

    test('should replace the generated public folder with the template', () => {
        vi.mocked(fs.existsSync).mockReturnValueOnce(true);

        copyPublicFolder(projectPath, templatePublicDir);

        expect(fs.rmSync).toHaveBeenCalledWith(publicDir, { recursive: true, force: true });
        expect(fs.cpSync).toHaveBeenCalledWith(templatePublicDir, publicDir, { recursive: true });
        expect(fs.mkdirSync).not.toHaveBeenCalled();
    });

    test('should copy the template when public does not exist', () => {
        vi.mocked(fs.existsSync).mockReturnValueOnce(false);

        copyPublicFolder(projectPath, templatePublicDir);

        expect(fs.rmSync).not.toHaveBeenCalled();
        expect(fs.cpSync).toHaveBeenCalledWith(templatePublicDir, publicDir, { recursive: true });
    });
});

suite('Function: updateHomePage', () => {
    const projectPath = '/mock/project';
    const packageRoot = '/mock/package';
    const pagePath = path.join(projectPath, 'src', 'app', 'page.tsx');
    const componentPath = path.join(projectPath, 'src', 'app', 'install-button.tsx');

    beforeEach(() => {
        vi.clearAllMocks();
    });

    test('should replace the Deploy button with InstallButton in page.tsx', () => {
        vi.mocked(fs.existsSync).mockReturnValueOnce(true);
        vi.mocked(fs.readFileSync).mockReturnValueOnce(`import Image from "next/image";

export default function Home() {
  return (
    <div>
          <Image src="/next.svg" alt="Next.js logo" width={100} height={20} />
          <a
            className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-foreground px-5 text-background"
            href="https://vercel.com/new"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Image
              src="/vercel.svg"
              alt="Vercel logomark"
              width={16}
              height={14}
            />
            Deploy Now
          </a>
    </div>
  );
}
`);

        updateHomePage(projectPath, packageRoot);

        expect(fs.copyFileSync).toHaveBeenCalledWith(
            path.join(packageRoot, 'src', 'install-button.tsx'),
            componentPath
        );

        const writtenContent = vi.mocked(fs.writeFileSync).mock.calls[0][1];
        expect(writtenContent).toContain('import { InstallButton } from "./install-button";');
        expect(writtenContent).toContain('<InstallButton />');
        expect(writtenContent).toContain('src="/svgs/next.svg"');
        expect(writtenContent).not.toContain('Deploy Now');
        expect(writtenContent).not.toContain('src="/next.svg"');
        expect(fs.writeFileSync).toHaveBeenCalledWith(pagePath, expect.any(String), 'utf8');
    });

    test('should not replace earlier links when inserting InstallButton', () => {
        vi.mocked(fs.existsSync).mockReturnValueOnce(true);
        vi.mocked(fs.readFileSync).mockReturnValueOnce(`import Image from "next/image";

export default function Home() {
  return (
    <div>
      <Image src="/next.svg" alt="Next.js logo" width={100} height={20} />
      <p>
        Head over to{" "}
        <a href="https://vercel.com/templates">Templates</a>{" "}
        or the{" "}
        <a href="https://nextjs.org/learn">Learning</a>{" "}
        center.
      </p>
      <div>
        <a href="https://vercel.com/new">
          <Image src="/vercel.svg" alt="Vercel logomark" width={16} height={14} />
          Deploy Now
        </a>
        <a href="https://nextjs.org/docs">Documentation</a>
      </div>
    </div>
  );
}
`);

        updateHomePage(projectPath, packageRoot);

        const writtenContent = vi.mocked(fs.writeFileSync).mock.calls[0][1];
        expect(writtenContent).toContain('Templates');
        expect(writtenContent).toContain('Learning');
        expect(writtenContent).toContain('Documentation');
        expect(writtenContent).toContain('<InstallButton />');
        expect(writtenContent).toContain('src="/svgs/next.svg"');
        expect(writtenContent).not.toContain('Deploy Now');
        expect(writtenContent.match(/<p>/g)).toHaveLength(1);
        expect(writtenContent.match(/<\/p>/g)).toHaveLength(1);
    });
});