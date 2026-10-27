// macOS 앱은 반드시 macOS에서 빌드한다. Windows에서 만든 번들은 서명이 깨져 Mac에서 열리지 않았다.
// 사용: node build-mac.cjs            → Universal(arm64+x64)
//       node build-mac.cjs --arch=arm64 / --arch=x64
const fs=require('node:fs'),path=require('node:path'),{execFileSync}=require('node:child_process');
if(process.platform!=='darwin'){console.error('macOS 빌드는 macOS에서만 실행할 수 있어요. (서명·심볼릭 링크·universal 병합에 macOS 도구가 필요)');process.exit(1)}
const pkg=require('./package.json');
const archArg=(process.argv.find(a=>a.startsWith('--arch='))||'--arch=universal').slice(7);
const label={universal:'Universal',arm64:'AppleSilicon',x64:'Intel'}[archArg];if(!label)throw Error('알 수 없는 arch: '+archArg);
const outDir=path.join(__dirname,'release');

// 앱에 들어갈 파일만 허용한다. 예전 빌드는 프로젝트 루트의 배포 ZIP(260MB)까지 앱 안에 넣었다.
const allowFiles=new Set([...pkg.build.files.filter(f=>!f.includes('*')),'package.json'].map(f=>'/'+f));
const allowDirs=['/assets/compact.png','/assets/compact-closed.png','/node_modules/node-gyp-build','/node_modules/uiohook-napi'];
function allowed(p){
 if(p==='')return true;
 if(allowFiles.has(p))return true;
 if(/^\/node_modules\/uiohook-napi\/prebuilds\/(?!darwin-)/.test(p))return false;
 if(/^\/node_modules\/uiohook-napi\/(src|libuiohook|binding\.gyp)/.test(p))return false;
 return allowDirs.some(a=>p===a||p.startsWith(a+'/')||a.startsWith(p+'/'));
}
function run(cmd,args){return execFileSync(cmd,args,{encoding:'utf8',stdio:['ignore','pipe','pipe']})}

(async()=>{
 const {packager}=require('@electron/packager');
 fs.rmSync(outDir,{recursive:true,force:true});fs.mkdirSync(outDir,{recursive:true});
 const [dir]=await packager({dir:__dirname,name:'Moonlit Writer',platform:'darwin',arch:archArg,out:path.join(outDir,'build'),overwrite:true,asar:false,prune:true,ignore:p=>!allowed(p),appBundleId:'studio.sol.moonlitwriter',appCategoryType:'public.app-category.productivity',appVersion:pkg.version,buildVersion:pkg.version,darwinDarkModeSupport:true});
 const app=path.join(dir,'Moonlit Writer.app');
 // 애드혹 서명: 개발자 인증서 없이 번들 무결성 봉인만 한다(공증 아님). Apple Silicon은 서명 없는 코드를 실행하지 않는다.
 run('codesign',['--force','--deep','--sign','-','--timestamp=none',app]);
 run('codesign',['--verify','--deep','--strict','--verbose=2',app]);
 const zip=path.join(outDir,'WritingTimer_macOS_'+label+'.zip');
 run('ditto',['-c','-k','--sequesterRsrc','--keepParent',app,zip]);
 console.log('archs: '+run('lipo',['-archs',path.join(app,'Contents','MacOS','Moonlit Writer')]).trim());
 console.log('Created '+zip);
})().catch(e=>{console.error(e.stderr||e);process.exitCode=1});
