Set WshShell = CreateObject("WScript.Shell")
WshShell.Popup "Menyiapkan POS Kasir (V1)...", 2, "POS Majmu Prod", 64
WshShell.CurrentDirectory = CreateObject("Scripting.FileSystemObject").GetParentFolderName(WScript.ScriptFullName)
' Run with 0 to hide the window
WshShell.Run "cmd /c start_v1_only.bat", 1, False
Set WshShell = Nothing
