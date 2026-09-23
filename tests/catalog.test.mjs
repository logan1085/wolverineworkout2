import fs from 'node:fs';
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { Box3, Vector3 } from 'three';
const catalog = JSON.parse(fs.readFileSync('public/models/wolverine/catalog.json','utf8'));
test('catalog has six unique Blender assets',()=>{assert.equal(catalog.length,6);assert.equal(new Set(catalog.map(a=>a.id)).size,6);});
for(const asset of catalog) test(`${asset.id}: loadable bounded GLB and source files`,async()=>{
  const bytes=fs.readFileSync('public'+asset.model);
  assert.equal(bytes.length,asset.bytes);assert.ok(bytes.length<500000,'Keep each asset below 500 KB');
  assert.equal(bytes.toString('utf8',0,4),'glTF');
  const gltf=await new GLTFLoader().parseAsync(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength),'');
  let meshes=0;gltf.scene.traverse(o=>{if(o.isMesh){meshes++;assert.ok(o.geometry.attributes.position.count>0);o.geometry.dispose();}});assert.ok(meshes>0);
  const size=new Box3().setFromObject(gltf.scene).getSize(new Vector3());assert.ok(size.length()>0 && size.length()<10);
  assert.ok(fs.statSync('public'+asset.thumbnail).size>1000);
  assert.ok(fs.statSync('assets/blender/'+asset.id+'.blend').size>1000);
});

const characters=JSON.parse(fs.readFileSync("public/models/characters/catalog.json","utf8"));
test("three unique characters with valid geometry and editable sources",async()=>{assert.equal(characters.length,3);assert.equal(new Set(characters.map(c=>c.id)).size,3);for(const c of characters){const b=fs.readFileSync("public"+c.model);assert.ok(b.length<800000);const gltf=await new GLTFLoader().parseAsync(b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength),"");assert.ok(new Box3().setFromObject(gltf.scene).getSize(new Vector3()).length()>0);assert.ok(fs.statSync("assets/blender/characters/"+c.id+".blend").size>1000);}});
