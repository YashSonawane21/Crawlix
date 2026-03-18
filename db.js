// db.js
const { MongoClient } = require('mongodb');

const url = 'mongodb://127.0.0.1:27017';
const client = new MongoClient(url);

const dbName = 'crawlixDB';

async function connectDB() {
    await client.connect();
    console.log('Connected to MongoDB');
    const db = client.db(dbName);
    return db;
}

module.exports = { connectDB };