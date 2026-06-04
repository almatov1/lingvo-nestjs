import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { existsSync, mkdirSync, rmSync, unlinkSync, writeFileSync } from 'fs';
import * as path from 'path';
import { STORAGE_PATH } from '../../common/constants/config';

@Injectable()
export class StorageService {
    constructor() { }

    uploadFile(dir: string, file: Express.Multer.File) {
        if (!file) throw new BadRequestException("Файл не предоставлен");

        const targetDir = this.ensureDir(dir);
        const filename = this.generateFilename(file.originalname);
        const filepath = path.join(targetDir, filename);

        try {
            writeFileSync(filepath, file.buffer);
            return filename;
        } catch (error) {
            throw new BadRequestException("Ошибка при записи файла на диск");
        }
    }

    deleteFile(dir: string, file: string) {
        const filePath = path.join(STORAGE_PATH, dir, file);
        if (existsSync(filePath)) unlinkSync(filePath);
        return true;
    }

    deleteDir(dir: string) {
        const dirPath = path.join(STORAGE_PATH, dir);
        if (existsSync(dirPath)) rmSync(dirPath, { recursive: true, force: true });
        return true;
    }

    getFile(dir: string, filename: string, res: any) {
        const fullPath = path.join(STORAGE_PATH, dir, filename);
        if (!existsSync(fullPath)) throw new NotFoundException("Файл не найден на сервере");

        const rootPath = path.join(STORAGE_PATH, dir);
        return res.sendFile(filename, { root: rootPath });
    }

    private ensureDir(dir: string): string {
        const targetDir = path.join(STORAGE_PATH, dir);
        if (!existsSync(targetDir)) {
            mkdirSync(targetDir, { recursive: true });
        }
        return targetDir;
    }

    private generateFilename(originalName: string): string {
        const ext = path.extname(originalName).toLowerCase();
        const uuid = crypto.randomUUID();
        return `${uuid}${ext}`;
    }
}
