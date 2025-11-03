<#
.SYNOPSIS
    WUICC - 多游戏抽卡记录导出工具 | Multi-Game Gacha History Exporter
.DESCRIPTION
    支持原神、崩坏：星穹铁道、绝区零和鸣潮的抽卡记录导出
    Supports Genshin Impact, Honkai: Star Rail, Zenless Zone Zero and Wuthering Waves
.NOTES
    Version: 2.2
    Features:
    - 中英双语界面 Bilingual interface
    - 自动识别游戏路径 Automatic game path detection
    - 支持国际服/国服 Global/China server support
    - 一键复制链接到剪贴板 One-click copy to clipboard
#>

#region Initialization
Add-Type -AssemblyName System.Web
[Net.ServicePointManager]::SecurityProtocol = [Net.ServicePointManager]::SecurityProtocol -bor [Net.SecurityProtocolType]::Tls12
$ErrorActionPreference = 'Stop'
#endregion

#region Multilingual Setup
$messages = @{
    "Title" = @{
        "en" = "WUICC - Multi-Game Gacha History Exporter";
        "zh" = "雾忆刻 - 多游戏抽卡记录导出工具"
    }
    "Instructions" = @{
        "en" = @"
HOW TO USE:
1. Open the game client
2. Navigate to the Wish/Warp/Signal/Convene history page
3. Keep the game running
4. Run this script
5. Follow the on-screen instructions
NOTE: You must open the gacha history page at least once!
"@;
        "zh" = @"
使用说明：
1. 打开游戏客户端
2. 进入抽卡记录页面 (祈愿/跃迁/调频/唤取) 
3. 保持游戏运行状态
4. 运行本脚本
5. 按照屏幕提示操作
注意：必须先打开过抽卡记录页面！
"@
    }
    "SelectGame" = @{
        "en" = "Please select your game: (Ctrl - C: Exit)";
        "zh" = "请选择游戏: (按Ctrl - C退出)"
    }
    "GameOptions" = @{
        "en" = @(
            "1. Genshin Impact",
            "2. Honkai: Star Rail",
            "3. Zenless Zone Zero",
            "4. Wuthering Waves"
        );
        "zh" = @(
            "1. 原神",
            "2. 崩坏：星穹铁道",
            "3. 绝区零",
            "4. 鸣潮"
        )
    }
    "SelectRegion" = @{
        "en" = "Please select server region:";
        "zh" = "请选择服务器区服："
    }
    "RegionOptions" = @{
        "en" = @(
            "1. Global",
            "2. China"
        );
        "zh" = @(
            "1. 国际服",
            "2. 国服"
        )
    }
    "Processing" = @{
        "en" = "Searching for gacha history... (This may take 10-30 seconds)";
        "zh" = "正在查找抽卡记录... (可能需要10-30秒)"
    }
    "Success" = @{
        "en" = "SUCCESS! URL copied to clipboard!";
        "zh" = "成功！链接已复制到剪贴板！"
    }
    "Error" = @{
        "en" = @"
ERROR: Could not find gacha history.
Possible reasons:
1. Didn't open gacha history page in game
2. Game is not installed in default location

TROUBLESHOOTING:
- Open the gacha history page and wait 10 seconds
- Restart the game and try again
"@;
        "zh" = @"
错误：找不到抽卡记录
可能原因：
1. 没有在游戏中打开抽卡记录页面
2. 游戏未安装在默认位置

解决方法：
- 打开抽卡记录页面并等待10秒
- 重启游戏后再试
"@
    }
    "PressAnyKey" = @{
        "en" = "Press any key to exit...";
        "zh" = "按任意键退出..."
    }
    "GameNotSupported" = @{
        "en" = "Selected game is not supported yet";
        "zh" = "所选游戏暂不支持"
    }
    "LanguagePrompt" = @{
        "en" = "Press Enter to use English (system language) or select:";
        "zh" = "按Enter使用中文 (系统语言) 或选择："
    }
}
#endregion

