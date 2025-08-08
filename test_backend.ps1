# PowerShell script to test backend connectivity
$ports = @(8001, 8002, 8003, 8004, 8005)

Write-Host "Testing Qlib Backend Connectivity..." -ForegroundColor Green

foreach ($port in $ports) {
    try {
        Write-Host "Testing port $port..." -NoNewline
        $response = Invoke-RestMethod -Uri "http://localhost:$port/api/health" -TimeoutSec 3 -ErrorAction Stop
        Write-Host " [OK]" -ForegroundColor Green
        Write-Host "  Status: $($response.status)" -ForegroundColor Gray
        Write-Host "  Qlib Available: $($response.qlib_available)" -ForegroundColor Gray
        Write-Host "  Timestamp: $($response.timestamp)" -ForegroundColor Gray
        
        # Test login
        Write-Host "  Testing login..." -NoNewline
        $loginData = @{
            email = "demo@qlib.com"
            password = "demo123"
        }
        $loginResponse = Invoke-RestMethod -Uri "http://localhost:$port/api/auth/login" -Method Post -Body ($loginData | ConvertTo-Json) -ContentType "application/json" -ErrorAction Stop
        Write-Host " [OK]" -ForegroundColor Green
        
        Write-Host ""
        Write-Host "Backend is working on port $port!" -ForegroundColor Yellow
        Write-Host "Update frontend/.env with: VITE_API_URL=http://localhost:$port" -ForegroundColor Yellow
        break
    }
    catch {
        Write-Host " [FAILED]" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "Frontend should be accessible at http://localhost:3007" -ForegroundColor Green