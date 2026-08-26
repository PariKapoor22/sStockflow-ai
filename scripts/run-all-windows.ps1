param(
    [switch]$CheckOnly
)

$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $PSScriptRoot
$runId = Get-Date -Format 'yyyyMMdd-HHmmss'
$logDirectory = Join-Path $projectRoot ".stockflow\logs\$runId"
$ownedProcesses = [System.Collections.Generic.List[System.Diagnostics.Process]]::new()

function Write-Step([string]$Message) {
    Write-Host "[$(Get-Date -Format 'HH:mm:ss')] $Message" -ForegroundColor Cyan
}

function Test-LocalPort([int]$Port) {
    foreach ($address in @('127.0.0.1', '::1')) {
        $addressFamily = if ($address -eq '::1') {
            [System.Net.Sockets.AddressFamily]::InterNetworkV6
        } else {
            [System.Net.Sockets.AddressFamily]::InterNetwork
        }
        $client = [System.Net.Sockets.TcpClient]::new($addressFamily)
        try {
            $result = $client.BeginConnect($address, $Port, $null, $null)
            if ($result.AsyncWaitHandle.WaitOne(300)) {
                $client.EndConnect($result)
                return $true
            }
        } catch {
            # Try the other localhost address family.
        } finally {
            $client.Dispose()
        }
    }
    return $false
}

function Wait-ForUrl([string]$Name, [string]$Url, [int]$TimeoutSeconds) {
    $deadline = (Get-Date).AddSeconds($TimeoutSeconds)
    while ((Get-Date) -lt $deadline) {
        $stoppedProcess = $ownedProcesses | Where-Object { $_.HasExited } | Select-Object -First 1
        if ($null -ne $stoppedProcess) {
            throw "$Name could not start because process $($stoppedProcess.Id) exited with code $($stoppedProcess.ExitCode)."
        }
        try {
            $response = Invoke-WebRequest -UseBasicParsing -Uri $Url -TimeoutSec 4
            if ($response.StatusCode -ge 200 -and $response.StatusCode -lt 500) {
                Write-Host "  READY  $Name" -ForegroundColor Green
                return
            }
        } catch {
            Start-Sleep -Seconds 2
        }
    }
    throw "$Name did not become ready within $TimeoutSeconds seconds."
}

function Wait-ForPort([string]$Name, [int]$Port, [int]$TimeoutSeconds) {
    $deadline = (Get-Date).AddSeconds($TimeoutSeconds)
    while ((Get-Date) -lt $deadline) {
        $stoppedProcess = $ownedProcesses | Where-Object { $_.HasExited } | Select-Object -First 1
        if ($null -ne $stoppedProcess) {
            throw "$Name could not start because process $($stoppedProcess.Id) exited with code $($stoppedProcess.ExitCode)."
        }
        if (Test-LocalPort $Port) {
            Write-Host "  READY  $Name" -ForegroundColor Green
            return
        }
        Start-Sleep -Seconds 2
    }
    throw "$Name did not listen on port $Port within $TimeoutSeconds seconds."
}

function Show-LogTail([string]$ServiceName) {
    foreach ($suffix in @('out', 'err')) {
        $path = Join-Path $logDirectory "$ServiceName.$suffix.log"
        if (Test-Path -LiteralPath $path) {
            Write-Host "`nLast lines from $path" -ForegroundColor Yellow
            Get-Content -LiteralPath $path -Tail 25
        }
    }
}

function Start-StockFlowService(
    [string]$Name,
    [string]$ScriptName,
    [int]$Port,
    [string]$EnvironmentPrefix = ''
) {
    if (Test-LocalPort $Port) {
        Write-Host "  REUSE  $Name is already listening on port $Port" -ForegroundColor Yellow
        return $null
    }

    $scriptPath = Join-Path $projectRoot $ScriptName
    $stdoutPath = Join-Path $logDirectory "$Name.out.log"
    $stderrPath = Join-Path $logDirectory "$Name.err.log"
    Set-Content -LiteralPath $stdoutPath -Value ''
    Set-Content -LiteralPath $stderrPath -Value ''

    $command = if ([string]::IsNullOrWhiteSpace($EnvironmentPrefix)) {
        "call `"$scriptPath`""
    } else {
        "$EnvironmentPrefix && call `"$scriptPath`""
    }

    $process = Start-Process -FilePath $env:ComSpec `
        -ArgumentList @('/d', '/c', $command) `
        -WorkingDirectory $projectRoot `
        -WindowStyle Hidden `
        -RedirectStandardOutput $stdoutPath `
        -RedirectStandardError $stderrPath `
        -PassThru
    $ownedProcesses.Add($process)
    Write-Host "  START  $Name (PID $($process.Id))" -ForegroundColor DarkCyan
    return $process
}

