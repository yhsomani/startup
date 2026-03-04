/**
 * Base Repository
 * Generic data access pattern for all repository classes
 * Used by services to abstract database operations
 */

class BaseRepository {
  constructor(collectionName, serviceName) {
    this.collectionName = collectionName;
    this.serviceName = serviceName;
    this.database = null;
  }

  async setDatabase(db) {
    this.database = db;
  }

  async find(query = {}) {
    if (!this.database) throw new Error('Database not initialized');
    return this.database.collection(this.collectionName).find(query).toArray();
  }

  async findOne(query) {
    if (!this.database) throw new Error('Database not initialized');
    return this.database.collection(this.collectionName).findOne(query);
  }

  async create(data) {
    if (!this.database) throw new Error('Database not initialized');
    const result = await this.database.collection(this.collectionName).insertOne(data);
    return { id: result.insertedId, ...data };
  }

  async update(query, update) {
    if (!this.database) throw new Error('Database not initialized');
    return this.database.collection(this.collectionName).updateOne(query, { $set: update });
  }

  async delete(query) {
    if (!this.database) throw new Error('Database not initialized');
    return this.database.collection(this.collectionName).deleteOne(query);
  }

  async count(query = {}) {
    if (!this.database) throw new Error('Database not initialized');
    return this.database.collection(this.collectionName).countDocuments(query);
  }
}

module.exports = BaseRepository;
