# 原神活动记录获取脚本 - PowerShell版本
$current_dir = $PSScriptRoot
$ROLE_API_URL = "https://api-takumi.mihoyo.com/binding/api/getUserGameRolesByCookie"
$BASE_URL = "https://api-takumi-record.mihoyo.com/game_record/app/genshin/api/activities"
$mihoyobbs_salt = "idMMaGYmVgPzh3wxmWudUXKUPGidO7GM"
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12

# 随机选择设备品牌
$device_brands = @("Huawei", "Honor", "Vivo", "Xiaomi")
$random = New-Object System.Random
$selected_brand = $device_brands[$random.Next(0, $device_brands.Length)]
Write-Host "随机选择的设备品牌: $selected_brand" -ForegroundColor Cyan

function Get-Timestamp {
    return [int][double]::Parse((Get-Date -UFormat %s))
}

function Get-RandomText {
    param([int]$length)
    $chars = "abcdef0123456789"
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
    "x-rpc-sys_version" = "12"
    "x-rpc-client_type" = "2"
    "User-Agent" = "Mozilla/5.0 (Linux; Android 12; $selected_brand; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/138.0.0.0 Mobile Safari/537.36 miHoYoBBS/2.93.1"
    "Origin" = "https://webstatic.mihoyo.com"
    "X-Requested-With" = "com.mihoyo.hyperion"
    "Sec-Fetch-Site" = "same-site"
    "Sec-Fetch-Mode" = "cors"
    "Sec-Fetch-Dest" = "empty"
    "Referer" = "https://webstatic.mihoyo.com/"
    "x-rpc-device_name" = $selected_brand
    "x-rpc-tool_verison" = "v6.0.9-gr-cn"
}

function Get-Cookie {
    Write-Host "===== 原神活动记录获取脚本 =====" -ForegroundColor White
    Write-Host "注意：请确保您已登录米游社并获取到有效的Cookie" -ForegroundColor Yellow
    Write-Host "您可以在浏览器中打开米游社首页，登录后在开发者工具（F12或右键点击-检查）中的网络工具找到Cookie" -ForegroundColor Yellow
    Write-Host "请输入米游社Cookie字符串:（按 Ctrl - C 退出）" -ForegroundColor Cyan
    
    $cookie = Read-Host "Cookie"
    $cookie = $cookie.Trim()
    
    if ($cookie) {
        return $cookie
    }
    
    Write-Host "错误: Cookie输入为空，无法继续操作" -ForegroundColor Red
    throw "用户未输入Cookie，操作已取消"
}

$global:static_device_id = $null

function Get-DeviceFp {
    # 使用用户提供的固定参数值
    $device_id = Get-RandomText -length 16
    $seed_id = [System.Guid]::NewGuid().ToString().Replace("-", "").Substring(0, 16)
    $seed_time = "1692248006205"
    $platform = "2"
    $device_fp = Get-RandomText -length 13
    $app_name = "bbs_cn"
    # 根据选择的品牌设置对应的设备信息
    $deviceName = switch ($selected_brand) {
        "Huawei" { "Huawei Mate 50 Pro" }
        "Honor" { "Honor Magic5 Pro" }
        "Vivo" { "Vivo X200 Pro" }
        default { "Redmi K90 Pro" }
    }
    
    $brand = switch ($selected_brand) {
        "Xiaomi" { "Redmi" }
        default { $selected_brand }
    }
    
    $ext_fields = @{
        # cpuType = "arm64-v8a"
        # romCapacity = "512"
        # productName = "socrates"
        # romRemain = "441"
        # manufacturer = $selected_brand
        # appMemory = "512"
        # hostname = "pangu-build-component-system-420559-dfs01-2hmw2-8nwzg"
        # screenSize = "1440x3080"
        # osVersion = "12"
        # aaid = "4505b37d-bcf5-4b0e-8308-05e3e2d207c5"
        # vendor = "中国移动"
        # accelerometer = "0.01794617x0.021235404x9.85484"
        # buildTags = "release-keys"
        # model = "22127RK46C"
        # brand = $brand
        oaid = "19cefede97d8cb93"
        # hardware = "qcom"
        # deviceType = "socrates"
        # devId = "REL"
        # serialNumber = $null
        # buildTime = "1737687976000"
        # buildUser = "builder"
        # ramCapacity = "473513"
        # magnetometer = "-139.0125x90.3x-3.5"
        # display = "AQ3A.240912.001"
        # ramRemain = "5511"
        # deviceInfo = "Redmi/socrates/socrates:12/AQ3A.240912.001/OS2.0.102.0.VMKCNXM:user/release-keys"
        # gyroscope = "1.527162E-4x-0.0x-2.290743E-4"
        # vaid = "b5dfc0c66ab354eb"
        # buildType = "user"
        # sdkVersion = "35"
        board = "kalama"
    } | ConvertTo-Json -Depth 20 -Compress
    $bbs_device_id = "2312c98a-d617-3614-8e2b-fad1acf55600"
    
    # 构建请求体
    $request_body = @{
        device_id = $device_id
        seed_id = $seed_id
        seed_time = $seed_time
        platform = $platform
        device_fp = $device_fp
        app_name = $app_name
        ext_fields = $ext_fields
        bbs_device_id = $bbs_device_id
    }
    $request_json = $request_body | ConvertTo-Json -Depth 20
    $fp_headers = @{
        "Content-Type" = "application/json"
        "User-Agent" = "Mozilla/5.0 (Linux; Android 12; $selected_brand; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/138.0.0.0 Mobile Safari/537.36 miHoYoBBS/2.93.1"
    }
    try {
        $response = Invoke-RestMethod -Uri "https://public-data-api.mihoyo.com/device-fp/api/getFp" -Headers $fp_headers -Method Post -Body $request_json
        if ($response.retcode -eq 0 -and $response.data -ne $null -and $response.data.device_fp -ne $null) {
            Write-Host "响应: $($response | ConvertTo-Json -Depth 20)" -ForegroundColor Cyan
            Write-Host "获取设备指纹: $($response.data.device_fp)" -ForegroundColor Green
            return $response.data.device_fp
        } else {
            Write-Host "获取设备指纹失败，使用默认值。响应: $($response | ConvertTo-Json -Depth 20)" -ForegroundColor Yellow
            return $device_fp
        }
    } catch {
        Write-Host "调用设备指纹API时出错: $($_.Exception.Message)，使用默认值" -ForegroundColor Yellow
        return $device_fp
    }
}

