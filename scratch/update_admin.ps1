$adminFile = "d:\lab001\agrosuste_market\pages\AdminDashboard.tsx"
$scratchFile = "d:\lab001\agrosuste_market\scratch\admin_return.tsx"

# Read original content
$lines = Get-Content $adminFile -Raw
$linesArray = $lines -split "`r`n|`n|`r"

# Slice array to keep the first 346 lines (index 0 to 345)
$keepLines = $linesArray[0..345]

# Join them back
$topPart = $keepLines -join "`n"

# Read replacement content
$replacement = Get-Content $scratchFile -Raw

# Combine
$finalContent = $topPart + "`n`n" + $replacement

# Save back to file
[IO.File]::WriteAllText($adminFile, $finalContent, [System.Text.Encoding]::UTF8)

Write-Host "AdminDashboard.tsx updated successfully."
