# Get Functions 
$private = Get-ChildItem -Path (Join-Path $PSScriptRoot Private) -Include *.ps1 -File -Recurse
$public = Get-ChildItem -Path (Join-Path $PSScriptRoot Public) -Include *.ps1 -File -Recurse 
 
# Dot source to scope 
# load private scripts first 
($private + $public) | ForEach-Object {
     try {
         Write-Verbose "Loading $($_.FullName)"
         . $_.FullName
     }
     catch {
         Write-Warning $_.Exception.Message
     }
}  
 
# Expose public functions. Assumes that function name and file name match 
$publicFunctions = $public | Select-Object -ExpandProperty BaseName
Export-ModuleMember -Function $publicFunctions