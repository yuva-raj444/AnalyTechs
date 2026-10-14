const API=process.env.NEXT_PUBLIC_API_URL||'http://localhost:4000';
export async function getJSON<T>(path:string):Promise<T>{const r=await fetch(`${API}${path}`,{cache:'no-store'});if(!r.ok)throw new Error(`API ${r.status}`);return r.json()}
export {API};
