param(
    [Parameter(Mandatory = $true)]
    [string]$DocxPath,

    [Parameter(Mandatory = $true)]
    [string]$PdfPath
)

$resolvedDocx = (Resolve-Path -LiteralPath $DocxPath).Path
$resolvedPdf = [System.IO.Path]::GetFullPath($PdfPath)
$pdfDirectory = [System.IO.Path]::GetDirectoryName($resolvedPdf)

if (-not (Test-Path -LiteralPath $pdfDirectory)) {
    New-Item -ItemType Directory -Path $pdfDirectory -Force | Out-Null
}

$word = $null
$document = $null

try {
    $word = New-Object -ComObject Word.Application
    $word.Visible = $false
    $word.DisplayAlerts = 0

    $document = $word.Documents.Open($resolvedDocx, $false, $false)

    foreach ($field in $document.Fields) {
        $field.Update() | Out-Null
    }

    foreach ($section in $document.Sections) {
        foreach ($header in $section.Headers) {
            foreach ($field in $header.Range.Fields) {
                $field.Update() | Out-Null
            }
        }
        foreach ($footer in $section.Footers) {
            foreach ($field in $footer.Range.Fields) {
                $field.Update() | Out-Null
            }
        }
    }

    $document.Save()
    $document.ExportAsFixedFormat($resolvedPdf, 17)
    Write-Output $resolvedPdf
}
finally {
    if ($null -ne $document) {
        $document.Close($false)
        [void][System.Runtime.InteropServices.Marshal]::ReleaseComObject($document)
    }
    if ($null -ne $word) {
        $word.Quit()
        [void][System.Runtime.InteropServices.Marshal]::ReleaseComObject($word)
    }
    [GC]::Collect()
    [GC]::WaitForPendingFinalizers()
}
