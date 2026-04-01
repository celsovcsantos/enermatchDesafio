import { EnergyService } from '../energy.service';
export declare class SyncScheduler {
    private readonly energyService;
    private readonly logger;
    constructor(energyService: EnergyService);
    handleCron(): Promise<void>;
}
