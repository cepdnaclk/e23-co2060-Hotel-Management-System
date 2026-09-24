$ErrorActionPreference = "Stop"

Write-Host "TripLanka SET 6 - downloading the 2 missing event images..." -ForegroundColor Cyan

$projectRoot = Get-Location
$eventsDir = Join-Path $projectRoot "client\public\images\events"

New-Item -ItemType Directory -Force -Path $eventsDir | Out-Null

$downloads = @(
    @{
        Name = "Ella Tea Estate Experience"
        Url  = "https://upload.wikimedia.org/wikipedia/commons/1/15/Tea_Plantation%2C_Haputale%2C_Sri_Lanka.jpg"
        Out  = Join-Path $eventsDir "ella-tea-estate-experience.jpg"
    },
    @{
        Name = "Yala Wildlife Evening Talk"
        Url  = "https://upload.wikimedia.org/wikipedia/commons/d/df/An_Elephant_in_Yala_National_Park%2C_Sri_Lanka.jpg"
        Out  = Join-Path $eventsDir "yala-wildlife-evening-talk.jpg"
    }
)

foreach ($item in $downloads) {
    Write-Host ""
    Write-Host ("Downloading: " + $item.Name) -ForegroundColor Yellow

    if (Test-Path $item.Out) {
        Remove-Item $item.Out -Force
    }

    & curl.exe -L --fail --silent --show-error $item.Url -o $item.Out

    if ($LASTEXITCODE -ne 0 -or -not (Test-Path $item.Out)) {
        throw "Download failed: $($item.Name)"
    }

    $size = (Get-Item $item.Out).Length
    if ($size -lt 50000) {
        Remove-Item $item.Out -Force -ErrorAction SilentlyContinue
        throw "Downloaded file is too small and may be invalid: $($item.Name)"
    }

    Write-Host ("OK    " + $item.Out) -ForegroundColor Green
}

Write-Host ""
Write-Host "Both missing event images are ready." -ForegroundColor Green
Write-Host ""
Write-Host "Sources / attribution:" -ForegroundColor Cyan
Write-Host "1) Tea Plantation, Haputale, Sri Lanka - Imantha025 - CC BY-SA 4.0 - Wikimedia Commons"
Write-Host "2) An Elephant in Yala National Park, Sri Lanka - Richard Mortel - CC BY 4.0 - Wikimedia Commons"