#region Core Functions
function Show-Instructions {
    param($lang)
    Write-Host "=== $($messages['Title'][$lang]) ===" -ForegroundColor Cyan
    Write-Host $messages['Instructions'][$lang] -ForegroundColor Yellow
    Write-Host ""
}

function Select-Language {
    # Detect system language
    $systemLanguage = (Get-WinSystemLocale).Name
    $defaultLang = if ($systemLanguage -like "zh-*") { "zh" } else { "en" }
    
    Write-Host "=== Language Selection ===" -ForegroundColor Cyan
    Write-Host $messages['LanguagePrompt'][$defaultLang]
    Write-Host "1. English"
    Write-Host "2. 中文"
    
    $choice = Read-Host "Select language (Enter for default)"
    if ([string]::IsNullOrEmpty($choice)) {
        return $defaultLang
    }
    
    while ($choice -notin "1","2") {
        $choice = Read-Host "Invalid input. Please select 1 or 2, or press Enter for default"
        if ([string]::IsNullOrEmpty($choice)) {
            return $defaultLang
        }
    }
    
    return @("en", "zh")[$choice - 1]
}

function Get-GenshinImpactUrl {
    param($region)
    
    $logLocation = "$env:USERPROFILE\AppData\LocalLow\miHoYo\Genshin Impact\output_log.txt"
    $logLocationChina = "$env:USERPROFILE\AppData\LocalLow\miHoYo\$([char]0x539f)$([char]0x795e)\output_log.txt"

    $apiHost = "public-operation-hk4e-sg.hoyoverse.com" 
    if ($region -eq "china") {
        $logLocation = $logLocationChina
        $apiHost = "public-operation-hk4e.mihoyo.com"
    }

    if (-Not (Test-Path $logLocation)) {
        return $null
    }

    $logs = Get-Content -Path $logLocation
    $m = $logs -match "(?m).:/.+(GenshinImpact_Data|YuanShen_Data)"
    if (-not $m) {
        return $null
    }

    $m[0] -match "(.:/.+(GenshinImpact_Data|YuanShen_Data))" >$null
    $gamedir = $matches[1]
    $webcachePath = "$gamedir/webCaches"
    $latestCache = Get-ChildItem -Path $webcachePath | Sort-Object LastWriteTime -Descending | Select-Object -First 1
    $cachefile = "$($latestCache.FullName)\Cache\Cache_Data\data_2"
    $tmpfile = "$env:TEMP\ch_data_2"

    Copy-Item $cachefile -Destination $tmpfile -Force

    function Test-Url($url) {
        try {
            $ProgressPreference = 'SilentlyContinue'
            $uri = [System.UriBuilder]::New($url)
            $uri.Path = "gacha_info/api/getGachaLog"
            $uri.Host = $apiHost
            $params = [System.Web.HttpUtility]::ParseQueryString($uri.Query)
            $params.Set("lang", "en")
            $params.Set("gacha_type", 301)
            $params.Set("size", "5")
            $uri.Query = $params.ToString()
            
            $response = Invoke-WebRequest -Uri $uri.Uri.AbsoluteUri -UseBasicParsing -TimeoutSec 10 | ConvertFrom-Json
            return $response.retcode -eq 0
        } catch {
            return $false
        }
    }

    $content = Get-Content -Encoding UTF8 -Raw $tmpfile
    $splitted = $content -split "1/0/"
    $found = $splitted -match "webview_gacha"
    $link = $null
    
    for ($i = $found.Length - 1; $i -ge 0; $i -= 1) {
        $found[$i] -match "(https.+?game_biz=)" >$null
        $link = $matches[0]
        Write-Host "Checking Link $i" -NoNewline
        if (Test-Url $link) {
            Remove-Item $tmpfile -Force
            return $link
        }
        Start-Sleep -Milliseconds 500
        Write-Host "`r" -NoNewline
    }

    Remove-Item $tmpfile -Force
    return $null
}

