const {app,BrowserWindow,ipcMain,Notification,Menu,powerMonitor,screen,nativeImage,systemPreferences}=require('electron');
const path=require('node:path'),fs=require('node:fs');let win,hitTimer,scale=1,pinned=true,folded=false,dragStart=null,tracking;
const qaMode=process.argv.includes('--moonlit-qa');let startupEnabled=!qaMode;const startupName=qaMode?'MoonlitWriter-QA-'+process.pid:'Moonlit Writer';
if(!app.requestSingleInstanceLock())app.quit();app.on('second-instance',()=>{if(win&&!win.isDestroyed()){if(win.isMinimized())win.restore();win.show();win.focus()}});
app.setAppUserModelId('studio.sol.moonlitwriter');
app.whenReady().then(()=>{
 const prefsFile=path.join(app.getPath('userData'),'widget-preferences.json');
 try{const p=JSON.parse(fs.readFileSync(prefsFile,'utf8'));scale=Math.min(1.6,Math.max(.6,Number(p.scale)||1));pinned=p.pinned!==false;folded=p.folded===true;startupEnabled=p.startup!==false&&!qaMode}catch{}
 const shapes={};for(const state of ['open','closed']){const im=nativeImage.createFromPath(path.join(__dirname,'assets',state==='open'?'compact.png':'compact-closed.png'));shapes[state]={size:im.getSize(),pixels:im.toBitmap()}}
 function prefs(){try{fs.writeFileSync(prefsFile,JSON.stringify({scale,pinned,folded,startup:startupEnabled}))}catch{}}
 const runKey='HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Run',approvedKey='HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\StartupApproved\\Run';
 function registry(args){return require('node:child_process').execFileSync('reg.exe',args,{windowsHide:true,encoding:'utf8',stdio:['ignore','pipe','pipe']})}
 function loginStatus(){if(process.platform==='win32'){try{const run=registry(['query',runKey,'/v',startupName]);let disabled=false;try{disabled=/REG_BINARY\s+03/i.test(registry(['query',approvedKey,'/v',startupName]))}catch{}const registered=run.toLowerCase().includes(process.execPath.toLowerCase())&&run.includes('--autostart');return {enabled:registered&&!disabled,launches:registered&&!disabled}}catch{return {enabled:false,launches:false}}}try{const s=app.getLoginItemSettings({type:'mainAppService'});return {enabled:s.openAtLogin,launches:s.status==='enabled',status:s.status}}catch{return {enabled:false,launches:false}}}
 function loginSet(value){try{if(process.platform==='win32'){if(value){registry(['add',runKey,'/v',startupName,'/t','REG_SZ','/d','"'+process.execPath+'" --autostart','/f']);registry(['add',approvedKey,'/v',startupName,'/t','REG_BINARY','/d','020000000000000000000000','/f'])}else{try{registry(['delete',runKey,'/v',startupName,'/f'])}catch{}try{registry(['delete',approvedKey,'/v',startupName,'/f'])}catch{}}}else app.setLoginItemSettings({openAtLogin:!!value,type:'mainAppService'});startupEnabled=!!value;prefs();const status=loginStatus();return {...status,ok:status.enabled===!!value}}catch{return {enabled:false,launches:false,ok:false}}}
 if(!qaMode&&startupEnabled)loginSet(true);
 ipcMain.handle('startup-state',()=>loginStatus());ipcMain.handle('startup-set',(_,v)=>loginSet(v));
 function shape(){return shapes[folded?'closed':'open']}
 function resize(value){scale=Math.min(1.6,Math.max(.6,Number(value)||1));const old=win.getBounds(),s=shape().size,w=Math.round(350*scale),h=Math.round(w*s.height/s.width);win.setBounds({x:old.x,y:old.y+old.height-h,width:w,height:h});win.webContents.send('widget-state',{scale,pinned,folded});prefs();return scale}
 function setFold(v){folded=!!v;win.webContents.send('widget-state',{scale,pinned,folded});resize(scale);return folded}
 function create(){const s=shape().size;win=new BrowserWindow({width:Math.round(350*scale),height:Math.round(350*scale*s.height/s.width),frame:false,transparent:true,backgroundColor:'#00000000',hasShadow:false,resizable:false,maximizable:false,alwaysOnTop:pinned,title:'Moonlit Writer',webPreferences:{preload:path.join(__dirname,'preload.cjs'),contextIsolation:true,nodeIntegration:false,backgroundThrottling:false}});win.loadFile('index.html');win.webContents.setWindowOpenHandler(()=>({action:'deny'}));win.webContents.on('will-navigate',e=>e.preventDefault());
 hitTimer=setInterval(()=>{if(!win||win.isDestroyed()||!win.isVisible()||dragStart)return;const p=screen.getCursorScreenPoint(),b=win.getBounds(),s=shape(),x=Math.floor((p.x-b.x)/b.width*s.size.width),y=Math.floor((p.y-b.y)/b.height*s.size.height);const inside=x>=0&&y>=0&&x<s.size.width&&y<s.size.height&&s.pixels[(y*s.size.width+x)*4+3]>24;win.setIgnoreMouseEvents(!inside,{forward:true})},80);
 win.on('closed',()=>{clearInterval(hitTimer);dragStart=null;win=null});}
 Menu.setApplicationMenu(process.platform==='darwin'?Menu.buildFromTemplate([{role:'appMenu'},{role:'editMenu'}]):null);
 create();app.on('activate',()=>{if(!BrowserWindow.getAllWindows().length)create()});
 const Tracking=require('./tracking.cjs');tracking=new Tracking({app,systemPreferences,powerMonitor,emit:v=>{if(win&&!win.isDestroyed())win.webContents.send('typing-state',v)}});
 ipcMain.handle('typing-state',()=>tracking.snapshot());ipcMain.handle('typing-toggle',(_,v)=>tracking.setEnabled(v));ipcMain.handle('typing-targets',(_,v)=>tracking.setTargets(v));ipcMain.handle('typing-retry',()=>tracking.retry());
 app.on('before-quit',()=>{tracking.stop();if(qaMode)loginSet(false)});
 ipcMain.handle('widget-state',()=>({scale,pinned,folded}));
 ipcMain.handle('pin',(_,v)=>{pinned=!!v;win.setAlwaysOnTop(pinned);prefs();return pinned});
 ipcMain.handle('resize',(_,v)=>resize(v));ipcMain.handle('fold',(_,v)=>setFold(v));
 ipcMain.on('drag-start',(_,x,y)=>{if(Number.isFinite(x)&&Number.isFinite(y))dragStart={x,y,b:win.getBounds()}});
 ipcMain.on('drag-move',(_,x,y)=>{if(dragStart&&Number.isFinite(x)&&Number.isFinite(y))win.setPosition(Math.round(dragStart.b.x+x-dragStart.x),Math.round(dragStart.b.y+y-dragStart.y))});
 ipcMain.on('drag-end',()=>{dragStart=null});
 ipcMain.handle('close',()=>win.close());ipcMain.handle('minimize',()=>win.minimize());
 ipcMain.handle('menu',()=>{Menu.buildFromTemplate([{label:folded?'뚜껑 열기':'뚜껑 닫기',click:()=>setFold(!folded)},{label:'항상 위',type:'checkbox',checked:pinned,click:()=>{pinned=!pinned;win.setAlwaysOnTop(pinned);prefs();win.webContents.send('widget-state',{scale,pinned,folded})}},{label:'크기',submenu:[.6,.75,1,1.2,1.4,1.6].map(v=>({label:Math.round(v*100)+'%',type:'radio',checked:Math.abs(scale-v)<.01,click:()=>resize(v)}))},{label:'최소화',click:()=>win.minimize()},{label:'종료',click:()=>win.close()}]).popup({window:win})});
 ipcMain.handle('notify',(_,body)=>{if(Notification.isSupported())new Notification({title:'Moonlit Writer',body:String(body).slice(0,200)}).show()});
 powerMonitor.on('suspend',()=>win?.webContents.send('sleep'));powerMonitor.on('lock-screen',()=>win?.webContents.send('sleep'));
});app.on('window-all-closed',()=>{tracking?.stop();app.quit()});
