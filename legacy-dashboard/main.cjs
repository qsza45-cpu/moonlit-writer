const {app,BrowserWindow,ipcMain,Notification,Menu,powerMonitor}=require('electron');
const path=require('node:path');
let win;
app.whenReady().then(()=>{
 Menu.setApplicationMenu(Menu.buildFromTemplate([process.platform==='darwin'?{role:'appMenu'}:{label:'파일',submenu:[{role:'quit',label:'종료'}]},{role:'editMenu'},{role:'viewMenu'},{role:'windowMenu'}]));
 function create(){win=new BrowserWindow({width:1200,height:840,minWidth:800,minHeight:580,title:'Moonlit Writer',backgroundColor:'#142857',titleBarStyle:process.platform==='darwin'?'hiddenInset':'default',autoHideMenuBar:process.platform!=='darwin',webPreferences:{preload:path.join(__dirname,'preload.cjs'),contextIsolation:true,nodeIntegration:false,backgroundThrottling:false}});win.loadFile('index.html');win.webContents.setWindowOpenHandler(()=>({action:'deny'}));win.webContents.on('will-navigate',e=>e.preventDefault());}
 create();app.on('activate',()=>{if(!BrowserWindow.getAllWindows().length)create()});
 ipcMain.handle('pin',(_,value)=>{win.setAlwaysOnTop(!!value);return !!value});
 ipcMain.handle('compact',(_,value)=>{win.setMinimumSize(value?360:800,value?420:580);win.setSize(value?390:1200,value?490:840);return !!value});
 ipcMain.handle('notify',(_,body)=>{if(Notification.isSupported())new Notification({title:'Moonlit Writer',body:String(body).slice(0,200)}).show()});
 powerMonitor.on('suspend',()=>win?.webContents.send('sleep'));powerMonitor.on('lock-screen',()=>win?.webContents.send('sleep'));
});
app.on('window-all-closed',()=>{if(process.platform!=='darwin')app.quit()});
