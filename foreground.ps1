[Console]::OutputEncoding = [System.Text.UTF8Encoding]::new($false)
Add-Type -TypeDefinition @'
using System;
using System.Runtime.InteropServices;
public static class MoonlitForeground {
 [DllImport("user32.dll")] public static extern IntPtr GetForegroundWindow();
 [DllImport("user32.dll")] public static extern uint GetWindowThreadProcessId(IntPtr hWnd, out uint pid);
}
'@
while ($true) {
 try {
  $taskPid = [uint32]0
  [void][MoonlitForeground]::GetWindowThreadProcessId([MoonlitForeground]::GetForegroundWindow(), [ref]$taskPid)
  $taskProcess = Get-Process -Id $taskPid -ErrorAction Stop
  [Console]::WriteLine((@{name=$taskProcess.ProcessName} | ConvertTo-Json -Compress))
 } catch { [Console]::WriteLine('{"name":""}') }
 Start-Sleep -Milliseconds 180
}
