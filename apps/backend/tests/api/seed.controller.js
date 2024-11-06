import SeedService from './seed.service.js';

async function resetDatabase(_req, res) {
  await SeedService.resetDatabase();
  return res.status(200).send();
}

async function seedUser(_req, res) {
  const user = await SeedService.createUser();
  return res.json({ data: user });
}

export default {
  resetDatabase,
  seedUser,
};
