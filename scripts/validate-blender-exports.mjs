// Validate only checked-in public catalogs; no external model or texture requests.
import {readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import path from 'node:path';
import validator from 'gltf-validator';
const catalogPaths=['public/models/characters/catalog.json','public/models/wolverine/catalog.json'];
const root=path.resolve('public');
const results=[];
for(const catalogPath of catalogPaths){
 const catalog=JSON.parse(readFileSync(catalogPath,'utf8'));
 for(const asset of catalog){
  const file=path.resolve(root,'.'+asset.model);
  if(!file.startsWith(root+path.sep)||!file.endsWith('.glb'))throw new Error('Catalog must reference a local public GLB.');
  const bytes=readFileSync(file);
  const report=await validator.validateBytes(new Uint8Array(bytes),{uri:asset.model,maxIssues:10000,externalResourceFunction:async()=>{throw new Error('External resources are not allowed.');}});
  const result={id:asset.id,catalog:catalogPath,model:asset.model,sha256:createHash('sha256').update(bytes).digest('hex'),bytes:bytes.length,issues:report.issues,info:report.info};
  results.push(result);
  console.log(`${asset.id}: ${report.issues.numErrors} errors, ${report.issues.numWarnings} warnings, ${report.issues.numInfos} informational findings`);
 }
}
const report={validator:validator.version(),scope:'Khronos format validation of exported catalog GLBs. Not visual, GPU, animation or physical-device acceptance.',results};
if(process.argv.includes('--write'))writeFileSync('docs/studio/gltf-validation.json',JSON.stringify(report,null,2)+'\n');
process.exitCode=results.some(r=>r.issues.numErrors>0||r.issues.truncated)?1:0;
