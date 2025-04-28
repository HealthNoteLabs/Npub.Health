$files = git ls-tree -r --name-only HEAD

foreach ($file in $files) {
    if ($file -like "Npub.Health-main/*") {
        $targetPath = $file.Substring("Npub.Health-main/".Length)
        
        # Ensure target directory exists
        $dir = Split-Path -Path $targetPath -Parent
        if ($dir -and -not (Test-Path $dir)) {
            New-Item -ItemType Directory -Path $dir -Force | Out-Null
        }
        
        Write-Host "Moving $file to $targetPath"
        git mv $file $targetPath
    }
}

# Remove the empty directory
git rm -r --cached Npub.Health-main 