function Get-StarRailUrl {
    param($region)
    
    # 根据区域选择不同的路径
    $locallow_path = if ($region -eq "china") {
        "$env:APPDATA\..\LocalLow\miHoYo\$([char]0x5d29)$([char]0x574f)$([char]0xff1a)$([char]0x661f)$([char]0x7a79)$([char]0x94c1)$([char]0x9053)\"
    } else {
        "$env:APPDATA\..\LocalLow\Cognosphere\Star Rail\"
    }

    # 日志文件路径
    $log_path = "$locallow_path\Player.log"
    $prev_log_path = "$locallow_path\Player-prev.log"

    # 尝试获取最新的日志文件
    if (-Not (Test-Path $log_path)) {
        if (-Not (Test-Path $prev_log_path)) {
            return $null
        }
        $log_path = $prev_log_path
    }

    # 从日志中获取游戏路径
    $game_path = $null
    $log_lines = Get-Content $log_path -First 20
    foreach ($line in $log_lines) {
        if ($line -match "Loading player data from (.+)data.unity3d") {
            $game_path = $matches[1]
            break
        }
    }

    if (-not $game_path) {
        return $null
    }

    # 处理webCaches缓存
    $webcachePath = "$game_path\webCaches"
    if (-Not (Test-Path $webcachePath)) {
        return $null
    }

    # 查找最新的缓存文件夹
    $cache_folders = Get-ChildItem -Path $webcachePath -Directory
    $max_version = 0
    $cache_path = "$webcachePath\Cache\Cache_Data\data_2"

    foreach ($folder in $cache_folders) {
        if ($folder.Name -match '^\d+\.\d+\.\d+\.\d+$') {
            $version = [int]-join($folder.Name.Split("."))
            if ($version -gt $max_version) {
                $max_version = $version
                $cache_path = "$($folder.FullName)\Cache\Cache_Data\data_2"
            }
        }
    }

    # 创建临时文件
    $tmpfile = "$env:TEMP\hsr_data_2"
    try {
        Copy-Item -Path $cache_path -Destination $tmpfile -Force
        $content = Get-Content -Encoding UTF8 -Raw $tmpfile
        
        # URL验证函数
        function Test-StarRailUrl($url) {
            try {
                $ProgressPreference = 'SilentlyContinue'
                $uri = [Uri]$url
                $query = [System.Web.HttpUtility]::ParseQueryString($uri.Query)
                $query.Set("lang", "en")
                $query.Set("gacha_type", 1)
                $query.Set("size", "5")
                
                $apiUrl = $uri.Scheme + "://" + $uri.Host + $uri.AbsolutePath + "?" + $query.ToString()
                $response = Invoke-WebRequest -Uri $apiUrl -UseBasicParsing -TimeoutSec 10 | ConvertFrom-Json
                return $response.retcode -eq 0
            } catch {
                return $false
            }
        }
        
        # 检查两种可能的API端点
        $api_endpoints = @("getGachaLog", "getLdGachaLog")
        $splitted = $content -split '1/0/'
        
        foreach ($endpoint in $api_endpoints) {
            for ($i = $splitted.Length - 1; $i -ge 0; $i--) {
                $line = $splitted[$i]
                if ($line -match "(https.+?$endpoint[^\0]+)") {
                    $url = $matches[1]
                    Write-Host "Checking Link $i" -NoNewline
                    if (Test-StarRailUrl $url) {
                        # 清理URL参数，只保留必要参数
                        $uri = [Uri]$url
                        $query = [System.Web.HttpUtility]::ParseQueryString($uri.Query)
                        
                        # 需要保留的参数
                        $requiredParams = @("authkey", "authkey_ver", "sign_type", "game_biz", "lang")
                        
                        # 移除不必要的参数
                        $keys = $query.AllKeys | Where-Object { $_ -notin $requiredParams }
                        foreach ($key in $keys) {
                            $query.Remove($key)
                        }
                        
                        # 重建URL
                        $cleanUrl = $uri.Scheme + "://" + $uri.Host + $uri.AbsolutePath + "?" + $query.ToString()
                        return ($cleanUrl -split '&end_id=')[0] + '&end_id=0'
                    }
                    Start-Sleep -Milliseconds 300
                    Write-Host "`r" -NoNewline
                }
            }
        }
    } catch {
        Write-Host "Error processing cache file: $_" -ForegroundColor Red
    } finally {
        if (Test-Path $tmpfile) { Remove-Item $tmpfile -Force }
    }

    return $null
}

