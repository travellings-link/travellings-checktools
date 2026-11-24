[CmdletBinding()]
param(
    [string]$BackendDir = 'C:\Users\YanMo\IdeaProjects\travellings-checktools-backend',
    [ValidateRange(1, 65535)]
    [int]$BackendPort = 8080,
    [ValidateRange(1, 65535)]
    [int]$FrontendPort = 5174,
    [switch]$Check
)

$ErrorActionPreference = 'Stop'
$FrontendDir = Split-Path -Parent $PSScriptRoot
$BackendDir = [System.IO.Path]::GetFullPath($BackendDir)
$BackendRunner = Join-Path $BackendDir 'scripts\run-local-h2.ps1'
$BackendProcess = $null
$FrontendProcess = $null

function Assert-Command {
    param([Parameter(Mandatory)][string]$Name)
    if (-not (Get-Command $Name -ErrorAction SilentlyContinue)) {
        throw "Required command is not available: $Name"
    }
}

function Stop-ProcessTree {
    param([System.Diagnostics.Process]$Process)
    if (-not $Process) { return }
    try { $Process.Refresh() } catch { return }
    if ($Process.HasExited) { return }
    & taskkill.exe /PID $Process.Id /T /F 2>$null | Out-Null
}

Assert-Command npm.cmd
Assert-Command curl.exe
Assert-Command taskkill.exe

if ($BackendPort -eq $FrontendPort) {
    throw 'BackendPort and FrontendPort must differ.'
}
if (-not (Test-Path -LiteralPath $BackendDir -PathType Container)) {
    throw "Backend directory not found: $BackendDir"
}
if (-not (Test-Path -LiteralPath $BackendRunner -PathType Leaf)) {
    throw "Backend H2 runner not found: $BackendRunner"
}
if (-not (Test-Path -LiteralPath (Join-Path $BackendDir 'gradlew.bat') -PathType Leaf)) {
    throw "Gradle wrapper not found in: $BackendDir"
}
if (-not (Test-Path -LiteralPath (Join-Path $FrontendDir 'package.json') -PathType Leaf)) {
    throw "Frontend package.json not found in: $FrontendDir"
}

$PowerShellExecutable = if (Get-Command pwsh.exe -ErrorAction SilentlyContinue) {
    (Get-Command pwsh.exe).Source
} else {
    (Get-Command powershell.exe -ErrorAction Stop).Source
}

if ($Check) {
    Write-Host 'Prerequisites OK' -ForegroundColor Green
    Write-Host "  frontend: $FrontendDir"
    Write-Host "  backend:  $BackendDir"
    Write-Host "  backend URL: http://localhost:$BackendPort"
    Write-Host "  frontend URL: http://localhost:$FrontendPort"
    exit 0
}

$BackendUrl = "http://127.0.0.1:$BackendPort"
$FrontendUrl = "http://localhost:$FrontendPort"
$SavedEnvironment = @{
    FRONTEND_URL = $env:FRONTEND_URL
    CORS_ORIGINS = $env:CORS_ORIGINS
    GITHUB_REDIRECT_URI = $env:GITHUB_REDIRECT_URI
    DEV_API_TARGET = $env:DEV_API_TARGET
    DEV_TRAVELLINGS_API_TARGET = $env:DEV_TRAVELLINGS_API_TARGET
}

try {
    Write-Host "[1/3] Starting backend with H2 on http://localhost:$BackendPort" -ForegroundColor Cyan
    $env:FRONTEND_URL = $FrontendUrl
    $env:CORS_ORIGINS = "$FrontendUrl,http://127.0.0.1:$FrontendPort"
    $env:GITHUB_REDIRECT_URI = "http://localhost:$BackendPort/auth/github/callback"
    $BackendProcess = Start-Process -FilePath $PowerShellExecutable -ArgumentList @(
        '-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', $BackendRunner, '-Port', $BackendPort
    ) -WorkingDirectory $BackendDir -PassThru -NoNewWindow

    $BackendReady = $false
    for ($Attempt = 1; $Attempt -le 120; $Attempt++) {
        $BackendProcess.Refresh()
        if ($BackendProcess.HasExited) {
            throw "Backend exited before becoming ready (exit code $($BackendProcess.ExitCode))."
        }
        try {
            $Response = Invoke-WebRequest "$BackendUrl/auth/me" -SkipHttpErrorCheck -TimeoutSec 2
            if ($Response.StatusCode -in 200, 401, 403) {
                $BackendReady = $true
                break
            }
        } catch {
            # The backend is still starting.
        }
        Start-Sleep -Seconds 1
    }
    if (-not $BackendReady) {
        throw 'Backend did not become ready within 120 seconds.'
    }

    Write-Host '[2/3] Backend is ready' -ForegroundColor Green
    Write-Host "[3/3] Starting frontend on $FrontendUrl" -ForegroundColor Cyan
    $env:DEV_API_TARGET = $BackendUrl
    if (-not $env:DEV_TRAVELLINGS_API_TARGET) {
        $env:DEV_TRAVELLINGS_API_TARGET = 'https://api.travellings.cn'
    }
    $FrontendProcess = Start-Process -FilePath (Get-Command npm.cmd).Source -ArgumentList @(
        'run', 'dev', '--', '--host', 'localhost', '--port', $FrontendPort
    ) -WorkingDirectory $FrontendDir -PassThru -NoNewWindow

    Write-Host ''
    Write-Host 'Local development is running:' -ForegroundColor Green
    Write-Host "  frontend: $FrontendUrl"
    Write-Host "  backend:  http://localhost:$BackendPort"
    Write-Host 'Press Ctrl+C to stop both.'

    $FrontendProcess.WaitForExit()
    if ($FrontendProcess.ExitCode -ne 0) {
        throw "Frontend exited with code $($FrontendProcess.ExitCode)."
    }
} finally {
    Write-Host ''
    Write-Host 'Stopping local services...' -ForegroundColor Yellow
    Stop-ProcessTree $FrontendProcess
    Stop-ProcessTree $BackendProcess
    foreach ($Name in $SavedEnvironment.Keys) {
        Set-Item -Path "Env:$Name" -Value $SavedEnvironment[$Name] -ErrorAction SilentlyContinue
        if ($null -eq $SavedEnvironment[$Name]) {
            Remove-Item -Path "Env:$Name" -ErrorAction SilentlyContinue
        }
    }
}
