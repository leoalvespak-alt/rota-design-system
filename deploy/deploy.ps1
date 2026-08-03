<#
Deploy do Gerador de Criativos (Gerador-React) para o VPS.

Por padrão faz tudo: lint, build, commit + push pro GitHub e envio ao VPS.

Uso:
  .\deploy\deploy.ps1                        # build + commit/push + deploy (padrão)
  .\deploy\deploy.ps1 -NoPush                # build + deploy, sem tocar no git
  .\deploy\deploy.ps1 -SkipBuild             # reenvia o dist/ já existente, sem rebuildar
  .\deploy\deploy.ps1 -Message "ajusta layout mobile"

Pré-requisitos:
  - deploy/.env preenchido (copie deploy/.env.example)
  - SSH com chave já autorizada no VPS (sem senha) — é o que já está configurado nesta máquina
  - Node/npm instalados localmente
#>

param(
    [switch]$NoPush,
    [switch]$SkipBuild,
    [string]$Message = "Deploy: atualiza build de produção"
)

$ErrorActionPreference = "Stop"

$RepoRoot   = Split-Path -Parent $PSScriptRoot
$EnvFile    = Join-Path $PSScriptRoot ".env"
$DistDir    = Join-Path $RepoRoot "dist"
$ArchiveName = "gerador-react-dist.tar.gz"
$LocalArchive = Join-Path $env:TEMP $ArchiveName

function Write-Step($msg) {
    Write-Host "`n==> $msg" -ForegroundColor Cyan
}

function Fail($msg) {
    Write-Host "ERRO: $msg" -ForegroundColor Red
    exit 1
}

# 1. Carregar deploy/.env
if (-not (Test-Path $EnvFile)) {
    Fail "deploy/.env não encontrado. Copie deploy/.env.example para deploy/.env e preencha os valores."
}

$EnvVars = @{}
Get-Content $EnvFile | ForEach-Object {
    $line = $_.Trim()
    if ($line -and -not $line.StartsWith("#") -and $line.Contains("=")) {
        $parts = $line.Split("=", 2)
        $EnvVars[$parts[0].Trim()] = $parts[1].Trim()
    }
}

foreach ($key in @("VPS_HOST", "VPS_USER", "VPS_TARGET_DIR")) {
    if (-not $EnvVars.ContainsKey($key) -or [string]::IsNullOrWhiteSpace($EnvVars[$key])) {
        Fail "Variável '$key' ausente ou vazia em deploy/.env"
    }
}

$VpsHost   = $EnvVars["VPS_HOST"]
$VpsUser   = $EnvVars["VPS_USER"]
$TargetDir = $EnvVars["VPS_TARGET_DIR"]
$Domain    = $EnvVars["VPS_DOMAIN"]
$Remote    = "$VpsUser@$VpsHost"

Set-Location $RepoRoot

# 2. Lint + build local
if (-not $SkipBuild) {
    Write-Step "Lint (eslint .)"
    npm run lint
    if ($LASTEXITCODE -ne 0) { Fail "Lint falhou. Corrija os erros antes de fazer deploy." }

    Write-Step "Build de produção (tsc -b && vite build)"
    npm run build
    if ($LASTEXITCODE -ne 0) { Fail "Build falhou. Corrija os erros antes de fazer deploy." }
} else {
    Write-Step "SkipBuild ativo — reutilizando dist/ existente"
    if (-not (Test-Path $DistDir)) { Fail "dist/ não existe e -SkipBuild foi passado. Rode sem -SkipBuild na primeira vez." }
}

# 3. Commit + push (padrão; pule com -NoPush)
if (-not $NoPush) {
    Write-Step "Git commit + push"
    git add -A
    $hasChanges = (git status --porcelain)
    if ($hasChanges) {
        git commit -m "$Message"
        if ($LASTEXITCODE -ne 0) { Fail "git commit falhou." }
    } else {
        Write-Host "Nada para commitar (working tree limpa)." -ForegroundColor Yellow
    }
    git push origin main
    if ($LASTEXITCODE -ne 0) { Fail "git push falhou." }
} else {
    Write-Step "NoPush ativo — pulando commit/push"
}

# 4. Empacotar dist/
Write-Step "Empacotando dist/ para envio"
if (Test-Path $LocalArchive) { Remove-Item $LocalArchive -Force }
tar -czf $LocalArchive -C $DistDir .
if ($LASTEXITCODE -ne 0) { Fail "Falha ao empacotar dist/ (tar)." }

# 5. Enviar para o VPS
Write-Step "Enviando build para $Remote (scp)"
scp $LocalArchive "${Remote}:/tmp/$ArchiveName"
if ($LASTEXITCODE -ne 0) { Fail "scp falhou. Verifique conectividade/chave SSH." }

# 6. Extrair no servidor, sobrescrevendo o diretório atual
Write-Step "Extraindo no servidor em $TargetDir"
$remoteScript = @"
set -e
mkdir -p '$TargetDir'
find '$TargetDir' -mindepth 1 -delete
tar -xzf /tmp/$ArchiveName -C '$TargetDir'
rm -f /tmp/$ArchiveName
chown -R www-data:www-data '$TargetDir'
nginx -t
"@

ssh $Remote $remoteScript
if ($LASTEXITCODE -ne 0) { Fail "Falha ao extrair/aplicar no servidor. Nada foi recarregado no nginx." }

Remove-Item $LocalArchive -Force -ErrorAction SilentlyContinue

Write-Step "Deploy concluído"
if ($Domain) {
    Write-Host "Site: https://$Domain (ou http:// se o certificado SSL ainda não foi emitido)" -ForegroundColor Green
}
