$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $PSScriptRoot
$environmentPath = Join-Path $projectRoot '.env'

Write-Host '============================================================'
Write-Host ' StockFlow Google Maps backend configuration'
Write-Host '============================================================'
Write-Host 'Paste the BACKEND key. Your input is hidden and the key is saved only in the Git-ignored .env file.'

$secureKey = Read-Host 'Google Maps backend key' -AsSecureString
$pointer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secureKey)
try {
    $key = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($pointer).Trim()
} finally {
    [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($pointer)
}

if ($key -notmatch '^AIza[\w-]{20,}$') {
    Write-Host 'ERROR: This does not look like a Google API key beginning with AIza.' -ForegroundColor Red
    exit 1
}

$lines = [System.Collections.Generic.List[string]]::new()
$sourcePath = if (Test-Path -LiteralPath $environmentPath) { $environmentPath } else { $null }
if ($null -ne $sourcePath) {
    Get-Content -LiteralPath $sourcePath | ForEach-Object { $lines.Add($_) | Out-Null }
}

$setting = "GOOGLE_MAPS_BACKEND_API_KEY=$key"
$index = -1
for ($lineIndex = 0; $lineIndex -lt $lines.Count; $lineIndex++) {
    if ($lines[$lineIndex] -match '^\s*GOOGLE_MAPS_BACKEND_API_KEY\s*=') {
        $index = $lineIndex
        break
    }
}
if ($index -ge 0) {
    $lines[$index] = $setting
} else {
    $lines.Add($setting)
}

$utf8WithoutBom = [System.Text.UTF8Encoding]::new($false)
[System.IO.File]::WriteAllLines($environmentPath, $lines, $utf8WithoutBom)
Write-Host ''
Write-Host 'Backend key saved to .env. It will not be committed to Git.' -ForegroundColor Green
Write-Host 'Restart StockFlow with RUN_ALL_WINDOWS.cmd for the key to take effect.' -ForegroundColor Cyan
