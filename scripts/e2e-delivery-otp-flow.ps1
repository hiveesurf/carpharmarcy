# E2E delivery OTP flow — outputs JSON report to scripts/e2e-delivery-otp-report.json
$Base = "http://localhost:8080/api/v1"
$report = [ordered]@{ steps = @(); orderId = $null; pass = $false }

function Get-Token($phone) {
  $send = Invoke-RestMethod -Uri "$Base/auth/send-otp" -Method POST -ContentType "application/json" -Body (@{ phone = $phone } | ConvertTo-Json)
  $r = Invoke-RestMethod -Uri "$Base/auth/verify-otp" -Method POST -ContentType "application/json" -Body (@{ phone = $phone; otp = $send.data.demoOtp } | ConvertTo-Json)
  return @{ token = $r.data.accessToken; userId = $r.data.user.id; role = $r.data.user.role }
}

function Step($name, $fn) {
  try {
    $result = & $fn
    $report.steps += @{ name = $name; status = "PASS"; detail = $result }
    return $result
  } catch {
    $detail = $_.Exception.Message
    if ($_.Exception.Response) {
      $sr = [System.IO.StreamReader]::new($_.Exception.Response.GetResponseStream())
      $detail = $sr.ReadToEnd()
    }
    $report.steps += @{ name = $name; status = "FAIL"; detail = $detail }
    throw
  }
}

$customer = Step "customer_login" { Get-Token "9004027637" }
# super_admin linked to admin_users (9004027637); 9876543210 is sales-only user JWT
$admin = Step "admin_login" { Get-Token "9004027637" }
$partner = Step "partner_login" { Get-Token "7598521713" }

$ch = @{ Authorization = "Bearer $($customer.token)" }
$ah = @{ Authorization = "Bearer $($admin.token)" }
$ph = @{ Authorization = "Bearer $($partner.token)" }

Step "cart_add" {
  Invoke-RestMethod -Uri "$Base/cart" -Method POST -Headers $ch -ContentType "application/json" `
    -Body (@{ productId = "brk-front-001"; quantity = 1 } | ConvertTo-Json) | Out-Null
  "cart ok"
}

$placed = Step "place_order" {
  $body = @{
    addressId = "8cfcda10-9fe5-4c9a-bdd4-a6940a3c900b"
    paymentMethod = "cod"
    demoPaymentOutcome = "success"
  }
  $placeHeaders = $ch.Clone()
  $placeHeaders["Idempotency-Key"] = [guid]::NewGuid().ToString()
  $r = Invoke-RestMethod -Uri "$Base/orders" -Method POST -Headers $placeHeaders -ContentType "application/json" `
    -Body ($body | ConvertTo-Json)
  $report.orderId = $r.data.order.id
  $r.data.order
}

$orderId = $report.orderId
Write-Host "ORDER_ID=$orderId"

Step "assign_delivery" {
  $r = Invoke-RestMethod -Uri "$Base/admin/orders/$orderId/assign-delivery" -Method PATCH -Headers $ah `
    -ContentType "application/json" -Body (@{ deliveryAdminEmail = "emp_7598521713@carnalysys.local" } | ConvertTo-Json)
  $r.data.order | Select-Object id, deliveryStage, assignedDeliveryAdminEmail
}

Step "accept_assignment" {
  $r = Invoke-RestMethod -Uri "$Base/admin/orders/$orderId/delivery/accept" -Method POST -Headers $ph -ContentType "application/json" -Body "{}"
  $r.data.order | Select-Object id, deliveryStage
}

Step "start_delivery" {
  $r = Invoke-RestMethod -Uri "$Base/admin/orders/$orderId/delivery/out-for-delivery" -Method POST -Headers $ph -ContentType "application/json" -Body "{}"
  $r.data.order | Select-Object id, deliveryStage, deliveryOtpVerified
}

$beforeOtp = Step "customer_get_order_before_verify" {
  $r = Invoke-RestMethod -Uri "$Base/orders/$orderId" -Headers $ch
  @{
    deliveryStage = $r.data.order.deliveryStage
    otpPending = $r.data.order.otpPending
    deliveryOtp = $r.data.order.deliveryOtp
    deliveryOtpVerified = $r.data.order.deliveryOtpVerified
    otpExpired = $r.data.order.otpExpired
  }
}

$deliveryOtpApi = Step "customer_delivery_otp_endpoint" {
  $r = Invoke-RestMethod -Uri "$Base/orders/$orderId/delivery-otp" -Headers $ch
  $report.beforeVerify = $r.data
  $r.data
}

Step "partner_verify_otp_wrong" {
  try {
    Invoke-RestMethod -Uri "$Base/admin/orders/$orderId/delivery/verify-otp" -Method POST -Headers $ph `
      -ContentType "application/json" -Body '{"otp":"000000"}' | Out-Null
    "unexpected success"
  } catch {
    $sr = [System.IO.StreamReader]::new($_.Exception.Response.GetResponseStream())
    ($sr.ReadToEnd() | ConvertFrom-Json).error.code
  }
}

$otpToUse = if ($deliveryOtpApi.deliveryOtp) { $deliveryOtpApi.deliveryOtp } else { "123456" }
Step "partner_verify_otp_correct" {
  $r = Invoke-RestMethod -Uri "$Base/admin/orders/$orderId/delivery/verify-otp" -Method POST -Headers $ph `
    -ContentType "application/json" -Body (@{ otp = $otpToUse } | ConvertTo-Json)
  @{
    deliveryOtpVerified = $r.data.order.deliveryOtpVerified
    deliveryStage = $r.data.order.deliveryStage
  }
}

$afterOtp = Step "customer_get_order_after_verify" {
  $r = Invoke-RestMethod -Uri "$Base/orders/$orderId" -Headers $ch
  $live = Invoke-RestMethod -Uri "$Base/orders/$orderId/delivery-otp" -Headers $ch
  @{
    order = @{
      deliveryStage = $r.data.order.deliveryStage
      otpPending = $r.data.order.otpPending
      deliveryOtp = $r.data.order.deliveryOtp
      deliveryOtpVerified = $r.data.order.deliveryOtpVerified
    }
    deliveryOtpEndpoint = $live.data
  }
}

$report.afterVerify = $afterOtp
$report.beforeVerifyOrder = $beforeOtp

$otpVisible = [bool]$beforeOtp.deliveryOtp -and $beforeOtp.deliveryOtp -match '^\d{6}$'
$apiOtp = [bool]$deliveryOtpApi.deliveryOtp
$verifiedAfter = [bool]$afterOtp.order.deliveryOtpVerified
$report.pass = $otpVisible -and $apiOtp -and $verifiedAfter -and (-not $afterOtp.deliveryOtpEndpoint.deliveryOtp)

$out = Join-Path $PSScriptRoot "e2e-delivery-otp-report.json"
$report | ConvertTo-Json -Depth 6 | Set-Content -Path $out -Encoding utf8
Write-Host "REPORT=$out"
Write-Host "PASS=$($report.pass)"
$report | ConvertTo-Json -Depth 6
