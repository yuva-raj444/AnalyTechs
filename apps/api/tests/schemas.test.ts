import { describe, expect, it } from 'vitest';
import { eventSchema } from '../src/schemas.js';
const base={projectId:'demo-project',sessionId:'sess_12345678',page:{url:'https://example.com/a',path:'/a'},timestamp:new Date().toISOString()};
describe('event schema',()=>{
 it('accepts page views',()=>expect(eventSchema.safeParse({...base,type:'page_view'}).success).toBe(true));
 it('requires click coordinates for clicks',()=>expect(eventSchema.safeParse({...base,type:'click'}).success).toBe(false));
 it('accepts valid clicks',()=>expect(eventSchema.safeParse({...base,type:'click',click:{x:10,y:20,viewportWidth:1440,viewportHeight:900}}).success).toBe(true));
});
