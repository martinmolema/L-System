const childProcess = require('child_process');
const {writeFileSync, copyFileSync, readFileSync} = require('fs');

const tag = childProcess.execSync("git describe --tags").toString().trim();
const longSHA = childProcess.execSync("git rev-parse HEAD").toString().trim();
const shortSHA = childProcess.execSync("git rev-parse --short HEAD").toString().trim();
const branch = childProcess.execSync('git rev-parse --abbrev-ref HEAD').toString().trim();
const authorName = childProcess.execSync("git log -1 --pretty=format:'%an'").toString().trim();
const commitTime = childProcess.execSync("git log -1 --pretty=format:'%cd'").toString().trim();
const commitMsg = childProcess.execSync("git log -1 --pretty=%B").toString().trim();
const totalCommitCount = childProcess.execSync("git rev-list --count HEAD").toString().trim();

const versionInfo = {
  versionTag: tag,
  shortSHA: shortSHA,
  SHA: longSHA,
  branch: branch,
  lastCommitAuthor: authorName,
  lastCommitTime: commitTime,
  lastCommitNumber: totalCommitCount
}

versionInfo.toString = function () {
  let txt = " {\n";
  Object.getOwnPropertyNames(this)
    .forEach(p => {
      if (p !== "toString") {
        txt += `${p} : "${this[p].toString()}", \n`
      }
    });
  txt += "\n}";
  return txt;
}

const versionInfoJson = versionInfo.toString();
const currentDate = new Date()

function lz(num) {
  return (num > 9) ? num.toString() : `0${num.toString()}`;
}

writeFileSync('src/environments/git-version-info.js', `
export const GitVersionInfo = ${versionInfoJson};
export const ProjectBuildInfo = {
  ProjectBuildDate : '${currentDate.getFullYear()}-${lz(currentDate.getMonth() + 1)}-${lz(currentDate.getDate())}',
  ProjectBuildTime : '${lz(currentDate.getHours())}:${lz(currentDate.getMinutes())}:${lz(currentDate.getSeconds())}'
}
`);

const packageJSONFilename = './package.json';
const packgeJSONBackupFilename = './__backup/package.json.version-' + versionInfo.versionTag + '.backup';
copyFileSync(packageJSONFilename, packgeJSONBackupFilename);

const packageJSONContents = readFileSync(packageJSONFilename, {encoding: 'utf-8', flag: 'r'});
const jsonData = JSON.parse(packageJSONContents);
jsonData.version = versionInfo.versionTag;
const newPackageJSONContents = JSON.stringify(jsonData);

writeFileSync(packageJSONFilename, newPackageJSONContents,
  {encoding: 'utf-8', mode: '0666', flag: 'w'});
console.log('Done');

