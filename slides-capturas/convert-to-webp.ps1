# convert-to-webp.ps1
# Convierte todas las imágenes (PNG, JPG, JPEG, GIF) de esta carpeta a formato .webp
# Requiere: cwebp (https://developers.google.com/speed/webp/download)
# o alternativamente usa ImageMagick si cwebp no está disponible.

param(
    [int]$Quality = 85,
    [switch]$DeleteOriginals
)

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$extensions = @("*.png", "*.jpg", "*.jpeg", "*.gif", "*.bmp", "*.tiff")

# Detectar herramienta disponible
$tool = $null
if (Get-Command "cwebp" -ErrorAction SilentlyContinue) {
    $tool = "cwebp"
} elseif (Get-Command "magick" -ErrorAction SilentlyContinue) {
    $tool = "imagemagick"
} elseif (Get-Command "ffmpeg" -ErrorAction SilentlyContinue) {
    $tool = "ffmpeg"
} else {
    Write-Host ""
    Write-Host "ERROR: No se encontro ninguna herramienta de conversion." -ForegroundColor Red
    Write-Host ""
    Write-Host "Instala una de las siguientes opciones:" -ForegroundColor Yellow
    Write-Host "  1. cwebp  -> https://developers.google.com/speed/webp/download" -ForegroundColor Cyan
    Write-Host "  2. ImageMagick (magick) -> https://imagemagick.org/script/download.php" -ForegroundColor Cyan
    Write-Host "  3. FFmpeg -> https://ffmpeg.org/download.html" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Con winget puedes instalar ImageMagick asi:" -ForegroundColor Yellow
    Write-Host "  winget install ImageMagick.ImageMagick" -ForegroundColor Green
    exit 1
}

Write-Host ""
Write-Host "=== Conversor a WebP ===" -ForegroundColor Cyan
Write-Host "Herramienta: $tool" -ForegroundColor Gray
Write-Host "Calidad: $Quality%" -ForegroundColor Gray
Write-Host "Carpeta: $scriptDir" -ForegroundColor Gray
Write-Host ""

$files = @()
foreach ($ext in $extensions) {
    $files += Get-ChildItem -Path $scriptDir -Filter $ext -File
}

# Excluir archivos que ya son .webp en nombre (no aplica aquí, pero por seguridad)
$converted = 0
$skipped = 0
$failed = 0

foreach ($file in $files) {
    $outputPath = Join-Path $scriptDir ($file.BaseName + ".webp")

    if (Test-Path $outputPath) {
        Write-Host "  OMITIDO (ya existe): $($file.Name)" -ForegroundColor DarkGray
        $skipped++
        continue
    }

    Write-Host "  Convirtiendo: $($file.Name) -> $($file.BaseName).webp" -ForegroundColor White -NoNewline

    $success = $false

    switch ($tool) {
        "cwebp" {
            $result = & cwebp -q $Quality "$($file.FullName)" -o "$outputPath" 2>&1
            $success = $LASTEXITCODE -eq 0
        }
        "imagemagick" {
            $result = & magick "$($file.FullName)" -quality $Quality "$outputPath" 2>&1
            $success = $LASTEXITCODE -eq 0
        }
        "ffmpeg" {
            $result = & ffmpeg -i "$($file.FullName)" -quality $Quality "$outputPath" -y 2>&1
            $success = $LASTEXITCODE -eq 0
        }
    }

    if ($success) {
        $originalSize = [math]::Round($file.Length / 1KB, 1)
        $newSize = [math]::Round((Get-Item $outputPath).Length / 1KB, 1)
        $saving = [math]::Round((1 - $newSize / $originalSize) * 100, 1)
        Write-Host "  OK ($originalSize KB -> $newSize KB, ahorro: $saving%)" -ForegroundColor Green
        $converted++

        if ($DeleteOriginals) {
            Remove-Item $file.FullName -Force
        }
    } else {
        Write-Host "  FALLO" -ForegroundColor Red
        $failed++
    }
}

Write-Host ""
Write-Host "=== Resumen ===" -ForegroundColor Cyan
Write-Host "  Convertidas : $converted" -ForegroundColor Green
Write-Host "  Omitidas    : $skipped" -ForegroundColor DarkGray
Write-Host "  Fallidas    : $failed" -ForegroundColor $(if ($failed -gt 0) { "Red" } else { "DarkGray" })
Write-Host ""

if ($DeleteOriginals -and $converted -gt 0) {
    Write-Host "Originales eliminados." -ForegroundColor Yellow
}
