import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const context = {window:{}};
for (const file of ['itinerary.js','route-data.js']) vm.runInNewContext(fs.readFileSync(path.join(root,file),'utf8'),context);
const {TRIP_DATA:days,TRIP_ROUTES:routes} = context.window;
assert.equal(days.length,3);
assert.equal(routes.length,3);
const html = fs.readFileSync(path.join(root,'index.html'),'utf8');
const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);
assert.equal(new Set(ids).size,ids.length,'HTML IDs must be unique');
for (const [,asset] of html.matchAll(/(?:src|href)="(\.\/[^"?#]+)"/g)) assert.ok(fs.existsSync(path.join(root,asset)),`Missing asset ${asset}`);
for (const [,anchor] of html.matchAll(/href="#([^"]+)"/g)) assert.ok(ids.includes(anchor),`Missing anchor ${anchor}`);
days.forEach((day,i)=>{
  assert.ok(day.stops.length>=3);
  for (const stop of day.stops) {
    assert.ok(stop.lat>42 && stop.lat<44 && stop.lng>140 && stop.lng<142,`Invalid coordinate ${stop.title}`);
    for (const key of ['title','address','description','parking','time','tag']) assert.ok(stop[key],`Missing ${key}`);
    assert.equal(new URL(stop.url).protocol,'https:');
  }
  assert.ok(routes[i].distance>1000 && routes[i].distance<300000);
  assert.ok(routes[i].duration>0 && routes[i].duration<18000);
  assert.equal(routes[i].geometry.type,'LineString');
  assert.ok(routes[i].geometry.coordinates.length>10);
  const first = routes[i].geometry.coordinates[0], last = routes[i].geometry.coordinates.at(-1);
  for (const [actual,expected] of [[first,day.driving[0]],[last,day.driving.at(-1)]]) {
    assert.ok(Math.abs(actual[0]-expected[1])<.01 && Math.abs(actual[1]-expected[0])<.01,'Route endpoint mismatch');
  }
});
for(const file of ['app.js','itinerary.js','route-data.js']) new vm.Script(fs.readFileSync(path.join(root,file),'utf8'));
console.log(`PASS: ${days.length} days, ${days.reduce((n,d)=>n+d.stops.length,0)} stops, ${routes.length} road routes, JS syntax, local assets and page anchors.`);
