$ErrorActionPreference = 'Stop'
$repoRoot = (Get-Location).Path
$publicRoot = Join-Path $repoRoot 'client\public'

Write-Host 'TripLanka SET 6 - downloading permanent local images...' -ForegroundColor Cyan

$items = @(
    @{ Url = 'https://images.unsplash.com/photo-1596394516093-501ba68a0ba6?auto=format&fit=crop&w=500&q=80'; Path = 'images\hotels\kandy-lake-hotel\logo.jpg' },
    @{ Url = 'https://images.unsplash.com/photo-1564501049412-61c2a3083791?auto=format&fit=crop&w=500&q=80'; Path = 'images\hotels\colombo-city-stay\logo.jpg' },
    @{ Url = 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=500&q=80'; Path = 'images\hotels\ella-mountain-view-resort\logo.jpg' },
    @{ Url = 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80'; Path = 'images\hotels\kandy-lake-hotel\property-01.jpg' },
    @{ Url = 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=1200&q=80'; Path = 'images\hotels\kandy-lake-hotel\property-02.jpg' },
    @{ Url = 'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?auto=format&fit=crop&w=1200&q=80'; Path = 'images\hotels\colombo-city-stay\property-01.jpg' },
    @{ Url = 'https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=1200&q=80'; Path = 'images\hotels\ella-mountain-view-resort\property-01.jpg' },
    @{ Url = 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?auto=format&fit=crop&w=1000&q=80'; Path = 'images\rooms\kandy-lake-hotel\deluxe-room.jpg' },
    @{ Url = 'https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&w=1000&q=80'; Path = 'images\rooms\kandy-lake-hotel\family-room.jpg' },
    @{ Url = 'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=1000&q=80'; Path = 'images\rooms\kandy-lake-hotel\lake-view-suite.jpg' },
    @{ Url = 'https://images.unsplash.com/photo-1598928506311-c55ded91a20c?auto=format&fit=crop&w=1000&q=80'; Path = 'images\rooms\colombo-city-stay\standard-room.jpg' },
    @{ Url = 'https://images.unsplash.com/photo-1566665797739-1674de7a421a?auto=format&fit=crop&w=1000&q=80'; Path = 'images\rooms\colombo-city-stay\business-room.jpg' },
    @{ Url = 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1000&q=80'; Path = 'images\rooms\ella-mountain-view-resort\mountain-cabin.jpg' },
    @{ Url = 'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=1000&q=80'; Path = 'images\rooms\ella-mountain-view-resort\family-mountain-villa.jpg' },
    @{ Url = 'https://images.pexels.com/photos/34128244/pexels-photo-34128244.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200'; Path = 'images\destinations\sigiriya-rock-fortress\main.jpg' },
    @{ Url = 'https://images.pexels.com/photos/38253196/pexels-photo-38253196.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200'; Path = 'images\destinations\temple-of-the-sacred-tooth-relic\main.jpg' },
    @{ Url = 'https://images.pexels.com/photos/4769075/pexels-photo-4769075.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200'; Path = 'images\destinations\nine-arch-bridge\main.jpg' },
    @{ Url = 'https://images.pexels.com/photos/32574422/pexels-photo-32574422.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200'; Path = 'images\destinations\mirissa-beach-and-whale-watching\main.jpg' },
    @{ Url = 'https://images.pexels.com/photos/27669342/pexels-photo-27669342.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200'; Path = 'images\destinations\galle-fort\main.jpg' },
    @{ Url = 'https://images.pexels.com/photos/10607669/pexels-photo-10607669.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200'; Path = 'images\destinations\yala-national-park\main.jpg' },
    @{ Url = 'https://images.pexels.com/photos/321570/pexels-photo-321570.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200'; Path = 'images\destinations\nuwara-eliya-tea-plantations\main.jpg' },
    @{ Url = 'https://images.pexels.com/photos/35598970/pexels-photo-35598970.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200'; Path = 'images\destinations\dambulla-cave-temple\main.jpg' },
    @{ Url = 'https://images.pexels.com/photos/10850861/pexels-photo-10850861.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200'; Path = 'images\destinations\trincomalee-beaches\main.jpg' },
    @{ Url = 'https://images.pexels.com/photos/19287633/pexels-photo-19287633.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200'; Path = 'images\destinations\adams-peak\main.jpg' },
    @{ Url = 'https://images.pexels.com/photos/34128244/pexels-photo-34128244.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200'; Path = 'images\destinations\sigiriya-rock-fortress\gallery-01.jpg' },
    @{ Url = 'https://images.pexels.com/photos/34128249/pexels-photo-34128249.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200'; Path = 'images\destinations\sigiriya-rock-fortress\gallery-02.jpg' },
    @{ Url = 'https://images.pexels.com/photos/12205267/pexels-photo-12205267.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200'; Path = 'images\destinations\sigiriya-rock-fortress\gallery-03.jpg' },
    @{ Url = 'https://images.pexels.com/photos/38253196/pexels-photo-38253196.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200'; Path = 'images\destinations\temple-of-the-sacred-tooth-relic\gallery-01.jpg' },
    @{ Url = 'https://images.pexels.com/photos/739409/pexels-photo-739409.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200'; Path = 'images\destinations\temple-of-the-sacred-tooth-relic\gallery-02.jpg' },
    @{ Url = 'https://images.pexels.com/photos/27907342/pexels-photo-27907342.png?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200'; Path = 'images\destinations\temple-of-the-sacred-tooth-relic\gallery-03.png' },
    @{ Url = 'https://images.pexels.com/photos/4769075/pexels-photo-4769075.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200'; Path = 'images\destinations\nine-arch-bridge\gallery-01.jpg' },
    @{ Url = 'https://images.pexels.com/photos/2403209/pexels-photo-2403209.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200'; Path = 'images\destinations\nine-arch-bridge\gallery-02.jpg' },
    @{ Url = 'https://images.pexels.com/photos/18498686/pexels-photo-18498686.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200'; Path = 'images\destinations\nine-arch-bridge\gallery-03.jpg' },
    @{ Url = 'https://images.pexels.com/photos/32574422/pexels-photo-32574422.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200'; Path = 'images\destinations\mirissa-beach-and-whale-watching\gallery-01.jpg' },
    @{ Url = 'https://images.pexels.com/photos/5675024/pexels-photo-5675024.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200'; Path = 'images\destinations\mirissa-beach-and-whale-watching\gallery-02.jpg' },
    @{ Url = 'https://images.pexels.com/photos/4351425/pexels-photo-4351425.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200'; Path = 'images\destinations\mirissa-beach-and-whale-watching\gallery-03.jpg' },
    @{ Url = 'https://images.pexels.com/photos/27669342/pexels-photo-27669342.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200'; Path = 'images\destinations\galle-fort\gallery-01.jpg' },
    @{ Url = 'https://images.pexels.com/photos/27669335/pexels-photo-27669335.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200'; Path = 'images\destinations\galle-fort\gallery-02.jpg' },
    @{ Url = 'https://images.pexels.com/photos/27669334/pexels-photo-27669334.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200'; Path = 'images\destinations\galle-fort\gallery-03.jpg' },
    @{ Url = 'https://images.pexels.com/photos/10607669/pexels-photo-10607669.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200'; Path = 'images\destinations\yala-national-park\gallery-01.jpg' },
    @{ Url = 'https://images.pexels.com/photos/17281950/pexels-photo-17281950.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200'; Path = 'images\destinations\yala-national-park\gallery-02.jpg' },
    @{ Url = 'https://images.pexels.com/photos/15232521/pexels-photo-15232521.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200'; Path = 'images\destinations\yala-national-park\gallery-03.jpg' },
    @{ Url = 'https://images.pexels.com/photos/321570/pexels-photo-321570.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200'; Path = 'images\destinations\nuwara-eliya-tea-plantations\gallery-01.jpg' },
    @{ Url = 'https://images.pexels.com/photos/19287633/pexels-photo-19287633.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200'; Path = 'images\destinations\nuwara-eliya-tea-plantations\gallery-02.jpg' },
    @{ Url = 'https://images.pexels.com/photos/36847090/pexels-photo-36847090.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200'; Path = 'images\destinations\nuwara-eliya-tea-plantations\gallery-03.jpg' },
    @{ Url = 'https://images.pexels.com/photos/35598970/pexels-photo-35598970.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200'; Path = 'images\destinations\dambulla-cave-temple\gallery-01.jpg' },
    @{ Url = 'https://images.pexels.com/photos/32547985/pexels-photo-32547985.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200'; Path = 'images\destinations\dambulla-cave-temple\gallery-02.jpg' },
    @{ Url = 'https://images.pexels.com/photos/32547976/pexels-photo-32547976.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200'; Path = 'images\destinations\dambulla-cave-temple\gallery-03.jpg' },
    @{ Url = 'https://images.pexels.com/photos/10850861/pexels-photo-10850861.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200'; Path = 'images\destinations\trincomalee-beaches\gallery-01.jpg' },
    @{ Url = 'https://images.pexels.com/photos/10850860/pexels-photo-10850860.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200'; Path = 'images\destinations\trincomalee-beaches\gallery-02.jpg' },
    @{ Url = 'https://images.pexels.com/photos/10850855/pexels-photo-10850855.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200'; Path = 'images\destinations\trincomalee-beaches\gallery-03.jpg' },
    @{ Url = 'https://images.pexels.com/photos/19287633/pexels-photo-19287633.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200'; Path = 'images\destinations\adams-peak\gallery-01.jpg' },
    @{ Url = 'https://images.pexels.com/photos/321570/pexels-photo-321570.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200'; Path = 'images\destinations\adams-peak\gallery-02.jpg' },
    @{ Url = 'https://images.pexels.com/photos/36847090/pexels-photo-36847090.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200'; Path = 'images\destinations\adams-peak\gallery-03.jpg' },
    @{ Url = 'https://images.pexels.com/photos/38253196/pexels-photo-38253196.jpeg?auto=compress&cs=tinysrgb&fit=crop&w=1400&q=85'; Path = 'images\events\kandy-cultural-dance-night.jpg' },
    @{ Url = 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?auto=format&fit=crop&w=1400&q=85'; Path = 'images\events\colombo-street-food-walk.jpg' },
    @{ Url = 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1400&q=85'; Path = 'images\events\mirissa-sunset-beach-music.jpg' },
    @{ Url = 'https://images.unsplash.com/photo-1567515275959-4421b83c7056?auto=format&fit=crop&w=1400&q=85'; Path = 'images\events\ella-tea-estate-experience.jpg' },
    @{ Url = 'https://images.unsplash.com/photo-1586611292717-f828b167408c?auto=format&fit=crop&w=1400&q=85'; Path = 'images\events\galle-fort-heritage-evening.jpg' },
    @{ Url = 'https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?auto=format&fit=crop&w=1400&q=85'; Path = 'images\events\sigiriya-village-food-experience.jpg' },
    @{ Url = 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1400&q=85'; Path = 'images\events\bentota-water-sports-day.jpg' },
    @{ Url = 'https://images.unsplash.com/photo-1549366021-9f761d040a94?auto=format&fit=crop&w=1400&q=85'; Path = 'images\events\yala-wildlife-evening-talk.jpg' },
    @{ Url = 'https://images.unsplash.com/photo-1518005020951-eccb494ad742?auto=format&fit=crop&w=500&q=80'; Path = 'images\hotels\galle-fort-boutique-villa\logo.jpg' },
    @{ Url = 'https://images.unsplash.com/photo-1495365200479-c4ed1d35e1aa?auto=format&fit=crop&w=500&q=80'; Path = 'images\hotels\jaffna-heritage-guesthouse\logo.jpg' },
    @{ Url = 'https://images.unsplash.com/photo-1540541338287-41700207dee6?auto=format&fit=crop&w=500&q=80'; Path = 'images\hotels\bentota-river-resort\logo.jpg' },
    @{ Url = 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=1200&q=80'; Path = 'images\hotels\galle-fort-boutique-villa\property-01.jpg' },
    @{ Url = 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1200&q=80'; Path = 'images\hotels\galle-fort-boutique-villa\property-02.jpg' },
    @{ Url = 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=1200&q=80'; Path = 'images\hotels\jaffna-heritage-guesthouse\property-01.jpg' },
    @{ Url = 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=1200&q=80'; Path = 'images\hotels\bentota-river-resort\property-01.jpg' },
    @{ Url = 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=1000&q=80'; Path = 'images\rooms\galle-fort-boutique-villa\heritage-deluxe-room.jpg' },
    @{ Url = 'https://images.unsplash.com/photo-1560448075-bb485b067938?auto=format&fit=crop&w=1000&q=80'; Path = 'images\rooms\galle-fort-boutique-villa\fort-family-suite.jpg' },
    @{ Url = 'https://images.unsplash.com/photo-1566665797739-1674de7a421a?auto=format&fit=crop&w=1000&q=80'; Path = 'images\rooms\jaffna-heritage-guesthouse\northern-comfort-room.jpg' },
    @{ Url = 'https://images.unsplash.com/photo-1590490359683-658d3d23f972?auto=format&fit=crop&w=1000&q=80'; Path = 'images\rooms\bentota-river-resort\river-view-room.jpg' },
    @{ Url = 'https://images.unsplash.com/photo-1547425260-76bcadfb4f2c?auto=format&fit=crop&w=800&q=80'; Path = 'images\guides\nimal-kandy-heritage-guide.jpg' },
    @{ Url = 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=800&q=80'; Path = 'images\guides\sachini-galle-fort-guide.jpg' },
    @{ Url = 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=800&q=80'; Path = 'images\guides\arun-jaffna-culture-guide.jpg' },
    @{ Url = 'https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=1400&q=85'; Path = 'images\events\galle-fort-sunset-photo-walk.jpg' },
    @{ Url = 'https://images.unsplash.com/photo-1504754524776-8f4f37790ca0?auto=format&fit=crop&w=1400&q=85'; Path = 'images\events\jaffna-market-food-morning.jpg' },
    @{ Url = 'https://images.unsplash.com/photo-1518837695005-2083093ee35b?auto=format&fit=crop&w=1400&q=85'; Path = 'images\events\bentota-river-lagoon-safari.jpg' },
    @{ Url = 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=1400&q=85'; Path = 'images\events\colombo-night-party-demo-rejected.jpg' }
)

$headers = @{ 'User-Agent' = 'Mozilla/5.0 TripLanka/1.0' }
$failed = @()
foreach ($item in $items) {
    $destination = Join-Path $publicRoot $item.Path
    $directory = Split-Path $destination -Parent
    New-Item -ItemType Directory -Force -Path $directory | Out-Null
    if (Test-Path $destination) {
        Write-Host "SKIP  $($item.Path)" -ForegroundColor DarkGray
        continue
    }
    try {
        Invoke-WebRequest -Uri $item.Url -OutFile $destination -Headers $headers -MaximumRedirection 10
        if ((Get-Item $destination).Length -lt 1000) { throw 'Downloaded file is unexpectedly small.' }
        Write-Host "OK    $($item.Path)" -ForegroundColor Green
    } catch {
        if (Test-Path $destination) { Remove-Item $destination -Force }
        $failed += $item
        Write-Host "FAIL  $($item.Path) - $($_.Exception.Message)" -ForegroundColor Red
    }
}

Write-Host ''
if ($failed.Count -gt 0) {
    Write-Host "Completed with $($failed.Count) failed image(s)." -ForegroundColor Yellow
    Write-Host 'Run the script again for retries. Do NOT import the SET 6 seed until every required image is present.' -ForegroundColor Yellow
    exit 1
}
Write-Host "All $($items.Count) local images are ready." -ForegroundColor Green
