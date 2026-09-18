# ============================================================
# test-5c1.ps1 — Smoke test Hari 5C-1 (claims backend)
# Jalankan di PowerShell. Backend Go harus running di :8080.
# ============================================================

$ErrorActionPreference = "Continue"
$BASE = "http://localhost:8080"

function Section($title) {
    Write-Host ""
    Write-Host "==================================================" -ForegroundColor Cyan
    Write-Host "  $title" -ForegroundColor Cyan
    Write-Host "==================================================" -ForegroundColor Cyan
}

function Ok($msg)   { Write-Host "  [OK]   $msg" -ForegroundColor Green }
function Fail($msg) { Write-Host "  [FAIL] $msg" -ForegroundColor Red }
function Info($msg) { Write-Host "         $msg" -ForegroundColor DarkGray }

function HttpReq {
    param(
        [string]$Method,
        [string]$Url,
        [string]$Token,
        [object]$BodyObj
    )
    $headers = @{}
    if ($Token) { $headers["Authorization"] = "Bearer $Token" }
    $params = @{ Method = $Method; Uri = $Url; Headers = $headers; ErrorAction = "Stop" }
    if ($BodyObj -ne $null) {
        $params["Body"] = ($BodyObj | ConvertTo-Json -Compress)
        $params["ContentType"] = "application/json"
    }
    try {
        $resp = Invoke-RestMethod @params
        return @{ Status = 200; Body = $resp }
    } catch {
        $status = 0
        $body = $_.Exception.Message
        if ($_.Exception.Response) {
            $status = [int]$_.Exception.Response.StatusCode.value__
            try {
                $stream = $_.Exception.Response.GetResponseStream()
                $reader = New-Object System.IO.StreamReader($stream)
                $body = $reader.ReadToEnd()
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
    Fail "Server tidak merespon di $BASE/health"
    exit 1
}
Ok "Server jalan"

# --- 1. Login semua user -------------------------------------

Section "1. Login user1, user2, admin"

$l1 = HttpReq -Method "POST" -Url "$BASE/api/auth/login" -BodyObj @{ email = "test@example.com"; password = "password123" }
if ($l1.Status -ne 200) { Fail "Login user1 gagal: $($l1.Raw)"; exit 1 }
$TOKEN1 = $l1.Body.token
Ok "User1: $($l1.Body.user.email)"

$l2 = HttpReq -Method "POST" -Url "$BASE/api/auth/login" -BodyObj @{ email = "test2@example.com"; password = "password123" }
if ($l2.Status -ne 200) { Fail "Login user2 gagal: $($l2.Raw)"; exit 1 }
$TOKEN2 = $l2.Body.token
Ok "User2: $($l2.Body.user.email)"

$la = HttpReq -Method "POST" -Url "$BASE/api/auth/login" -BodyObj @{ email = "admin@itsfound.local"; password = "admin1234" }
if ($la.Status -ne 200) { Fail "Login admin gagal: $($la.Raw)"; exit 1 }
$ADMIN_TOKEN = $la.Body.token
Ok "Admin: $($la.Body.user.email)"

# --- 2. User1 buat report found ------------------------------

Section "2. User1 buat report 'found'"

$now = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ")
$reportBody = @{
    category_id = 1
    location_id = 1
    type = "found"
    title = "Dompet ditemukan di perpus"
    description = "Dompet hitam ditemukan, ada beberapa kartu di dalamnya"
    occurred_at = $now
}
$r = HttpReq -Method "POST" -Url "$BASE/api/reports" -Token $TOKEN1 -BodyObj $reportBody
if ($r.Status -ne 201 -and $r.Status -ne 200) { Fail "Buat report gagal: $($r.Raw)"; exit 1 }
$REPORT_ID = $r.Body.id
Ok "Report dibuat: $REPORT_ID"
Info "type=$($r.Body.type) status=$($r.Body.status)"

# --- 3. User2 klaim report -----------------------------------

Section "3. User2 klaim report (harus 201)"

$claimBody = @{
    report_id = $REPORT_ID
    evidence = "Dompet ini milik saya karena ada kartu identitas dengan nama saya di dalamnya."
}
$c1 = HttpReq -Method "POST" -Url "$BASE/api/claims" -Token $TOKEN2 -BodyObj $claimBody
if ($c1.Status -eq 201 -or $c1.Status -eq 200) {
    $CLAIM_ID = $c1.Body.id
    Ok "Klaim dibuat: $CLAIM_ID"
    Info "status klaim: $($c1.Body.status)"
    Info "status report: $($c1.Body.report.status)"
    if ($c1.Body.report.status -eq "in_claim") {
        Ok "Report otomatis berubah jadi 'in_claim'"
    } else {
        Fail "Report status harusnya 'in_claim', dapat '$($c1.Body.report.status)'"
    }
} else {
    Fail "Klaim gagal (status $($c1.Status)): $($c1.Raw)"
    exit 1
}

# --- 4. User2 klaim lagi (duplikat) --------------------------

Section "4. User2 klaim lagi (harus 409)"

$c2 = HttpReq -Method "POST" -Url "$BASE/api/claims" -Token $TOKEN2 -BodyObj @{
    report_id = $REPORT_ID
    evidence = "Ini klaim kedua dengan bukti berbeda, harusnya ditolak."
}
if ($c2.Status -eq 409) {
    Ok "409 sesuai harapan - code: $($c2.Body.error.code)"
} else {
    Fail "Expected 409, dapat $($c2.Status): $($c2.Raw)"
}

# --- 5. User1 klaim report sendiri (harus 400) ---------------

Section "5. User1 klaim report sendiri (harus 400)"

$c3 = HttpReq -Method "POST" -Url "$BASE/api/claims" -Token $TOKEN1 -BodyObj @{
    report_id = $REPORT_ID
    evidence = "Saya coba klaim laporan milik saya sendiri, harusnya ditolak."
}
if ($c3.Status -eq 400) {
    Ok "400 sesuai harapan"
} else {
    Fail "Expected 400, dapat $($c3.Status): $($c3.Raw)"
}

# --- 6. Evidence < 10 karakter (harus 400) -------------------

Section "6. Evidence terlalu pendek (harus 400)"

$c4 = HttpReq -Method "POST" -Url "$BASE/api/claims" -Token $TOKEN2 -BodyObj @{
    report_id = $REPORT_ID
    evidence = "pendek"
}
if ($c4.Status -eq 400) {
    Ok "400 sesuai harapan"
} else {
    Fail "Expected 400, dapat $($c4.Status): $($c4.Raw)"
}

# --- 7. Klaim tanpa JWT (harus 401) --------------------------

Section "7. Klaim tanpa JWT (harus 401)"

$c5 = HttpReq -Method "POST" -Url "$BASE/api/claims" -BodyObj @{
    report_id = $REPORT_ID
    evidence = "Test tanpa token, harusnya unauthorized."
}
if ($c5.Status -eq 401) {
    Ok "401 sesuai harapan"
} else {
    Fail "Expected 401, dapat $($c5.Status): $($c5.Raw)"
}

# --- 8. GET /api/claims/me -----------------------------------

Section "8. GET /api/claims/me sebagai User2"

$m = HttpReq -Method "GET" -Url "$BASE/api/claims/me" -Token $TOKEN2
if ($m.Status -eq 200) {
    Ok "Dapat $($m.Body.Count) klaim"
    foreach ($claim in $m.Body) {
        Info "- $($claim.id) status=$($claim.status) report='$($claim.report.title)'"
    }
} else {
    Fail "Gagal: $($m.Raw)"
}

# --- 9. GET /api/admin/claims --------------------------------

Section "9. GET /api/admin/claims sebagai admin"

$a = HttpReq -Method "GET" -Url "$BASE/api/admin/claims" -Token $ADMIN_TOKEN
if ($a.Status -eq 200) {
    Ok "Admin dapat $($a.Body.Count) klaim"
} else {
    Fail "Gagal: $($a.Raw)"
}

# --- 10. Admin approve claim ---------------------------------

Section "10. Admin approve klaim"

$u = HttpReq -Method "PATCH" -Url "$BASE/api/admin/claims/$CLAIM_ID" -Token $ADMIN_TOKEN -BodyObj @{
    status = "approved"
    admin_note = "Bukti sesuai, klaim disetujui."
}
if ($u.Status -eq 200) {
    Ok "Klaim di-approve"
    Info "status klaim: $($u.Body.status)"
    Info "status report: $($u.Body.report.status)"
    if ($u.Body.report.status -eq "resolved") {
        Ok "Report otomatis berubah jadi 'resolved'"
    } else {
        Fail "Report status harusnya 'resolved', dapat '$($u.Body.report.status)'"
    }
} else {
    Fail "Approve gagal (status $($u.Status)): $($u.Raw)"
}

# --- 11. Klaim sudah diproses, coba approve lagi (harus 400) -

Section "11. Approve klaim yang sudah diproses (harus 400)"

$u2 = HttpReq -Method "PATCH" -Url "$BASE/api/admin/claims/$CLAIM_ID" -Token $ADMIN_TOKEN -BodyObj @{
    status = "rejected"
    admin_note = "Coba reject klaim yang sudah approved."
}
if ($u2.Status -eq 400) {
    Ok "400 sesuai harapan"
} else {
    Fail "Expected 400, dapat $($u2.Status): $($u2.Raw)"
}

# --- 12. User (bukan admin) akses admin endpoint (403) -------

Section "12. User akses /api/admin/claims (harus 403)"

$f = HttpReq -Method "GET" -Url "$BASE/api/admin/claims" -Token $TOKEN2
if ($f.Status -eq 403) {
    Ok "403 sesuai harapan"
} else {
    Fail "Expected 403, dapat $($f.Status): $($f.Raw)"
}

# --- Done ----------------------------------------------------

Section "SELESAI"
Write-Host ""
Write-Host "Cek [OK]/[FAIL] di atas." -ForegroundColor Yellow
Write-Host ""