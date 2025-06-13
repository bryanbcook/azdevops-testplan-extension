
Function New-Attachment {
    param(
        [string]$fileName,
        [int]$size = 1024
    )
    
    # generate an array of bytes of the specified size
    # write the bytes to a file
    $bytes = New-Object byte[] $size
    [System.IO.File]::WriteAllBytes($fileName, $bytes)
}