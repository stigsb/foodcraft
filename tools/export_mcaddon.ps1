# Bundles both packs into dist/foodcraft-vX.Y.Z.mcaddon (a zip with the two pack folders at its root),
# named after the pack version so builds of different versions can be told apart and kept side by side.
# Builds the zip by hand: Compress-Archive in Windows PowerShell 5.1 writes "\" in entry names,
# which Minecraft can fail to import. Zip entry names must use "/".
Add-Type -AssemblyName System.IO.Compression, System.IO.Compression.FileSystem
$repo = Split-Path $PSScriptRoot -Parent
$dist = Join-Path $repo "dist"
New-Item -ItemType Directory -Force -Path $dist | Out-Null
$manifest = Get-Content -Raw (Join-Path $repo "packs\foodcraft_bp\manifest.json") | ConvertFrom-Json
$version = ($manifest.header.version | ForEach-Object { $_ }) -join "."
$out = Join-Path $dist "foodcraft-v$version.mcaddon"
Remove-Item -Force -ErrorAction SilentlyContinue $out
$zip = [System.IO.Compression.ZipFile]::Open($out, [System.IO.Compression.ZipArchiveMode]::Create)
try {
    foreach ($pack in @("foodcraft_bp", "foodcraft_rp")) {
        $root = Join-Path $repo "packs"
        Get-ChildItem -Recurse -File (Join-Path $root $pack) | ForEach-Object {
            $name = $_.FullName.Substring($root.Length + 1).Replace("\", "/")
            [System.IO.Compression.ZipFileExtensions]::CreateEntryFromFile($zip, $_.FullName, $name) | Out-Null
        }
    }
} finally {
    $zip.Dispose()
}
Write-Host "Wrote $out"
