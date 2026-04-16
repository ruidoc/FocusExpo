const fs = require('fs');

const pkgPath = './package.json';
const appPath = './app.json';

function readJson(path) {
  return JSON.parse(fs.readFileSync(path, 'utf8'));
}

function writeJson(path, value) {
  fs.writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`);
}

function bumpPatch(version) {
  const parts = String(version || '')
    .split('.')
    .map(Number);

  if (parts.length !== 3 || parts.some(Number.isNaN)) {
    throw new Error('version must be semver x.y.z');
  }

  parts[2] += 1;
  return parts.join('.');
}

const pkg = readJson(pkgPath);
const app = readJson(appPath);

if (!app.expo) {
  throw new Error('app.json missing expo config');
}

const version = bumpPatch(pkg.version);

pkg.version = version;
app.expo.version = version;

if (typeof app.expo.runtimeVersion === 'string') {
  app.expo.runtimeVersion = version;
}

writeJson(pkgPath, pkg);
writeJson(appPath, app);

console.log(`version -> ${version}`);

if (typeof app.expo.runtimeVersion === 'string') {
  console.log(`runtimeVersion -> ${app.expo.runtimeVersion}`);
}
