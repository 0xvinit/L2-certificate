import { MongoClient, Db, Collection } from "mongodb";

const uri = process.env.MONGODB_URI as string;
if (!uri) {
  throw new Error("MONGODB_URI not set");
}

let client: MongoClient | null = null;
let db: Db | null = null;

export async function getDb(): Promise<Db> {
  if (db) return db;
  if (!client) {
    client = new MongoClient(uri);
    await client.connect();
  }
  db = client.db(process.env.MONGODB_DB || "uni-certi");
  return db;
}

export function collection<T extends Document = Document>(name: string): Promise<Collection<T>> {
  return getDb().then(d => d.collection<T>(name));
}



