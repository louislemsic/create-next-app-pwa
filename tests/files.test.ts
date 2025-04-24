import { suite, expect, test } from 'vitest';
import fs from 'fs';
import path from 'path';

const iconPath = path.resolve(__dirname, '../src', 'icon.svg');
const functionsPath = path.resolve(__dirname, '../src', 'functions.ts');
const manifestPath = path.resolve(__dirname, '../src', 'manifest.json');
const configPath = path.resolve(__dirname, '../src', 'next.config.ts');

suite('File: icon.svg', () => {
    test('it should exist', () => {
        console.log(iconPath);
        
        expect(fs.existsSync(iconPath)).toBe(true);
    });

    test('it should be a valid SVG', () => {
        const svgContent = fs.readFileSync(iconPath, 'utf-8');
        expect(svgContent).toMatch(/<svg[^>]*>([\s\S]*?)<\/svg>/);
    });
});

suite('File: functions.ts', () => {
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
});

suite('File: next.config.ts', () => {
    test('it should exist', () => {
        expect(fs.existsSync(configPath)).toBe(true);
    });

    test('it should set the correct src for the service worker', () => {
        const configContent = fs.readFileSync(configPath, 'utf-8');
        expect(configContent).toMatch(/swSrc:\s*"sw\.ts"/);
    });

    test('it should set the correct dest for the service worker', () => {
        const configContent = fs.readFileSync(configPath, 'utf-8');
        expect(configContent).toMatch(/swDest:\s*"public\/sw\.js"/);
    });
});
