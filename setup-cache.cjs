// Populate a workspace cache from already-downloaded packages; no network access.
const path = require('node:path');
const cacache = require('C:/Program Files/nodejs/node_modules/npm/node_modules/cacache');
const semver = require('C:/Program Files/nodejs/node_modules/npm/node_modules/semver');
const source = path.join(process.env.LOCALAPPDATA, 'npm-cache', '_cacache');
const target = path.resolve('.npm-cache/_cacache');
const seen = new Set();
async function copy(name, range) {
  const key = 'make-fetch-happen:request-cache:https://registry.npmjs.org/' + name.replace('/', '%2f');
  const entry = await cacache.get(source, key);
  const meta = JSON.parse(entry.data);
  const cached = await cacache.ls(source);
  const version = semver.maxSatisfying(Object.keys(meta.versions).filter(v => cached['make-fetch-happen:request-cache:' + meta.versions[v].dist.tarball]), range);
  if (!version) throw new Error('Unavailable: ' + name + '@' + range);
  const pkg = meta.versions[version];
  if (pkg.os && !pkg.os.includes(process.platform)) return;
  if (pkg.cpu && !pkg.cpu.includes(process.arch)) return;
  if (seen.has(name + version)) return;
  seen.add(name + version);
  const metadata = structuredClone(entry.metadata);
  delete metadata.resHeaders.vary;
  await cacache.put(target, key, entry.data, { metadata });
  const tarKey = 'make-fetch-happen:request-cache:' + pkg.dist.tarball;
  const tar = await cacache.get(source, tarKey);
  await cacache.put(target, tarKey, tar.data, { metadata: tar.metadata });
  console.log(name + '@' + version);
  for (const [dep, wanted] of Object.entries(pkg.dependencies || {})) await copy(dep, wanted);
  for (const [dep, wanted] of Object.entries(pkg.optionalDependencies || {})) {
    try { await copy(dep, wanted); } catch (error) { console.log('Optional unavailable: ' + dep); }
  }
}
(async () => {
  for (const [name, version] of Object.entries({next:'16.4.3',react:'19.3.1','react-dom':'19.3.1','@supabase/supabase-js':'2.118.0',zod:'4.6.5','lucide-react':'0.363.0',typescript:'5.9.3','@types/node':'*','@types/react':'19.3.0','@types/react-dom':'19.3.0'})) await copy(name,version);
})().catch(error => { console.error(error.message); process.exitCode = 1; });
