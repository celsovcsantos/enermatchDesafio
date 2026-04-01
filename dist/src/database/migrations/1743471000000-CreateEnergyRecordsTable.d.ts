import { MigrationInterface, QueryRunner } from 'typeorm';
export declare class CreateEnergyRecordsTable1743471000000 implements MigrationInterface {
    name: string;
    up(queryRunner: QueryRunner): Promise<void>;
    down(queryRunner: QueryRunner): Promise<void>;
}
