import { suite, expect, test } from 'vitest';
import fs from 'fs';
import path from 'path';

const publicDir = path.resolve(__dirname, '../src', 'public');
const iconPath = path.join(publicDir, 'svgs', 'icon.svg');
const installIconPath = path.join(publicDir, 'svgs', 'install.svg');
const screenshotPath = path.join(publicDir, 'screenshots', '1.webp');
const functionsPath = path.resolve(__dirname, '../src', 'functions.js');
const manifestPath = path.join(publicDir, 'manifest.json');
const installButtonTsPath = path.resolve(__dirname, '../src', 'install-button.tsx');
const installButtonJsPath = path.resolve(__dirname, '../src', 'install-button.js');

suite('File: public/', () => {
    test('it should exist', () => {
        expect(fs.existsSync(publicDir)).toBe(true);
    });

    test('it should include the PWA icon', () => {
        expect(fs.existsSync(iconPath)).toBe(true);
        const svgContent = fs.readFileSync(iconPath, 'utf-8');
        expect(svgContent).toMatch(/<svg[^>]*>([\s\S]*?)<\/svg>/);
    });

    test('it should include a screenshot', () => {
        expect(fs.existsSync(screenshotPath)).toBe(true);
    });

    test('it should include the install icon', () => {
        expect(fs.existsSync(installIconPath)).toBe(true);
        const svgContent = fs.readFileSync(installIconPath, 'utf-8');
        expect(svgContent).toMatch(/<svg[^>]*>([\s\S]*?)<\/svg>/);
    });
});

suite('File: install-button', () => {
    test('it should include a TypeScript component', () => {
        expect(fs.existsSync(installButtonTsPath)).toBe(true);
    });

    test('it should include a JavaScript component', () => {
        expect(fs.existsSync(installButtonJsPath)).toBe(true);
    });
});

suite('File: functions.js', () => {
    test('it should exist', () => {
        expect(fs.existsSync(functionsPath)).toBe(true);
    });
});

interface Manifest {
    name: string;
    short_name: string;
    description: string;
    icons: {
        src: string;
        sizes: string;
        type: string;
        purpose: string;
    }[];
    theme_color: string;
    background_color: string;
    start_url: string;
    display: string;
    screenshots: {
        src: string;
        sizes: string;
        type: string;
        form_factor: string;
        label: string;
    }[];
}

suite('File: manifest.json', () => {
    let manifestContent: string;
    let manifest: Manifest;

    test('it should exist', () => {
        expect(fs.existsSync(manifestPath)).toBe(true);
    });

    test('it should be a valid JSON', () => {
        manifestContent = fs.readFileSync(manifestPath, 'utf-8');
        expect(() => JSON.parse(manifestContent)).not.toThrow();
        manifest = JSON.parse(manifestContent); // Parse it once for further tests
    });

    test('it should have a name attribute', () => {
        expect(manifest).toHaveProperty('name');
    });

    test('it should have a short_name attribute', () => {
        expect(manifest).toHaveProperty('short_name');
    });

    test('it should have a description attribute', () => {
        expect(manifest).toHaveProperty('description');
    });

    test('it should have an icons attribute', () => {
        expect(manifest).toHaveProperty('icons');
        expect(Array.isArray(manifest.icons)).toBe(true);
        expect(manifest.icons.length).toBeGreaterThan(0); // Ensure there is at least one icon
    });

    test('it should have a theme_color attribute', () => {
        expect(manifest).toHaveProperty('theme_color');
    });

    test('it should have a background_color attribute', () => {
        expect(manifest).toHaveProperty('background_color');
    });

    test('it should have a start_url attribute', () => {
        expect(manifest).toHaveProperty('start_url');
    });

    test('it should have a display attribute', () => {
        expect(manifest).toHaveProperty('display');
    });

    test('it should have a screenshots attribute', () => {
        expect(manifest).toHaveProperty('screenshots');
        expect(Array.isArray(manifest.screenshots)).toBe(true);
        expect(manifest.screenshots.length).toBeGreaterThan(0);
    });
});
