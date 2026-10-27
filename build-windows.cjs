const fs=require('node:fs'),path=require('node:path');
(async()=>{
const {ZipArchive}=await import('archiver');const folder=path.resolve(__dirname,'..','MoonlitWriter-Windows');const appFolder=path.join(folder,'Moonlit Writer v1.3');fs.mkdirSync(appFolder,{recursive:true});
const runtime=path.join(folder,'build-temp','electron-packager','win32-x64-template-LfIMgW');
if(!fs.existsSync(path.join(runtime,'electron.exe')))throw Error('Electron Windows runtime missing');
for(const entry of fs.readdirSync(runtime)){if(entry==='electron.exe'){fs.copyFileSync(path.join(runtime,entry),path.join(appFolder,'Moonlit Writer.exe'))}else fs.cpSync(path.join(runtime,entry),path.join(appFolder,entry),{recursive:true})}
const source=path.join(appFolder,'resources','app');fs.mkdirSync(source,{recursive:true});
for(const f of ['main.cjs','preload.cjs','index.html','style.css','app.js','timer.cjs','tracking.cjs','tracking-worker.cjs','foreground.ps1','foreground-mac.js'])fs.copyFileSync(path.join(__dirname,f),path.join(source,f));
fs.mkdirSync(path.join(source,'assets'),{recursive:true});for(const f of ['compact.png','compact-closed.png'])fs.copyFileSync(path.join(__dirname,'assets',f),path.join(source,'assets',f));
for(const p of ['uiohook-napi','node-gyp-build'])fs.cpSync(path.join(__dirname,'node_modules',p),path.join(source,'node_modules',p),{recursive:true});
fs.writeFileSync(path.join(source,'package.json'),JSON.stringify({name:'moonlit-writer',version:'1.3.0',main:'main.cjs',productName:'Moonlit Writer',dependencies:{'uiohook-napi':'1.5.5'}}));
fs.copyFileSync(path.join(__dirname,'windows-guide.txt'),path.join(appFolder,'사용법.txt'));
const output=fs.createWriteStream(path.join(folder,'MoonlitWriter-Windows-x64.zip')),zip=new ZipArchive({zlib:{level:6}});
await new Promise((resolve,reject)=>{output.on('close',resolve);output.on('error',reject);zip.on('error',reject);zip.pipe(output);zip.directory(appFolder,'Moonlit Writer');zip.finalize()});
console.log('Created '+path.join(folder,'MoonlitWriter-Windows-x64.zip'));
})().catch(e=>{console.error(e);process.exitCode=1});