function Get-ZenlessUrl {
    param($region)
    
    # 根据区域选择不同的路径
    $locallow_path = if ($region -eq "china") {
        "$env:APPDATA\..\LocalLow\miHoYo\$([char]0x7edd)$([char]0x533a)$([char]0x96f6)\"
    } else {
        "$env:APPDATA\..\LocalLow\miHoYo\ZenlessZoneZero\"
    }

    # 日志文件路径
    $log_path = "$locallow_path\Player.log"
    $prev_log_path = "$locallow_path\Player-prev.log"

    # 尝试获取最新的日志文件
    if (-Not (Test-Path $log_path)) {
        if (-Not (Test-Path $prev_log_path)) {
            return $null
        }
        $log_path = $prev_log_path
    }

    # 从日志中获取游戏路径
    $game_path = $null
    $log_lines = Get-Content $log_path -First 16
    
    for ($i = 0; $i -lt 16; $i++) {
        $log_line = $log_lines[$i]
        if ($log_line.startsWith("[Subsystems] Discovering subsystems at path ")) {
            $game_path = $log_line.replace("[Subsystems] Discovering subsystems at path ", "").replace("UnitySubsystems", "")
            break
        }
    }

    if ([string]::IsNullOrEmpty($game_path)) {
        return $null
    }

    # 处理webCaches缓存
    $webcachePath = "$game_path\webCaches"
    if (-Not (Test-Path $webcachePath)) {
        return $null
    }

    # 查找最新的缓存文件夹
    $cache_folders = Get-ChildItem -Path $webcachePath -Directory
    $max_version = 0
    $cache_path = "$webcachePath\Cache\Cache_Data\data_2"

    foreach ($folder in $cache_folders) {
        if ($folder.Name -match '^\d+\.\d+\.\d+\.\d+$') {
            $version = [int]-join($folder.Name.Split(".") | ForEach-Object { $_.PadLeft(3, "0") })
            if ($version -ge $max_version) {
                $max_version = $version
                $cache_path = "$($folder.FullName)\Cache\Cache_Data\data_2"
            }
        }
    }

    # 创建临时文件
    $tmpfile = [IO.Path]::GetTempPath() + [Guid]::NewGuid().ToString()
    try {
        Copy-Item -Path $cache_path -Destination $tmpfile -Force
        $cache_data = Get-Content -Encoding UTF8 -Raw $tmpfile
        
        # 分割缓存数据并查找URL
        $cache_data_split = $cache_data -split '1/0/'

        for ($i = $cache_data_split.Length - 1; $i -ge 0; $i--) {
            $line = $cache_data_split[$i]

            if ($line.StartsWith('http') -and $line.Contains("getGachaLog")) {
                $url = ($line -split "\0")[0]

                # 验证URL是否有效
                try {
                    $ProgressPreference = 'SilentlyContinue'
                    $res = Invoke-WebRequest -Uri $url -ContentType "application/json" -UseBasicParsing -TimeoutSec 10 | ConvertFrom-Json

                    if ($res.retcode -eq 0) {
                        # 清理URL参数，只保留必要参数
                        $uri = [Uri]$url
                        $query = [Web.HttpUtility]::ParseQueryString($uri.Query)

                        $keys = $query.AllKeys
                        foreach ($key in $keys) {
                            # 保留必要参数
                            if ($key -eq "authkey") { continue }
                            if ($key -eq "authkey_ver") { continue }
                            if ($key -eq "sign_type") { continue }
                            if ($key -eq "game_biz") { continue }
                            if ($key -eq "lang") { continue }

                            $query.Remove($key)
                        }

                        $latest_url = $uri.Scheme + "://" + $uri.Host + $uri.AbsolutePath + "?" + $query.ToString()
                        return $latest_url
                    }
                } catch {
                    # 如果请求失败，继续检查下一个URL
                    continue
                }
            }
        }
    } catch {
        Write-Host "Error processing cache file: $_" -ForegroundColor Red
    } finally {
        if (Test-Path $tmpfile) { Remove-Item $tmpfile -Force }
    }

    return $null
}

