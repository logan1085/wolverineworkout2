import fs from 'node:fs';
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { Box3, Vector3, Texture } from 'three';
import { inflateSync } from 'node:zlib';

// Node has no browser image decoder. Validate embedded PNG streams here,
// then let the real Three loader validate geometry/material bindings. Browser QA covers GPU decoding.
function assetLoader() {
  const loader = new GLTFLoader();
  loader.register(parser => ({
    name: 'NODE_EMBEDDED_PNG_CHECK',
    async loadTexture(index) {
      const definition = parser.json.textures[index];
      const image = parser.json.images[definition.source];
      assert.equal(image.mimeType, 'image/png');
      assert.equal(image.uri, undefined, 'No remote texture references');
      const bytes = Buffer.from(await parser.getDependency('bufferView', image.bufferView));
      assert.equal(bytes.subarray(0,8).toString('hex'), '89504e470d0a1a0a');
      assert.equal(bytes.readUInt32BE(16),256); assert.equal(bytes.readUInt32BE(20),256);
      const data=[];
      for(let offset=8;offset<bytes.length;) {
        const size=bytes.readUInt32BE(offset);
        assert.ok(offset+12+size<=bytes.length);
        if(bytes.toString('ascii',offset+4,offset+8)==='IDAT') data.push(bytes.subarray(offset+8,offset+8+size));
        offset+=12+size;
      }
      assert.ok(inflateSync(Buffer.concat(data)).length>=256*256*3);
      return new Texture();
    },
  }));
  return loader;
}
const catalog = JSON.parse(fs.readFileSync('public/models/wolverine/catalog.json','utf8'));
test('catalog has six unique Blender assets',()=>{assert.equal(catalog.length,6);assert.equal(new Set(catalog.map(a=>a.id)).size,6);});
for(const asset of catalog) test(`${asset.id}: loadable bounded GLB and source files`,async()=>{
  const bytes=fs.readFileSync('public'+asset.model);
  assert.equal(bytes.length,asset.bytes);assert.ok(bytes.length<500000,'Keep each asset below 500 KB');
  assert.equal(bytes.toString('utf8',0,4),'glTF');
  const gltf=await assetLoader().parseAsync(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength),'');
  let meshes=0;gltf.scene.traverse(o=>{if(o.isMesh){meshes++;assert.ok(o.geometry.attributes.position.count>0);o.geometry.dispose();}});assert.ok(meshes>0);
  const size=new Box3().setFromObject(gltf.scene).getSize(new Vector3());assert.ok(size.length()>0 && size.length()<10);
  assert.ok(fs.statSync('public'+asset.thumbnail).size>1000);
  assert.ok(fs.statSync('assets/blender/'+asset.id+'.blend').size>1000);
});

const characters=JSON.parse(fs.readFileSync("public/models/characters/catalog.json","utf8"));
test("three unique characters with valid geometry and editable sources",async()=>{assert.equal(characters.length,3);assert.equal(new Set(characters.map(c=>c.id)).size,3);for(const c of characters){const b=fs.readFileSync("public"+c.model);assert.ok(b.length<800000);const gltf=await assetLoader().parseAsync(b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength),"");assert.ok(new Box3().setFromObject(gltf.scene).getSize(new Vector3()).length()>0);assert.ok(fs.statSync("assets/blender/characters/"+c.id+".blend").size>1000);}});

test('companions carry embedded fabric normals into the web model',()=>{
  for(const character of characters) {
    const bytes=fs.readFileSync('public'+character.model);
    const length=bytes.readUInt32LE(12);
    const document=JSON.parse(bytes.subarray(20,20+length).toString('utf8'));
    const shell=document.materials.find(material=>material.name===character.title+' soft shell');
    assert.ok(shell?.normalTexture, `${character.title} needs the baked surface`);
    const texture=document.textures[shell.normalTexture.index];
    const image=document.images[texture.source];
    assert.ok(Number.isInteger(image.bufferView));
    assert.equal(image.uri,undefined);
    assert.equal(image.mimeType,'image/png');
  }
});
