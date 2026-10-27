ObjC.import('AppKit');ObjC.import('Foundation');
function run(){while(true){try{var name=$.NSWorkspace.sharedWorkspace.frontmostApplication.localizedName.js;var line=JSON.stringify({name:name})+'\n';$.NSFileHandle.fileHandleWithStandardOutput.writeData($(line).dataUsingEncoding($.NSUTF8StringEncoding))}catch(e){}$.NSThread.sleepForTimeInterval(.2)}}
