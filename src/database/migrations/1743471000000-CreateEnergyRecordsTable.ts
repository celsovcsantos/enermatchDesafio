import { MigrationInterface, QueryRunner, Table, TableIndex, TableUnique } from 'typeorm';

export class CreateEnergyRecordsTable1743471000000 implements MigrationInterface {
  name = 'CreateEnergyRecordsTable1743471000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
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
      }),
      true,
    );

    // Índice composto para consultas por período
    await queryRunner.createIndex(
      'energy_records',
      new TableIndex({
        name: 'IDX_energy_records_period',
        columnNames: ['period'],
      }),
    );

    // Índice composto para consultas por região
    await queryRunner.createIndex(
      'energy_records',
      new TableIndex({
        name: 'IDX_energy_records_respondent',
        columnNames: ['respondent'],
      }),
    );

    // Índice composto para consultas por período e região (combinação comum)
    await queryRunner.createIndex(
      'energy_records',
      new TableIndex({
        name: 'IDX_energy_records_period_respondent',
        columnNames: ['period', 'respondent'],
      }),
    );

    // Constraint unique para evitar duplicatas
    await queryRunner.createUniqueConstraint(
      'energy_records',
      new TableUnique({
        name: 'UQ_energy_records_period_respondent_type',
        columnNames: ['period', 'respondent', 'type'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('energy_records');
  }
}
