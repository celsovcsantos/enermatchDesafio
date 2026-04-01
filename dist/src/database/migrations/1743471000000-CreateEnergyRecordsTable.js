"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateEnergyRecordsTable1743471000000 = void 0;
const typeorm_1 = require("typeorm");
class CreateEnergyRecordsTable1743471000000 {
    name = 'CreateEnergyRecordsTable1743471000000';
    async up(queryRunner) {
        await queryRunner.createTable(new typeorm_1.Table({
            name: 'energy_records',
            columns: [
                {
                    name: 'id',
                    type: 'uuid',
                    isPrimary: true,
                    generationStrategy: 'uuid',
                    default: 'uuid_generate_v4()',
                },
                {
                    name: 'period',
                    type: 'varchar',
                    isNullable: false,
                },
                {
                    name: 'respondent',
                    type: 'varchar',
                    isNullable: false,
                },
                {
                    name: 'respondentName',
                    type: 'varchar',
                    isNullable: false,
                },
                {
                    name: 'type',
                    type: 'varchar',
                    isNullable: false,
                },
                {
                    name: 'typeDescription',
                    type: 'varchar',
                    isNullable: false,
                },
                {
                    name: 'value',
                    type: 'float',
                    isNullable: false,
                },
                {
                    name: 'unit',
                    type: 'varchar',
                    isNullable: false,
                },
                {
                    name: 'createdAt',
                    type: 'timestamp',
                    default: 'CURRENT_TIMESTAMP',
                },
                {
                    name: 'updatedAt',
                    type: 'timestamp',
                    default: 'CURRENT_TIMESTAMP',
                    onUpdate: 'CURRENT_TIMESTAMP',
                },
            ],
        }), true);
        await queryRunner.createIndex('energy_records', new typeorm_1.TableIndex({
            name: 'IDX_energy_records_period',
            columnNames: ['period'],
        }));
        await queryRunner.createIndex('energy_records', new typeorm_1.TableIndex({
            name: 'IDX_energy_records_respondent',
            columnNames: ['respondent'],
        }));
        await queryRunner.createIndex('energy_records', new typeorm_1.TableIndex({
            name: 'IDX_energy_records_period_respondent',
            columnNames: ['period', 'respondent'],
        }));
        await queryRunner.createUniqueConstraint('energy_records', new typeorm_1.TableUnique({
            name: 'UQ_energy_records_period_respondent_type',
            columnNames: ['period', 'respondent', 'type'],
        }));
    }
    async down(queryRunner) {
        await queryRunner.dropTable('energy_records');
    }
}
exports.CreateEnergyRecordsTable1743471000000 = CreateEnergyRecordsTable1743471000000;
//# sourceMappingURL=1743471000000-CreateEnergyRecordsTable.js.map