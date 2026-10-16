import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import validator from 'gltf-validator';
const path='public/models/training/training-ground-v1.glb';
const bytes=fs.readFileSync(path);
const manifest=JSON.parse(fs.readFileSync('public/models/training/manifest.json','utf8'));
const jsonLength=bytes.readUInt32LE(12);
const gltf=JSON.parse(bytes.subarray(20,20+jsonLength).toString());
test('Blender stadium is a self-contained valid glTF with baked unlit materials',async()=>{
 const result=await validator.validateBytes(new Uint8Array(bytes),{maxIssues:100});
 assert.equal(result.issues.numErrors,0,JSON.stringify(result.issues.messages));
 assert.ok(gltf.extensionsUsed.includes('KHR_materials_unlit'));
 assert.ok(gltf.materials.every(m=>m.extensions?.KHR_materials_unlit));
 assert.ok(gltf.buffers.every(b=>!b.uri));assert.ok(gltf.images.every(i=>!i.uri&&Number.isInteger(i.bufferView)));
 assert.equal(gltf.meshes.length,1);assert.equal(gltf.meshes[0].primitives.length,1);
});
test('Blender asset meets mobile budgets and provenance matches exported bytes',()=>{
 assert.equal(manifest.authoring,'Blender');assert.match(manifest.blenderVersion,/^4\.5\./);
 assert.ok(fs.statSync(manifest.source).size>1000);
 assert.ok(bytes.length<3_000_000,`${bytes.length} exceeds 3MB budget`);
 assert.ok(manifest.triangles<50_000);assert.equal(manifest.bytes,bytes.length);
 assert.equal(manifest.sha256,crypto.createHash('sha256').update(bytes).digest('hex'));
 assert.equal(gltf.images.length,1);
});
