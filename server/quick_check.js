const { MongoClient } = require('mongodb');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

const uri = (process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/edutrack_x').replace('localhost', '127.0.0.1');

async function check() {
    const client = new MongoClient(uri, { serverSelectionTimeoutMS: 2000 });
    try {
        console.log('Connecting to:', uri);
        await client.connect();
        console.log('Connected!');
        const db = client.db();
        const collection = db.collection('attendances');
        const indexes = await collection.indexes();
        console.log('INDEXES_START');
        console.log(JSON.stringify(indexes, null, 2));
        console.log('INDEXES_END');
    } catch (err) {
        console.error('ERROR:', err.message);
    } finally {
        await client.close();
        process.exit(0);
    }
}
check();
