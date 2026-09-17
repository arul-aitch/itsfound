# ============================================================
# test-3b.ps1 — Smoke test Hari 3B (v2, pakai Invoke-RestMethod)
# Jalankan di PowerShell. Server Go harus sudah running di :8080.
# ============================================================

$ErrorActionPreference = "Continue"
$BASE = "http://localhost:8080"

# --- Utility -------------------------------------------------

function Section($title) {
    Write-Host ""
    Write-Host "==================================================" -ForegroundColor Cyan
    Write-Host "  $title" -ForegroundColor Cyan
    Write-Host "==================================================" -ForegroundColor Cyan
}

function Ok($msg)   { Write-Host "  [OK]   $msg" -ForegroundColor Green }
function Fail($msg) { Write-Host "  [FAIL] $msg" -ForegroundColor Red }
function Info($msg) { Write-Host "         $msg" -ForegroundColor DarkGray }

# Return @{ Status = int; Body = object/string }
function HttpReq {
    param(
        [string]$Method,
        [string]$Url,
        [string]$Token,
        [object]$BodyObj
    )

    $headers = @{}
    if ($Token) { $headers["Authorization"] = "Bearer $Token" }

    $params = @{
        Method      = $Method
        Uri         = $Url
        Headers     = $headers
        ErrorAction = "Stop"
    }

    if ($BodyObj -ne $null) {
        $params["Body"]        = ($BodyObj | ConvertTo-Json -Compress)
        $params["ContentType"] = "application/json"
    }

    try {
        $resp = Invoke-RestMethod @params
        return @{ Status = 200; Body = $resp }
    } catch {
        $status = 0
        $body   = $_.Exception.Message

        if ($_.Exception.Response) {
            $status = [int]$_.Exception.Response.StatusCode.value__
            try {
                $stream = $_.Exception.Response.GetResponseStream()
                $reader = New-Object System.IO.StreamReader($stream)
                $body   = $reader.ReadToEnd()
            } catch { }
        }

        $parsed = $null
        try { $parsed = $body | ConvertFrom-Json } catch { }

        return @{ Status = $status; Body = $parsed; Raw = $body }
    }
}

# --- 0. Cek server -------------------------------------------

Section "0. Cek server"
$health = HttpReq -Method "GET" -Url "$BASE/health"
if ($health.Status -ne 200) {
    Fail "Server tidak merespon di $BASE/health (status: $($health.Status))"
    Info "Jalankan 'go run ./cmd/api' di folder backend dulu."
    exit 1
}
Ok "Server jalan: status $($health.Status)"

# --- 1. Login user & admin -----------------------------------

Section "1. Login"

$userLogin = HttpReq -Method "POST" -Url "$BASE/api/auth/login" -BodyObj @{
    email    = "test@example.com"
    password = "password123"
}
if ($userLogin.Status -ne 200) {
    Fail "Login user gagal (status $($userLogin.Status)): $($userLogin.Raw)"
    exit 1
}
$USER_TOKEN = $userLogin.Body.token
$USER_ID    = $userLogin.Body.user.id
Ok "User login: $($userLogin.Body.user.email) (id: $USER_ID)"

$adminLogin = HttpReq -Method "POST" -Url "$BASE/api/auth/login" -BodyObj @{
    email    = "admin@itsfound.local"
    password = "admin1234"
}
if ($adminLogin.Status -ne 200) {
    Fail "Login admin gagal (status $($adminLogin.Status)): $($adminLogin.Raw)"
    Info "Cek password admin. Default seed: admin1234"
    exit 1
}
$ADMIN_TOKEN = $adminLogin.Body.token
Ok "Admin login: $($adminLogin.Body.user.email) (role: $($adminLogin.Body.user.role))"

# --- 2. User kedua -------------------------------------------

Section "2. Siapkan user kedua"

$reg2 = HttpReq -Method "POST" -Url "$BASE/api/auth/register" -BodyObj @{
    email    = "test2@example.com"
    password = "password123"
    name     = "Test User 2"
}
Info "Register user2 status: $($reg2.Status) (201=baru, 409=sudah ada)"

$user2Login = HttpReq -Method "POST" -Url "$BASE/api/auth/login" -BodyObj @{
    email    = "test2@example.com"
    password = "password123"
}
if ($user2Login.Status -ne 200) {
    Fail "Login user2 gagal: $($user2Login.Raw)"
    exit 1
}
$USER2_TOKEN = $user2Login.Body.token
Ok "User2 login: $($user2Login.Body.user.email)"

# --- 3. Create reports ---------------------------------------

Section "3. Create 3 reports"

$now = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ")

$reportsToCreate = @(
    @{ category_id = 1; location_id = 1; type = "lost";  title = "Dompet hitam";   description = "Hilang di perpustakaan";  occurred_at = $now },
    @{ category_id = 2; location_id = 2; type = "found"; title = "Kunci motor";    description = "Ditemukan di Gedung A";   occurred_at = $now },
    @{ category_id = 1; location_id = 3; type = "lost";  title = "Dompet cokelat"; description = "Hilang di kantin";        occurred_at = $now }
)

$createdIds = @()
foreach ($r in $reportsToCreate) {
    $res = HttpReq -Method "POST" -Url "$BASE/api/reports" -Token $USER_TOKEN -BodyObj $r
    if ($res.Status -ne 201 -and $res.Status -ne 200) {
        Fail "Create '$($r.title)' gagal (status $($res.Status)): $($res.Raw)"
        continue
    }
    $createdIds += $res.Body.id
    Ok "Created '$($r.title)' -> category='$($res.Body.category_name)' location='$($res.Body.location_name)' user='$($res.Body.user.name)'"
}

