import { EnergyService } from '../energy.service';
import { SyncDto } from './sync.dto';
export declare class SyncController {
    private readonly energyService;
    constructor(energyService: EnergyService);
    sync(syncDto: SyncDto): Promise<{
        count: number;
        message: string;
    }>;
}
