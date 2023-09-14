import JSZip from 'jszip';

import {
    ExclusionDataType,
    readExclusionsFile,
} from '../../../../../src/options/components/Exclusions/Actions/fileHelpers';

type CreateFileData = {
    filename: string,
    content: string,
};

const createTxtFile = (content: BlobPart, filename: string): File => {
    return new File([content], filename, { type: 'text/plain' });
};

const createZipFile = async (files: CreateFileData[]): Promise<File> => {
    const zip = new JSZip();

    files.forEach(({ content, filename }) => {
        zip.file(filename, content);
    });

    const file = await zip.generateAsync({ type: 'blob' });
    // TODO: remove ts-ignore
    // @ts-ignore
    file.name = 'exclusions.zip';
    return file as File;
};

describe('fileHelpers', () => {
    describe('readExclusionsFile', () => {
        describe('reads files with "general.txt", "selective.txt" and deprecated "regular.txt" filenames', () => {
            const expectedContent = 'example.org';

            it('general.txt', async () => {
                const generalFile = createTxtFile(expectedContent, 'general.txt');
                const regularResult = await readExclusionsFile(generalFile);
                const [{ type, content }] = regularResult;
                expect(type).toBe(ExclusionDataType.General);
                expect(content).toBe(expectedContent);
            });

            it('deprecated regular.txt', async () => {
                const regularFile = createTxtFile(expectedContent, 'regular.txt');
                const regularResult = await readExclusionsFile(regularFile);
                const [{ type, content }] = regularResult;
                expect(type).toBe(ExclusionDataType.General);
                expect(content).toBe(expectedContent);
            });

            it('selective.txt', async () => {
                const selectiveFile = createTxtFile(expectedContent, 'selective.txt');
                const selectiveResult = await readExclusionsFile(selectiveFile);
                const [{ type, content }] = selectiveResult;
                expect(type).toBe(ExclusionDataType.Selective);
                expect(content).toBe(expectedContent);
            });
        });

        describe('reads files with ".regular.txt" and ".selective.txt" extension', () => {
            const expectedContent = 'example.org';

            it('.general.txt', async () => {
                const file = createTxtFile(expectedContent, 'my-list.general.txt');

                const result = await readExclusionsFile(file);
                const [{ type, content }] = result;
                expect(type).toBe(ExclusionDataType.General);
                expect(content).toBe(expectedContent);
            });

            it('deprecated .regular.txt', async () => {
                const file = createTxtFile(expectedContent, 'my-list.regular.txt');

                const result = await readExclusionsFile(file);
                const [{ type, content }] = result;
                expect(type).toBe(ExclusionDataType.General);
                expect(content).toBe(expectedContent);
            });

            it('.selective.txt', async () => {
                const file = createTxtFile(expectedContent, 'my-list.selective.txt');

                const result = await readExclusionsFile(file);
                const [{ type, content }] = result;
                expect(type).toBe(ExclusionDataType.Selective);
                expect(content).toBe(expectedContent);
            });
        });

        it('reads files with .txt extension', async () => {
            const expectedContent = 'example.org';
            const file = createTxtFile(expectedContent, 'text-file.txt');
            const result = await readExclusionsFile(file);
            const [{ type, content }] = result;
            expect(type).toBe(ExclusionDataType.Txt);
            expect(content).toBe(expectedContent);
        });

        it('reads files with "regular.txt" and "selective.txt" filenames within .zip extension', async () => {
            const expectedGeneralContent = 'example.org';
            const expectedRegularContent = 'example.net';
            const expectedSelectiveContent = 'example.com';
            const zipFile = await createZipFile([
                { content: expectedGeneralContent, filename: 'general.txt' },
                { content: expectedRegularContent, filename: 'regular.txt' },
                { content: expectedSelectiveContent, filename: 'selective.txt' },
            ]);

            const result = await readExclusionsFile(zipFile);
            expect(result.length).toBe(3);

            expect(result.some((r) => r.type === ExclusionDataType.General)).toBeTruthy();
            expect(result.some((r) => r.content === expectedGeneralContent)).toBeTruthy();
            expect(result.some((r) => r.type === ExclusionDataType.Regular)).toBeFalsy();
            expect(result.some((r) => r.content === expectedRegularContent)).toBeTruthy();
            expect(result.some((r) => r.type === ExclusionDataType.Selective)).toBeTruthy();
            expect(result.some((r) => r.content === expectedSelectiveContent)).toBeTruthy();
        });

        it('reads files with ".regular.txt" and ".selective.txt" extensions within .zip extension', async () => {
            const expectedGeneralContent = 'example.org';
            const expectedRegularContent = 'example.net';
            const expectedSelectiveContent = 'example.com';
            const zipFile = await createZipFile([
                { content: expectedGeneralContent, filename: 'exclusions.general.txt' },
                { content: expectedRegularContent, filename: 'exclusions.regular.txt' },
                { content: expectedSelectiveContent, filename: 'exclusions.selective.txt' },
            ]);

            const result = await readExclusionsFile(zipFile);
            expect(result.length).toBe(3);

            expect(result.some((r) => r.type === ExclusionDataType.General)).toBeTruthy();
            expect(result.some((r) => r.content === expectedGeneralContent)).toBeTruthy();
            expect(result.some((r) => r.type === ExclusionDataType.Regular)).toBeFalsy();
            expect(result.some((r) => r.content === expectedRegularContent)).toBeTruthy();
            expect(result.some((r) => r.type === ExclusionDataType.Selective)).toBeTruthy();
            expect(result.some((r) => r.content === expectedSelectiveContent)).toBeTruthy();
        });
    });
});
