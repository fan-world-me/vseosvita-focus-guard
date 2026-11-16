# Vseosvita Focus Guard — build script (Windows / PowerShell)

$root    = $PSScriptRoot
$src     = "$root\src"
$dist    = "$root\dist"
$mfDir   = "$root\manifests"

# Clean dist
if (Test-Path $dist) { Remove-Item $dist -Recurse -Force }

foreach ($browser in @('firefox', 'chrome')) {
    $unpacked = "$dist\$browser-unpacked"
    New-Item -ItemType Directory -Force -Path $unpacked | Out-Null

    # Copy src files
    Copy-Item "$src\*" $unpacked -Recurse -Force

    # Drop in browser-specific manifest
    Copy-Item "$mfDir\$browser\manifest.json" "$unpacked\manifest.json" -Force

    # Pack zip with forward-slash paths
    $zipPath = "$dist\vseosvita-focus-guard-$browser.zip"
    if (Test-Path $zipPath) { Remove-Item $zipPath -Force }
    $files = Get-ChildItem $unpacked -File
    Add-Type -AssemblyName System.IO.Compression.FileSystem
    $zip = [System.IO.Compression.ZipFile]::Open($zipPath, 'Create')
    foreach ($f in $files) {
        [System.IO.Compression.ZipFileExtensions]::CreateEntryFromFile(
            $zip, $f.FullName, $f.Name,
            [System.IO.Compression.CompressionLevel]::Optimal
        ) | Out-Null
    }
    $zip.Dispose()

    Write-Host "[OK] $browser -> $zipPath"
}

# Firefox .xpi = copy of the zip
$ffZip = "$dist\vseosvita-focus-guard-firefox.zip"
$ffXpi = "$dist\vseosvita-focus-guard-firefox.xpi"
Copy-Item $ffZip $ffXpi -Force
Write-Host "[OK] xpi  -> $ffXpi"

Write-Host ""
Write-Host "dist/"
Get-ChildItem $dist | ForEach-Object { Write-Host "  $($_.Name)" }
