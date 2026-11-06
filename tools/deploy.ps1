# Copies the packs from the repo into the Minecraft development pack folders (GDK build, 1.21.120+).
$com = Join-Path $env:APPDATA "Minecraft Bedrock\users\shared\games\com.mojang"
$repo = Split-Path $PSScriptRoot -Parent
foreach ($pair in @(@("foodcraft_bp", "development_behavior_packs"), @("foodcraft_rp", "development_resource_packs"))) {
    $src = Join-Path $repo "packs\$($pair[0])"
    $dst = Join-Path $com "$($pair[1])\$($pair[0])"
    robocopy $src $dst /MIR /NFL /NDL /NJH /NJS | Out-Null
    if ($LASTEXITCODE -ge 8) { throw "robocopy failed for $src" }
    Write-Host "Deployed $src -> $dst"
}