function Get-WutheringWavesUrl {
    param($region)
    
    $checkedDirectories = [System.Collections.Generic.HashSet[string]]::new([System.StringComparer]::OrdinalIgnoreCase)
    $originalErrorPreference = $ErrorActionPreference
    $ErrorActionPreference = "SilentlyContinue"
    
    Write-Host "Attempting to find Wuthering Waves URL automatically..." -ForegroundColor Yellow
    
    function LogCheck {
        param($path)
        
        if (!(Test-Path $path)) {
            return $false, $false, $false
        }
        
        $folderFound = $true
        $gachaLogPath = "$path\Client\Saved\Logs\Client.log"
        $debugLogPath = "$path\Client\Binaries\Win64\ThirdParty\KrPcSdk_Global\KRSDKRes\KRSDKWebView\debug.log"
        $engineIniPath = "$path\Client\Saved\Config\WindowsNoEditor\Engine.ini"

        # 检查Engine.ini是否禁用了日志
        $logDisabled = $false
        if (Test-Path $engineIniPath) {
            $engineIniContent = Get-Content $engineIniPath -Raw
            if ($engineIniContent -match '\[Core\.Log\][\r\n]+Global=(off|none)') {
                $logDisabled = $true
                Write-Host "ERROR: Logging is disabled in Engine.ini. Please enable it to proceed." -ForegroundColor Red
                return $folderFound, $false, $false
            }
        }

        $logFound = $false
        $urlFound = $false
        $urlToCopy = $null

        # 检查Client.log
        if (Test-Path $gachaLogPath) {
            $logFound = $true
            $gachaUrlEntry = Select-String -Path $gachaLogPath -Pattern "https://aki-gm-resources(-oversea)?\.aki-game\.(net|com)/aki/gacha/index\.html#/record" | Select-Object -Last 1
            if ($gachaUrlEntry) {
                $urlToCopy = $gachaUrlEntry -replace '.*?(https://aki-gm-resources(-oversea)?\.aki-game\.(net|com)[^"]*).*', '$1'
                Write-Host "URL found in Client.log" -ForegroundColor Green
            }
        }

        # 检查debug.log
        if ([string]::IsNullOrWhiteSpace($urlToCopy) -and (Test-Path $debugLogPath)) {
            $logFound = $true
            $debugUrlEntry = Select-String -Path $debugLogPath -Pattern '"#url": "(https://aki-gm-resources(-oversea)?\.aki-game\.(net|com)/aki/gacha/index\.html#/record[^"]*)"' | Select-Object -Last 1
            if ($debugUrlEntry) {
                $urlToCopy = $debugUrlEntry.Matches.Groups[1].Value
                Write-Host "URL found in debug.log" -ForegroundColor Green
            }
        }

        if (-not [string]::IsNullOrWhiteSpace($urlToCopy)) {
            $urlFound = $true
            Write-Host "Convene Record URL found" -ForegroundColor Green
            return $folderFound, $logFound, $urlToCopy
        }

        return $folderFound, $logFound, $false
    }

    function SearchAllDiskLetters {
        Write-Host "Searching all disk letters for Wuthering Waves Game folder..." -ForegroundColor Yellow
        
        $availableDrives = Get-PSDrive -PSProvider FileSystem | Select-Object -ExpandProperty Name
        Write-Host "Available drives: $($availableDrives -join ', ')" -ForegroundColor Yellow
        
        foreach ($driveLetter in [char[]](65..90)) {
            $drive = "$($driveLetter):"
            
            if ($driveLetter -notin $availableDrives) {
                continue
            }
            
            Write-Host "Searching drive $drive..."
            
            $gamePaths = @(
                "$drive\SteamLibrary\steamapps\common\Wuthering Waves",
                "$drive\SteamLibrary\steamapps\common\Wuthering Waves\Wuthering Waves Game",
                "$drive\Program Files (x86)\Steam\steamapps\common\Wuthering Waves\Wuthering Waves Game",
                "$drive\Program Files (x86)\Steam\steamapps\common\Wuthering Waves",
                "$drive\Program Files\Steam\steamapps\common\Wuthering Waves\Wuthering Waves Game",
                "$drive\Program Files\Steam\steamapps\common\Wuthering Waves",
                "$drive\Games\Steam\steamapps\common\Wuthering Waves\Wuthering Waves Game",
                "$drive\Games\Steam\steamapps\common\Wuthering Waves",
                "$drive\Steam\steamapps\common\Wuthering Waves\Wuthering Waves Game",
                "$drive\Steam\steamapps\common\Wuthering Waves",
                "$drive\SteamLibrary\steamapps\common\Wuthering Waves\Wuthering Waves Game",
                "$drive\SteamLibrary\steamapps\common\Wuthering Waves",
                "$drive\Program Files\Epic Games\WutheringWavesj3oFh",
                "$drive\Program Files\Epic Games\WutheringWavesj3oFh\Wuthering Waves Game",
                "$drive\Program Files (x86)\Epic Games\WutheringWavesj3oFh",
                "$drive\Program Files (x86)\Epic Games\WutheringWavesj3oFh\Wuthering Waves Game",
                "$drive\Wuthering Waves Game",
                "$drive\Wuthering Waves\Wuthering Waves Game",
                "$drive\Program Files\Wuthering Waves\Wuthering Waves Game",
                "$drive\Games\Wuthering Waves Game",
                "$drive\Games\Wuthering Waves\Wuthering Waves Game",
                "$drive\Program Files (x86)\Wuthering Waves\Wuthering Waves Game"
            )

            foreach ($path in $gamePaths) {
                if (!(Test-Path $path)) {
                    continue
                }
                
                Write-Host "Found potential game folder: $path" -ForegroundColor Green
                
                if ($path -like "*OneDrive*") {
                    Write-Host "Skipping OneDrive path: $path" -ForegroundColor Yellow
                    continue
                }

                if ($checkedDirectories.Contains($path)) {
                    Write-Host "Already checked: $path" -ForegroundColor Gray
                    continue
                }
                
                $checkedDirectories.Add($path) | Out-Null
                $folderFound, $logFound, $urlResult = LogCheck $path
                
                if ($urlResult -ne $false) { 
                    return $urlResult
                }
            }
        }
        
        return $false
    }

    # 搜索策略开始
    $urlResult = $false

    # 1. 检查MUI Cache注册表
    if (!$urlResult) {
        Write-Host "Checking MUI Cache registry..." -ForegroundColor Yellow
        $muiCachePath = "Registry::HKEY_CURRENT_USER\Software\Classes\Local Settings\Software\Microsoft\Windows\Shell\MuiCache"
        try {
            $filteredEntries = (Get-ItemProperty -Path $muiCachePath -ErrorAction SilentlyContinue).PSObject.Properties | 
                Where-Object { $_.Value -like "*wuthering*" } | 
                Where-Object { $_.Name -like "*client-win64-shipping.exe*" }
            
            if ($filteredEntries.Count -ne 0) {
                foreach ($entry in $filteredEntries) {
                    $gamePath = ($entry.Name -split '\\client\\')[0]
                    if ($gamePath -like "*OneDrive*") {
                        Write-Host "Skipping OneDrive path: $gamePath" -ForegroundColor Yellow
                        continue
                    }

                    if ($checkedDirectories.Contains($gamePath)) {
                        Write-Host "Already checked: $gamePath" -ForegroundColor Gray
                        continue
                    }
                    
                    $checkedDirectories.Add($gamePath) | Out-Null
                    Write-Host "Found game path from MUI Cache: $gamePath" -ForegroundColor Green
                    $folderFound, $logFound, $urlResult = LogCheck $gamePath
                    if ($urlResult -ne $false) { break }
                }
            }
        }
        catch {
            Write-Host "Error accessing MUI Cache: $_" -ForegroundColor Red
        }
    }

    # 2. 检查防火墙规则
    if (!$urlResult) {
        Write-Host "Checking firewall rules..." -ForegroundColor Yellow
        $firewallPath = "Registry::HKEY_LOCAL_MACHINE\SYSTEM\CurrentControlSet\Services\SharedAccess\Parameters\FirewallPolicy\FirewallRules"
        try {
            $filteredEntries = (Get-ItemProperty -Path $firewallPath -ErrorAction SilentlyContinue).PSObject.Properties | 
                Where-Object { $_.Value -like "*wuthering*" } | 
                Where-Object { $_.Name -like "*client-win64-shipping*" }
            
            if ($filteredEntries.Count -ne 0) {
                foreach ($entry in $filteredEntries) {
                    $gamePath = (($entry.Value -split 'App=')[1] -split '\\client\\')[0]
                    if ($gamePath -like "*OneDrive*") {
                        Write-Host "Skipping OneDrive path: $gamePath" -ForegroundColor Yellow
                        continue
                    }

                    if ($checkedDirectories.Contains($gamePath)) {
                        Write-Host "Already checked: $gamePath" -ForegroundColor Gray
                        continue
                    }

                    $checkedDirectories.Add($gamePath) | Out-Null
                    Write-Host "Found game path from firewall rules: $gamePath" -ForegroundColor Green
                    $folderFound, $logFound, $urlResult = LogCheck $gamePath
                    if ($urlResult -ne $false) { break }
                }
            }
        }
        catch {
            Write-Host "Error accessing firewall rules: $_" -ForegroundColor Red
        }
    }

    # 3. 检查卸载注册表
    if (!$urlResult) {
        Write-Host "Checking uninstall registry..." -ForegroundColor Yellow
        $64 = "Registry::HKEY_LOCAL_MACHINE\SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall\*"
        $32 = "Registry::HKEY_LOCAL_MACHINE\SOFTWARE\WOW6432Node\Microsoft\Windows\CurrentVersion\Uninstall\*"
        try {
            $gamePath = (Get-ItemProperty -Path $32, $64 | Where-Object { $_.DisplayName -like "*wuthering*" } | Select-Object -ExpandProperty InstallPath -First 1)
            if ($gamePath) {
                if ($gamePath -like "*OneDrive*") {
                    Write-Host "Skipping OneDrive path: $gamePath" -ForegroundColor Yellow
                }
                elseif ($checkedDirectories.Contains($gamePath)) {
                    Write-Host "Already checked: $gamePath" -ForegroundColor Gray
                }
                else {
                    $checkedDirectories.Add($gamePath) | Out-Null
                    Write-Host "Found game path from uninstall registry: $gamePath" -ForegroundColor Green
                    $folderFound, $logFound, $urlResult = LogCheck $gamePath
                }
            }
        }
        catch {
            Write-Host "Error accessing registry: $_" -ForegroundColor Red
        }  
    }

    # 4. 搜索所有磁盘
    if (!$urlResult) {
        $urlResult = SearchAllDiskLetters
    }

    $ErrorActionPreference = $originalErrorPreference

    if ($urlResult -ne $false) {
        return $urlResult
    }

    # 5. 最终回退：用户手动输入
    Write-Host "Game install location not found or log files missing." -ForegroundColor Red
    Write-Host "Please make sure you have opened your in-game Convene History first!" -ForegroundColor Yellow
    
    Write-Host "`nCommon install locations:" -ForegroundColor Cyan
    Write-Host '  C:\Wuthering Waves' -ForegroundColor Yellow
    Write-Host '  C:\Wuthering Waves\Wuthering Waves Game' -ForegroundColor Yellow
    Write-Host '  C:\Program Files\Wuthering Waves\Wuthering Waves Game' -ForegroundColor Yellow
    Write-Host 'For Epic Games:' -ForegroundColor Cyan
    Write-Host '  C:\Program Files\Epic Games\WutheringWavesj3oFh' -ForegroundColor Yellow
    Write-Host '  C:\Program Files\Epic Games\WutheringWavesj3oFh\Wuthering Waves Game' -ForegroundColor Yellow
    Write-Host 'For Steam:' -ForegroundColor Cyan
    Write-Host '  C:\Steam\steamapps\common\Wuthering Waves' -ForegroundColor Yellow
    
    $path = Read-Host "`nPlease input your installation location (or press Enter to skip)"
    
    if (-not [string]::IsNullOrEmpty($path)) {
        Write-Host "Checking user provided path: $path" -ForegroundColor Magenta
        $folderFound, $logFound, $urlResult = LogCheck $path
        if ($urlResult -ne $false) {
            return $urlResult
        }
        Write-Host "Could not find log files in the provided path." -ForegroundColor Red
    }

    return $null
}

