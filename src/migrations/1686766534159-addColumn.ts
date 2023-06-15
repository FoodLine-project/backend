import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddColumn1686766534159 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "stores" ADD COLUMN "coordinates" geometry(Point, 4326) DEFAULT NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "stores" DROP COLUMN "coordinates"`);
  }
}
