# 原神活动记录获取脚本 - PowerShell版本
$current_dir = $PSScriptRoot
$ROLE_API_URL = "https://api-takumi.mihoyo.com/binding/api/getUserGameRolesByCookie"
$BASE_URL = "https://api-takumi-record.mihoyo.com/game_record/app/genshin/api/activities"
$mihoyobbs_salt = "idMMaGYmVgPzh3wxmWudUXKUPGidO7GM"
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12

function Get-Timestamp {
    return [int][double]::Parse((Get-Date -UFormat %s))
}

function Get-RandomText {
    param([int]$length)
    $chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
    $random = New-Object System.Random
    return -join ($chars.ToCharArray() | Get-Random -Count $length)
}

function Get-DS {
    $n = $mihoyobbs_salt
    $i = (Get-Timestamp).ToString()
    $r = Get-RandomText -length 6
    $string = "salt=$n&t=$i&r=$r"
    $md5 = New-Object -TypeName System.Security.Cryptography.MD5CryptoServiceProvider
    $utf8 = New-Object -TypeName System.Text.UTF8Encoding
    $hash = [System.BitConverter]::ToString($md5.ComputeHash($utf8.GetBytes($string)))
    $c = $hash.Replace("-", "").ToLower()
    return "$i,$r,$c"
}

$ANDROID_HEADERS = @{
    "sec-ch-ua-platform" = '"Android"'
    "x-rpc-app_version" = "2.93.1"
    "sec-ch-ua-mobile" = "?1"
    "x-rpc-sys_version" = "15"
    "x-rpc-client_type" = "2"
    "User-Agent" = "Mozilla/5.0 (Linux; Android 15; Xiaomi; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/138.0.0.0 Mobile Safari/537.36 miHoYoBBS/2.93.1"
    "Origin" = "https://webstatic.mihoyo.com"
    "X-Requested-With" = "com.mihoyo.hyperion"
    "Sec-Fetch-Site" = "same-site"
    "Sec-Fetch-Mode" = "cors"
    "Sec-Fetch-Dest" = "empty"
    "Referer" = "https://webstatic.mihoyo.com/"
    "x-rpc-device_name" = "Xiaomi"
    "x-rpc-tool_verison" = "v6.0.9-gr-cn"
}

function Get-Cookie {
    Write-Host "===== 原神活动记录获取脚本 =====" -ForegroundColor Green
    Write-Host "注意：请确保您已登录米游社并获取到有效的Cookie" -ForegroundColor Yellow
    Write-Host "您可以在浏览器中打开米游社首页，登录后在开发者工具（F12或右键点击-检查）中找到Cookie" -ForegroundColor Yellow
    Write-Host "请输入米游社Cookie字符串:" -ForegroundColor Cyan
    
    $cookie = Read-Host "Cookie"
    $cookie = $cookie.Trim()
    
    if ($cookie) {
        return $cookie
    }
    
    Write-Host "错误: Cookie输入为空，无法继续操作" -ForegroundColor Red
    throw "用户未输入Cookie，操作已取消"
}

function Get-DeviceFp {
    return "38d7ef28c949d"
}

function Generate-OutputFilename {
    param([string]$uid)
    $timestamp = Get-Timestamp
    # 获取用户桌面路径
    $desktop_path = [Environment]::GetFolderPath('Desktop')
    return Join-Path $desktop_path "genshin_activities_${uid}_${timestamp}.json"
}

function Get-UserGameRoles {
    param([hashtable]$headers)
    
    try {
        $response = Invoke-RestMethod -Uri $ROLE_API_URL -Headers $headers -Method Get
        return $response
    } catch {
        Write-Host "获取游戏角色时出错: $($_.Exception.Message)" -ForegroundColor Red
        return $null
    }
}

function ConvertTo-Hashtable {
    param($InputObject)
    
    if ($InputObject -eq $null) { return @{} }
    if ($InputObject -is [hashtable]) { return $InputObject }
    if ($InputObject -is [pscustomobject]) {
        $hash = @{}
        $InputObject.PSObject.Properties | ForEach-Object { $hash[$_.Name] = $_.Value }
        return $hash
    }
    return @{}
}

