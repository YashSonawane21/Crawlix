// testMongo.js
const { MongoClient } = require('mongodb');

// MongoDB connection URL
const url = 'mongodb://127.0.0.1:27017';
const client = new MongoClient(url);

async function run() {
    try {
        await client.connect();
        console.log('Connected to MongoDB');

        const database = client.db('crawlixDB'); // Create/use database
        const collection = database.collection('testCollection'); // Create/use collection

        // Insert a test document
        const doc = { name: 'Yash', project: 'Crawlix', date: new Date() };
        const result = await collection.insertOne(doc);
        console.log('Document inserted with _id:', result.insertedId);

        // Fetch all documents
        const docs = await collection.find({}).toArray();
        console.log('All documents:', docs);

    } finally {
        await client.close();
    }
}

run().catch(console.dir);