function Stop-OwnedProcesses {
    if ($ownedProcesses.Count -eq 0) { return }
    Write-Step 'Stopping services started by this launcher...'
    for ($index = $ownedProcesses.Count - 1; $index -ge 0; $index--) {
        $process = $ownedProcesses[$index]
        if (-not $process.HasExited) {
            try {
                & taskkill.exe /PID $process.Id /T /F *> $null
            } catch {
                Write-Host "  WARN   Could not stop PID $($process.Id): $($_.Exception.Message)" -ForegroundColor Yellow
            }
        }
    }
}

try {
    Write-Host '============================================================'
    Write-Host ' StockFlow AI - single-window launcher'
    Write-Host '============================================================'

    $requiredScripts = @(
        'run-forecasting-windows.cmd',
        'run-optimisation-windows.cmd',
        'run-core-api-windows.cmd',
        'run-web-windows.cmd'
    )
    foreach ($script in $requiredScripts) {
        if (-not (Test-Path -LiteralPath (Join-Path $projectRoot $script))) {
            throw "Required launcher is missing: $script"
        }
    }
    foreach ($command in @('uv', 'java', 'node', 'npm')) {
        if (-not (Get-Command $command -ErrorAction SilentlyContinue)) {
            throw "Required command is not available on PATH: $command"
        }
    }

    if ($CheckOnly) {
        Write-Host 'Launcher validation passed.' -ForegroundColor Green
        exit 0
    }

    New-Item -ItemType Directory -Path $logDirectory -Force | Out-Null

    Write-Step 'Starting Python intelligence services...'
    Start-StockFlowService 'forecasting' 'run-forecasting-windows.cmd' 8101 | Out-Null
    Start-StockFlowService 'optimisation' 'run-optimisation-windows.cmd' 8102 | Out-Null
    Wait-ForUrl 'StatsForecast service' 'http://127.0.0.1:8101/health' 180
    Wait-ForUrl 'Optimisation service' 'http://127.0.0.1:8102/health' 180

    Write-Step 'Starting the Spring Boot API (startup tests skipped; use the individual launcher to test)...'
    Start-StockFlowService 'core-api' 'run-core-api-windows.cmd' 8080 'set "STOCKFLOW_SKIP_TESTS=true" && set "STOCKFLOW_DECISION_INTELLIGENCE_ENABLED=true"' | Out-Null
    Wait-ForUrl 'Core API' 'http://127.0.0.1:8080/actuator/health/liveness' 300

    Write-Step 'Starting the Angular website...'
    Start-StockFlowService 'web' 'run-web-windows.cmd' 4200 | Out-Null
    Wait-ForPort 'StockFlow website' 4200 180

    Write-Host ''
    Write-Host 'StockFlow is ready: http://localhost:4200' -ForegroundColor Green
    Write-Host "Logs: $logDirectory"
    Write-Host 'Keep this window open. Press Ctrl+C once to stop all services started here.'

    while ($true) {
        foreach ($process in $ownedProcesses) {
            if ($process.HasExited -and $process.ExitCode -ne 0) {
                throw "A StockFlow service exited unexpectedly with code $($process.ExitCode)."
            }
        }
        Start-Sleep -Seconds 2
    }
} catch {
    Write-Host "`nERROR: $($_.Exception.Message)" -ForegroundColor Red
    foreach ($name in @('forecasting', 'optimisation', 'core-api', 'web')) {
        Show-LogTail $name
    }
    exit 1
} finally {
    Stop-OwnedProcesses
}
