'use strict';

const TABLE_NAME = 'user';

module.exports = {
  up: async (qi, Sequelize) => {
    await qi.sequelize.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp";');
    await qi.createTable(TABLE_NAME, {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      uid: {
        type: Sequelize.UUID,
        unique: true,
        allowNull: false,
        defaultValue: Sequelize.literal('uuid_generate_v4()'),
      },
      email: {
        type: Sequelize.STRING,
        unique: true,
      },
      password: {
        type: Sequelize.STRING,
      },
      role: {
        type: Sequelize.ENUM('ADMIN', 'USER', 'INTEGRATION'),
      },
      first_name: { type: Sequelize.STRING(50) },
      last_name: { type: Sequelize.STRING(50) },
      img_url: { type: Sequelize.TEXT },
      createdAt: {
        type: Sequelize.DATE,
        field: 'created_at',
        allowNull: false,
      },
      updatedAt: {
        type: Sequelize.DATE,
        field: 'updated_at',
        allowNull: false,
      },
      deletedAt: {
        type: Sequelize.DATE,
        field: 'deleted_at',
      },
    });
  },
  down: (queryInterface) => queryInterface.dropTable(TABLE_NAME),
};
