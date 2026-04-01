import { EiaHttpClient } from '../eia/eia-http.client';
import { EnergyRepository } from './energy.repository';
export declare class EnergyService {
    private readonly eiaHttpClient;
    private readonly energyRepository;
    private readonly logger;
    constructor(eiaHttpClient: EiaHttpClient, energyRepository: EnergyRepository);
    syncData(params: {
        start?: string;
        end?: string;
    }): Promise<{
        count: number;
        message: string;
    }>;
}
