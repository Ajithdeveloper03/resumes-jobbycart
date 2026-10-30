# Production Deployment Packaging Script for Hostinger

$rootPath = $PSScriptRoot
$backendPath = Join-Path $rootPath "backend"
$frontendPath = Join-Path $rootPath "frontend"

Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "   CREATING PRODUCTION DEPLOYMENT PACKAGES" -ForegroundColor Cyan
Write-Host "========================================================" -ForegroundColor Cyan

# 1. Compile React Frontend
Write-Host "`n[1/4] Compiling React Vite Frontend for Production..." -ForegroundColor Yellow
Set-Location $frontendPath
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Error "Frontend compilation failed!"
    exit 1
}

# 2. Merge compiled frontend assets into backend/public/
Write-Host "`n[2/4] Merging frontend assets into backend/public/..." -ForegroundColor Yellow
$backendPublic = Join-Path $backendPath "public"
$backendAssets = Join-Path $backendPublic "assets"

if (-not (Test-Path $backendAssets)) {
    New-Item -ItemType Directory -Path $backendAssets -Force | Out-Null
} else {
    Remove-Item -Path (Join-Path $backendAssets "*") -Force -ErrorAction SilentlyContinue
}

Copy-Item -Path (Join-Path $frontendPath "dist\index.html") -Destination (Join-Path $backendPublic "index.html") -Force
Copy-Item -Path (Join-Path $frontendPath "dist\assets\*") -Destination $backendAssets -Recurse -Force
if (Test-Path (Join-Path $frontendPath "public\jobbycart-logo.png")) {
    Copy-Item -Path (Join-Path $frontendPath "public\jobbycart-logo.png") -Destination (Join-Path $backendPublic "jobbycart-logo.png") -Force
}

# Ensure essential storage directories exist
$storageDirs = @(
    (Join-Path $backendPath "storage\app\private\resumes"),
    (Join-Path $backendPath "storage\app\public\resumes"),
    (Join-Path $backendPath "storage\framework\cache\data"),
    (Join-Path $backendPath "storage\framework\sessions"),
    (Join-Path $backendPath "storage\framework\views"),
    (Join-Path $backendPath "storage\logs")
)
foreach ($dir in $storageDirs) {
    if (-not (Test-Path $dir)) {
        New-Item -ItemType Directory -Path $dir -Force | Out-Null
    }
}

# Clean cache files in backend/bootstrap/cache and old views/logs before packaging
$bootstrapCache = Join-Path $backendPath "bootstrap\cache"
Get-ChildItem -Path $bootstrapCache -Filter "*.php" | Where-Object { $_.Name -notin @("packages.php", "services.php") } | Remove-Item -Force -ErrorAction SilentlyContinue
Get-ChildItem -Path (Join-Path $backendPath "storage\framework\views") -Filter "*.php" -ErrorAction SilentlyContinue | Remove-Item -Force -ErrorAction SilentlyContinue
Get-ChildItem -Path (Join-Path $backendPath "storage\logs") -Filter "*.log" -ErrorAction SilentlyContinue | Remove-Item -Force -ErrorAction SilentlyContinue

# 3. Create resumes-deploy.zip (contents of backend/ at root of zip, including dotfiles)
Write-Host "`n[3/4] Creating resumes-deploy.zip (root structure via fast tar)..." -ForegroundColor Yellow
$deployZip = Join-Path $rootPath "resumes-deploy.zip"
if (Test-Path $deployZip) {
    Remove-Item $deployZip -Force
}

Set-Location $backendPath
tar -a -c -f $deployZip --exclude="node_modules" --exclude=".git" app bootstrap config database public resources routes storage vendor .env .env.example .htaccess .user.ini artisan composer.json composer.lock

# 4. Create backend.zip (with backend/ parent folder)
Write-Host "`n[4/5] Creating backend.zip (folder structure via fast tar)..." -ForegroundColor Yellow
$backendZip = Join-Path $rootPath "backend.zip"
if (Test-Path $backendZip) {
    Remove-Item $backendZip -Force
}

Set-Location $rootPath
tar -a -c -f $backendZip --exclude="backend/node_modules" --exclude="backend/.git" backend

# 5. Create quick update zip (only modified files without vendor)
Write-Host "`n[5/5] Creating ats-update-only.zip (quick hotfix package without vendor)..." -ForegroundColor Yellow
$updateZip = Join-Path $rootPath "ats-update-only.zip"
if (Test-Path $updateZip) {
    Remove-Item $updateZip -Force
}

Set-Location $backendPath
tar -a -c -f $updateZip app bootstrap config database routes public storage .htaccess .user.ini

Write-Host "`n========================================================" -ForegroundColor Green
Write-Host "   DEPLOYMENT PACKAGES READY!" -ForegroundColor Green
Write-Host "   1. resumes-deploy.zip:  $([math]::Round((Get-Item $deployZip).Length / 1MB, 2)) MB (Full deployment at root)" -ForegroundColor Green
Write-Host "   2. backend.zip:         $([math]::Round((Get-Item $backendZip).Length / 1MB, 2)) MB (Full deployment in backend/)" -ForegroundColor Green
Write-Host "   3. ats-update-only.zip: $([math]::Round((Get-Item $updateZip).Length / 1MB, 2)) MB (Quick update without vendor)" -ForegroundColor Green
Write-Host "========================================================" -ForegroundColor Green
Write-Host "========================================================" -ForegroundColor Green