# 版本比较函数
function Compare-Versions {
    param (
        [string]$version1,
        [string]$version2
    )

    $v1_parts = $version1.Split(".") | ForEach-Object { [int]$_ }
    $v2_parts = $version2.Split(".") | ForEach-Object { [int]$_ }

    for ($i = 0; $i -lt [math]::max($v1_parts.Count, $v2_parts.Count); $i++) {
        $v1_part = if ($i -lt $v1_parts.Count) { $v1_parts[$i] } else { 0 }
        $v2_part = if ($i -lt $v2_parts.Count) { $v2_parts[$i] } else { 0 }

        if ($v1_part -ne $v2_part) {
            return $v1_part -gt $v2_part
        }
    }
    return $false
}
#endregion

#region Main Program
try {
    # Select language
    $lang = Select-Language
    
    # Show instructions
    Show-Instructions -lang $lang
    
    # Select game
    Write-Host $messages['SelectGame'][$lang] -ForegroundColor Green
    $messages['GameOptions'][$lang] | ForEach-Object { Write-Host $_ }
    $gameChoice = Read-Host "Select (1-4)"
    while ($gameChoice -notin "1","2","3","4") {
        $gameChoice = Read-Host "Invalid input. Please select 1-4"
    }
    
    # Select region
    Write-Host $messages['SelectRegion'][$lang] -ForegroundColor Green
    $messages['RegionOptions'][$lang] | ForEach-Object { Write-Host $_ }
    $regionChoice = Read-Host "Select (1-2)"
    while ($regionChoice -notin "1","2") {
        $regionChoice = Read-Host "Invalid input. Please select 1 or 2"
    }
    $region = @("global", "china")[$regionChoice - 1]
    
    # Processing
    Write-Host ""
    Write-Host $messages['Processing'][$lang] -ForegroundColor Cyan
    
    # Call appropriate game function
    $url = $null
    switch ($gameChoice) {
        "1" { $url = Get-GenshinImpactUrl -region $region }
        "2" { $url = Get-StarRailUrl -region $region }
        "3" { $url = Get-ZenlessUrl -region $region }
        "4" { $url = Get-WutheringWavesUrl -region $region }
        default {
            Write-Host $messages['GameNotSupported'][$lang] -ForegroundColor Red
            exit
        }
    }
    
    # Handle results
    if ($url) {
        Set-Clipboard -Value $url
        Write-Host ""
        Write-Host $messages['Success'][$lang] -ForegroundColor Green
        Write-Host "URL: $url" -ForegroundColor Cyan
    } else {
        Write-Host ""
        Write-Host $messages['Error'][$lang] -ForegroundColor Red
    }
} catch {
    Write-Host "An unexpected error occurred: $_" -ForegroundColor Red
}

Write-Host ""
Write-Host $messages['PressAnyKey'][$lang]
$null = $Host.UI.RawUI.ReadKey('NoEcho,IncludeKeyDown')
#endregion