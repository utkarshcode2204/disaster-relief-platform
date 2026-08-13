require('dotenv').config();
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');let mongoServer;
const connectTestDB = async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);

// Ensure geo indexes (2dsphere) are built and actually usable before any $near queries run
  const Incident = require('../models/Incident');
  const Request = require('../models/Request');
  await Incident.syncIndexes();
  await Request.syncIndexes();

  const waitForIndex = async (Model, indexName) => {
    for (let i = 0; i < 20; i++) {
      const indexes = await Model.collection.indexes();
      if (indexes.some((idx) => idx.name === indexName)) return;
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
    throw new Error(`Index ${indexName} was not ready in time`);
  };

  await waitForIndex(Incident, 'location_2dsphere');
  await waitForIndex(Request, 'location_2dsphere');};
const closeTestDB = async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
  await mongoServer.stop();
};

const clearTestDB = async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
};

module.exports = { connectTestDB, closeTestDB, clearTestDB };