try {
    $cookie = Get-Cookie
    
    $device_fp = Get-DeviceFp
    $common_headers = $ANDROID_HEADERS.Clone()
    $common_headers["Cookie"] = $cookie
    $common_headers["x-rpc-device_fp"] = $device_fp
    $common_headers["x-rpc-device_id"] = [System.Guid]::NewGuid().ToString()
    
    # 第一步：调用角色获取API
    $role_response = Get-UserGameRoles -headers $common_headers
    if (-not $role_response) {
        Write-Host "获取游戏角色失败" -ForegroundColor Red
        throw "获取游戏角色失败，操作已取消"
    }
    
    $role_response_hash = ConvertTo-Hashtable $role_response
    $retcode = $role_response_hash.retcode
    if ($retcode -ne 0 -and $retcode -ne $null) {
        $message = $role_response_hash.message
        if (-not $message) { $message = "未知错误" }
        Write-Host "错误: 角色获取API响应retcode不为0: $message" -ForegroundColor Red
        throw "角色获取API错误: $message，操作已取消"
    }
    
    $data = ConvertTo-Hashtable $role_response_hash.data
    $role_list = @()
    if ($data.list -ne $null) {
        $role_list = $data.list
    }
    
    # 筛选出game_biz包含hk4e的游戏账号
    $genshin_roles = @()
    foreach ($role in $role_list) {
        $role_hash = ConvertTo-Hashtable $role
        $game_biz = $role_hash.game_biz
        if ($game_biz -and $game_biz.Contains("hk4e")) {
            $genshin_roles += $role_hash
        }
    }
    
    if ($genshin_roles.Count -eq 0) {
        Write-Host "未找到原神游戏账号，请检查Cookie是否正确" -ForegroundColor Red
        throw "未找到原神游戏账号，操作已取消"
    }
    
    # 根据角色数量决定是否需要用户选择
    $game_role_id = $null
    $server = $null
    
    if ($genshin_roles.Count -eq 1) {
        # 只有一个账号，自动选择
        $role = $genshin_roles[0]
        $game_role_id = $role.game_uid
        $server = $role.region
        $nickname = $role.nickname
        if (-not $nickname) { $nickname = "未知昵称" }
        $level = $role.level
        if (-not $level) { $level = 0 }
        
        Write-Host "自动选择游戏账号:" -ForegroundColor Green
        Write-Host "- 角色昵称: $nickname"
        Write-Host "- 角色ID: $game_role_id"
        Write-Host "- 服务器: $server"
        Write-Host "- 等级: $level"
    } else {
        # 多个账号，让用户选择
        Write-Host "`n发现多个原神游戏账号，请选择要查询的账号:" -ForegroundColor Cyan
        for ($i = 0; $i -lt $genshin_roles.Count; $i++) {
            $role = $genshin_roles[$i]
            $nickname = $role.nickname
            if (-not $nickname) { $nickname = "未知昵称" }
            $game_uid = $role.game_uid
            $region = $role.region
            $level = $role.level
            if (-not $level) { $level = 0 }
            
            Write-Host "$($i + 1). 昵称: $nickname, UID: $game_uid, 服务器: $region, 等级: $level"
        }
        
        # 获取用户输入
        while ($true) {
            $choice = Read-Host "请输入账号序号"
            $choice = $choice.Trim()
            try {
                $choice_index = [int]$choice - 1
                if ($choice_index -ge 0 -and $choice_index -lt $genshin_roles.Count) {
                    $selected_role = $genshin_roles[$choice_index]
                    $game_role_id = $selected_role.game_uid
                    $server = $selected_role.region
                    Write-Host "`n已选择账号: $($selected_role.nickname), UID: $game_role_id" -ForegroundColor Green
                    break
                } else {
                    Write-Host "输入的序号无效，请重新输入" -ForegroundColor Red
                }
            } catch {
                Write-Host "请输入有效的数字序号" -ForegroundColor Red
            }
        }
    }
    
    if (-not $game_role_id) {
        Write-Host "无法获取有效的游戏角色ID，程序退出" -ForegroundColor Red
        throw "无法获取有效的游戏角色ID，操作已取消"
    }
    
    # 第二步：使用获取到的role_id调用活动记录API
    $act_headers = $common_headers.Clone()
    $act_headers["DS"] = Get-DS
    
    $url = "${BASE_URL}?server=${server}&role_id=${game_role_id}"
    
    try {
        $response = Invoke-RestMethod -Uri $url -Headers $act_headers -Method Get
        
        $output_file_path = Generate-OutputFilename -uid $game_role_id
        $response | ConvertTo-Json -Depth 20 -Compress | Out-File -FilePath $output_file_path -Encoding UTF8
        
        Write-Host "历史活动数据请求成功！已保存到桌面上: $output_file_path" -ForegroundColor Green
    } catch {
        Write-Host "请求活动记录API时出错: $($_.Exception.Message)" -ForegroundColor Red
        if ($_.Exception.Response -ne $null) {
            Write-Host "HTTP状态码: $($_.Exception.Response.StatusCode.value__)" -ForegroundColor Red
        }
    }
    Write-Host "`n按任意键退出..." -ForegroundColor Gray
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
} catch {
    Write-Host "发生错误: $($_.Exception.Message)" -ForegroundColor Red
    # Write-Host "堆栈跟踪: $($_.ScriptStackTrace)" -ForegroundColor Red
}
