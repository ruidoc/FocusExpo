const fs = require('fs');

const pkgPath = './package.json';
const appPath = './app.json';
const iosInfoPlistPath = './ios/FocusOne/Info.plist';
const expoPlistPath = './ios/FocusOne/Supporting/Expo.plist';

function readJson(path) {
  return JSON.parse(fs.readFileSync(path, 'utf8'));
}

function writeJson(path, value) {
  fs.writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`);
}

function readText(path) {
  return fs.readFileSync(path, 'utf8');
}

function writeText(path, value) {
  fs.writeFileSync(path, value);
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

function replacePlistStringValue(plist, key, value) {
  const pattern = new RegExp(
    `(<key>${key}<\\/key>\\s*<string>)([^<]*)(<\\/string>)`,
  );

  if (!pattern.test(plist)) {
    throw new Error(`missing plist key: ${key}`);
  }

  return plist.replace(pattern, `$1${value}$3`);
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

const iosInfoPlist = replacePlistStringValue(
  readText(iosInfoPlistPath),
  'CFBundleShortVersionString',
  version,
);

const expoPlist =
  typeof app.expo.runtimeVersion === 'string'
    ? replacePlistStringValue(
        readText(expoPlistPath),
        'EXUpdatesRuntimeVersion',
        app.expo.runtimeVersion,
      )
    : readText(expoPlistPath);

writeJson(pkgPath, pkg);
writeJson(appPath, app);
writeText(iosInfoPlistPath, iosInfoPlist);
writeText(expoPlistPath, expoPlist);

console.log(`version -> ${version}`);
console.log(`ios CFBundleShortVersionString -> ${version}`);

if (typeof app.expo.runtimeVersion === 'string') {
  console.log(`runtimeVersion -> ${app.expo.runtimeVersion}`);
}
