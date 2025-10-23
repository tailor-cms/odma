import { Migration } from '@mikro-orm/migrations';

export class CreateUser extends Migration {
  async up(): Promise<void> {
    await this.ctx?.schema?.createTable('users', (table) => {
      table.uuid('id').primary();
      table.datetime('created_at').notNullable();
      table.datetime('updated_at').notNullable();
      table.datetime('deleted_at').nullable();
      table.string('email', 255).notNullable().unique().index();
      table.string('password', 255).notNullable();
      table.enum('role', ['ADMIN', 'USER']).notNullable().defaultTo('USER');
      table.string('first_name', 200).nullable();
      table.string('last_name', 200).nullable();
      table.text('img_url').nullable();
      table.datetime('last_login_at').nullable();
    });
  }

  async down(): Promise<void> {
    await this.ctx?.schema?.dropTable('users');
  }
}
