import JSZip from 'jszip';

import { readExclusionsFile } from '../../../../../src/options/components/Exclusions/Actions/fileHelpers';

const createTxtFile = (content, filename) => {
    const file = new Blob([content], { type: 'text/plain' });
    file.name = filename;
    return file;
};

const createZipFile = async (files) => {
    const zip = new JSZip();

    files.forEach(({ content, filename }) => {
        zip.file(filename, content);
    });

    const file = await zip.generateAsync({ type: 'blob' });
    file.name = 'exclusions.zip';
    return file;
};

describe('fileHelpers', () => {
    describe('readExclusionsFile', () => {
        describe('reads files with "regular.txt" and "selective.txt" filenames', () => {
            const expectedContent = 'example.org';

            it('regular.txt', async () => {
                const regularFile = createTxtFile(expectedContent, 'regular.txt');
                const regularResult = await readExclusionsFile(regularFile);
                const [{ type, content }] = regularResult;
                expect(type).toBe('regular');
                expect(content).toBe(expectedContent);
            });

            it('selective.txt', async () => {
                const selectiveFile = createTxtFile(expectedContent, 'selective.txt');
                const selectiveResult = await readExclusionsFile(selectiveFile);
                const [{ type, content }] = selectiveResult;
                expect(type).toBe('selective');
                expect(content).toBe(expectedContent);
            });
        });

        describe('reads files with ".regular.txt" and ".selective.txt" extension', () => {
            const expectedContent = 'example.org';

            it('.regular.txt', async () => {
                const file = createTxtFile(expectedContent, 'my-list.regular.txt');

                const result = await readExclusionsFile(file);
                const [{ type, content }] = result;
                expect(type).toBe('regular');
                expect(content).toBe(expectedContent);
            });

            it('.selective.txt', async () => {
                const file = createTxtFile(expectedContent, 'my-list.selective.txt');

                const result = await readExclusionsFile(file);
                const [{ type, content }] = result;
                expect(type).toBe('selective');
                expect(content).toBe(expectedContent);
            });
        });

        it('reads files with .txt extension', async () => {
            const expectedContent = 'example.org';
            const file = createTxtFile(expectedContent, 'text-file.txt');
            const result = await readExclusionsFile(file);
            const [{ type, content }] = result;
            expect(type).toBe('txt');
            expect(content).toBe(expectedContent);
        });

        it('reads files with "regular.txt" and "selective.txt" filenames within .zip extension', async () => {
            const expectedRegularContent = 'example.org';
            const expectedSelectiveContent = 'example.com';
            const zipFile = await createZipFile([
                { content: expectedRegularContent, filename: 'regular.txt' },
                { content: expectedSelectiveContent, filename: 'selective.txt' },
            ]);

            const result = await readExclusionsFile(zipFile);
            expect(result.length).toBe(2);

            expect(result.some((r) => r.type === 'regular')).toBeTruthy();
            expect(result.some((r) => r.content === expectedRegularContent)).toBeTruthy();
            expect(result.some((r) => r.type === 'selective')).toBeTruthy();
            expect(result.some((r) => r.content === expectedSelectiveContent)).toBeTruthy();
        });

        it('reads files with ".regular.txt" and ".selective.txt" extensions within .zip extension', async () => {
            const expectedRegularContent = 'example.org';
            const expectedSelectiveContent = 'example.com';
            const zipFile = await createZipFile([
                { content: expectedRegularContent, filename: 'exclusions.regular.txt' },
                { content: expectedSelectiveContent, filename: 'exclusions.selective.txt' },
            ]);

            const result = await readExclusionsFile(zipFile);
            expect(result.length).toBe(2);

            expect(result.some((r) => r.type === 'regular')).toBeTruthy();
            expect(result.some((r) => r.content === expectedRegularContent)).toBeTruthy();
            expect(result.some((r) => r.type === 'selective')).toBeTruthy();
            expect(result.some((r) => r.content === expectedSelectiveContent)).toBeTruthy();
        });
    });
});
