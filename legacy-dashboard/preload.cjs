const {contextBridge,ipcRenderer}=require('electron');
contextBridge.exposeInMainWorld('desktop',{pin:v=>ipcRenderer.invoke('pin',v),compact:v=>ipcRenderer.invoke('compact',v),notify:v=>ipcRenderer.invoke('notify',v),onSleep:cb=>ipcRenderer.on('sleep',cb)});