function Check-ExistingFile {
    param([string]$uid)
    $desktop_path = [Environment]::GetFolderPath('Desktop')
    $matching_files = Get-ChildItem -Path $desktop_path -Filter "genshin_activities_${uid}_*.json" -ErrorAction SilentlyContinue
    if ($matching_files -and $matching_files.Count -gt 0) {
        $latest_file = $matching_files | Sort-Object LastWriteTime -Descending | Select-Object -First 1
        Write-Host "已在桌面发现账号UID为${uid}的活动记录文件: $($latest_file.Name)" -ForegroundColor Yellow
        # Write-Host "文件最后修改时间: $($latest_file.LastWriteTime)" -ForegroundColor Yellow
        return $true
    }
    return $false
}

function Generate-OutputFilename {
    param([string]$uid)
    $timestamp = Get-Timestamp
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
    if (-not $global:static_device_id) {
        $global:static_device_id = [System.Guid]::NewGuid().ToString().Replace("-", "").Substring(0, 16)
    }
    
    $device_fp = Get-DeviceFp
    $common_headers = $ANDROID_HEADERS.Clone()
    $common_headers["Cookie"] = $cookie
    $common_headers["x-rpc-device_fp"] = $device_fp
    $common_headers["x-rpc-device_id"] = $global:static_device_id
    
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
        
        Write-Host "自动选择原神游戏账号: " -ForegroundColor Green
        Write-Host "角色昵称: $nickname, 角色ID: $game_role_id, 服务器: $server, 等级: $level" -ForegroundColor DarkCyan
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
            
            Write-Host "$($i + 1). 昵称: $nickname, UID: $game_uid, 服务器: $region, 等级: $level" -ForegroundColor DarkCyan
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
            
            # 检查响应的retcode字段
            $response_hash = ConvertTo-Hashtable $response
            $retcode = $response_hash.retcode
            if ($retcode -ne 0 -and $retcode -ne $null) {
                $message = $response_hash.message
                if (-not $message) { $message = "无错误消息" }
                Write-Host "错误: 活动API响应retcode: $retcode, $message" -ForegroundColor Red
                throw "活动API响应错误，操作已取消"
            }

            Write-Host "历史活动数据请求成功！" -ForegroundColor Green
            # 检查桌面上是否已存在对应UID的活动记录文件
            if (Check-ExistingFile -uid $game_role_id) {
                Write-Host "当前已存在对应账号的活动记录文件，将不再保存新文件。" -ForegroundColor Cyan
                Write-Host "如需获取新的活动记录，请删除桌面上现有的genshin_activities_${game_role_id}_*.json文件后重试。" -ForegroundColor Cyan
            } else {
                    $output_file_path = Generate-OutputFilename -uid $game_role_id
                    $response | ConvertTo-Json -Depth 20 -Compress | Out-File -FilePath $output_file_path -Encoding UTF8
                    Write-Host "已保存到桌面上: $output_file_path" -ForegroundColor Green
            }
            Write-Host "请将桌面上的活动数据Json文件上传至网页端进行导入：https://wui.cc/genshin-activities" -ForegroundColor Cyan
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
