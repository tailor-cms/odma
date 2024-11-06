import camelCase from 'lodash/camelCase.js';
import db from '../../shared/database/index.js';
import { faker } from '@faker-js/faker';
import mapKeys from 'lodash/mapKeys.js';
import { role as roles } from '@app/config';
import seedUsers from '@app/seed/user.json' with { type: 'json' };

const { User } = db;

class SeedService {
  async resetDatabase() {
    await db.sequelize.drop({});
    await db.initialize();
    await Promise.all(
      seedUsers.map((it) => User.create(mapKeys(it, (_, k) => camelCase(k)))),
    );
    return true;
  }

  async createUser(
    email = faker.internet.email(),
    password = faker.internet.password(),
    role = roles.ADMIN,
  ) {
    await User.create({
      email,
      password,
      role,
    });
    return { email, password };
  }
}

export default new SeedService();
