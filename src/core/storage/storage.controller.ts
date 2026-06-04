import { Controller, Get, Param, Res } from '@nestjs/common';
import { StorageService } from './storage.service';

@Controller('storage')
export class StorageController {
    constructor(
        private readonly storage: StorageService
    ) { }

    @Get('*dir/:filename')
    getImage(
        @Param('dir') dir: string,
        @Param('filename') filename: string,
        @Res() res: any
    ) {
        return this.storage.getFile(dir.replace(/,/g, '/'), filename, res);
    }
}
