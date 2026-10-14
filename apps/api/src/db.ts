import { MongoClient, type Collection } from 'mongodb';
import type { AnalyticsEvent } from '@causal/types';
import { config } from './config.js';
export interface StoredEvent extends AnalyticsEvent { createdAt: Date; }
let client: MongoClient | undefined;
let collection: Collection<StoredEvent> | undefined;
export async function events(){
  if(collection) return collection;
  client = new MongoClient(config.MONGODB_URI);
  await client.connect();
  const db=client.db(config.MONGODB_DB);
  collection=db.collection<StoredEvent>('events');
  await collection.createIndexes([
    {key:{projectId:1,sessionId:1,timestamp:1},name:'session_timeline'},
    {key:{projectId:1,'page.url':1,type:1},name:'page_events'},
    {key:{projectId:1,timestamp:-1},name:'project_recent'},
  ]);
  return collection;
}
export async function closeDb(){ if(client) await client.close(); client=undefined; collection=undefined; }