if ($createdIds.Count -eq 0) {
    Fail "Tidak ada report yang berhasil dibuat. Stop."
    exit 1
}
$REPORT_ID = $createdIds[0]
Info "REPORT_ID: $REPORT_ID"

# --- 4. Pagination -------------------------------------------

Section "4. Pagination: GET /api/reports?page=1&per_page=2"

$res = HttpReq -Method "GET" -Url "$BASE/api/reports?page=1&per_page=2"
if ($res.Status -ne 200) {
    Fail "Status $($res.Status): $($res.Raw)"
} else {
    $count = @($res.Body.data).Count
    Ok "Page=$($res.Body.meta.page) PerPage=$($res.Body.meta.per_page) Total=$($res.Body.meta.total) TotalPages=$($res.Body.meta.total_pages)"
    Info "Jumlah item di data: $count (harus <= 2)"
    if ($count -le 2) { Ok "Pagination OK" } else { Fail "Pagination tidak membatasi item" }
}

# --- 5. Filter type=lost -------------------------------------

Section "5. Filter: GET /api/reports?type=lost"

$res = HttpReq -Method "GET" -Url "$BASE/api/reports?type=lost"
if ($res.Status -ne 200) {
    Fail "Status $($res.Status)"
} else {
    $allLost = $true
    foreach ($item in $res.Body.data) { if ($item.type -ne "lost") { $allLost = $false } }
    Ok "Total lost: $($res.Body.meta.total)"
    if ($allLost) { Ok "Semua item bertipe 'lost'" } else { Fail "Ada item bukan 'lost'" }
}

# --- 6. Search -----------------------------------------------

Section "6. Search: GET /api/reports?search=dompet"

$res = HttpReq -Method "GET" -Url "$BASE/api/reports?search=dompet"
if ($res.Status -ne 200) {
    Fail "Status $($res.Status)"
} else {
    Ok "Total hasil search 'dompet': $($res.Body.meta.total)"
    foreach ($item in $res.Body.data) { Info "- $($item.title)" }
}

# --- 7. Filter category_id=1 ---------------------------------

Section "7. Filter: GET /api/reports?category_id=1"

$res = HttpReq -Method "GET" -Url "$BASE/api/reports?category_id=1"
if ($res.Status -ne 200) {
    Fail "Status $($res.Status)"
} else {
    Ok "Total category_id=1: $($res.Body.meta.total)"
}

# --- 8. Detail -----------------------------------------------

Section "8. Detail: GET /api/reports/$REPORT_ID"

$res = HttpReq -Method "GET" -Url "$BASE/api/reports/$REPORT_ID"
if ($res.Status -ne 200) {
    Fail "Status $($res.Status): $($res.Raw)"
} else {
    Ok "title='$($res.Body.title)'"
    if ($res.Body.category_name) { Ok "category_name='$($res.Body.category_name)'" } else { Fail "category_name kosong" }
    if ($res.Body.location_name) { Ok "location_name='$($res.Body.location_name)'" } else { Fail "location_name kosong" }
    if ($res.Body.user -and $res.Body.user.name) { Ok "user.name='$($res.Body.user.name)'" } else { Fail "user kosong" }
}

# --- 9. Update sebagai user lain -> 403 ----------------------

Section "9. Update sebagai user lain (harus 403)"

$res = HttpReq -Method "PUT" -Url "$BASE/api/reports/$REPORT_ID" -Token $USER2_TOKEN -BodyObj @{
    category_id = 1; location_id = 1; type = "lost"
    title = "Coba hack"; description = "Coba update"; occurred_at = $now
}
if ($res.Status -eq 403) { Ok "403 sesuai harapan" }
else { Fail "Expected 403, dapat $($res.Status): $($res.Raw)" }

# --- 10. Update sebagai admin -> 200 -------------------------

Section "10. Update sebagai admin (harus 200)"

$res = HttpReq -Method "PUT" -Url "$BASE/api/reports/$REPORT_ID" -Token $ADMIN_TOKEN -BodyObj @{
    category_id = 1; location_id = 1; type = "lost"
    title = "Update oleh admin"; description = "Diupdate admin"; occurred_at = $now
}
if ($res.Status -eq 200) {
    Ok "200 OK, title baru='$($res.Body.title)'"
} else {
    Fail "Expected 200, dapat $($res.Status): $($res.Raw)"
}

# --- 11. Delete sebagai admin -> 204 -------------------------

Section "11. Delete sebagai admin (harus 204)"

$res = HttpReq -Method "DELETE" -Url "$BASE/api/reports/$REPORT_ID" -Token $ADMIN_TOKEN
if ($res.Status -eq 204 -or $res.Status -eq 200) { Ok "204 No Content" }
else { Fail "Expected 204, dapat $($res.Status): $($res.Raw)" }

# --- 12. Get setelah delete -> 404 ---------------------------

Section "12. Get report yang sudah dihapus (harus 404)"

$res = HttpReq -Method "GET" -Url "$BASE/api/reports/$REPORT_ID"
if ($res.Status -eq 404) { Ok "404 sesuai harapan" }
else { Fail "Expected 404, dapat $($res.Status): $($res.Raw)" }

# --- Done ----------------------------------------------------

Section "SELESAI"
Write-Host ""
Write-Host "Semua test 3B selesai. Cek [OK]/[FAIL] di atas." -ForegroundColor Yellow
Write-Host ""