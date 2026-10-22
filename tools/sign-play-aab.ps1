param(
 [Parameter(Mandatory=$true)][string]$AabPath,
 [Parameter(Mandatory=$true)][string]$KeystorePath,
 [string]$Alias='soulbeast-upload',
 [string]$JdkBin='',
 [switch]$CreateKey
)
# Run interactively by the owner. Never put a password, keystore, or service-account key in Git/chat.
$ErrorActionPreference='Stop'
$bundle=(Resolve-Path -LiteralPath $AabPath).Path
if([IO.Path]::GetExtension($bundle) -ne '.aab'){throw 'Expected an Android App Bundle (.aab)'}
$keyPath=[IO.Path]::GetFullPath($KeystorePath)
$signer=if($JdkBin){Join-Path $JdkBin 'jarsigner.exe'}else{'jarsigner'}
$keytool=if($JdkBin){Join-Path $JdkBin 'keytool.exe'}else{'keytool'}
Get-Command $signer -ErrorAction Stop | Out-Null
if($CreateKey -and (Test-Path -LiteralPath $keyPath)){throw 'Refusing to overwrite an existing upload keystore'}
if(-not $CreateKey -and -not(Test-Path -LiteralPath $keyPath)){throw 'Upload keystore not found'}
$secret=Read-Host 'Upload keystore password (owner only, minimum 6 characters)' -AsSecureString
$secretPtr=[Runtime.InteropServices.Marshal]::SecureStringToBSTR($secret)
try{
 $plain=[Runtime.InteropServices.Marshal]::PtrToStringBSTR($secretPtr)
 if($plain.Length -lt 6){throw 'Password must contain at least 6 characters'}
 $env:SB_AAB_PRIVATE_PASSWORD=$plain
 if($CreateKey){
  Get-Command $keytool -ErrorAction Stop | Out-Null
  $confirm=Read-Host 'Confirm upload keystore password' -AsSecureString
  $confirmPtr=[Runtime.InteropServices.Marshal]::SecureStringToBSTR($confirm)
  try{if([Runtime.InteropServices.Marshal]::PtrToStringBSTR($confirmPtr) -cne $plain){throw 'Passwords do not match'}}finally{[Runtime.InteropServices.Marshal]::ZeroFreeBSTR($confirmPtr)}
  $parent=[IO.Path]::GetDirectoryName($keyPath)
  if(-not(Test-Path -LiteralPath $parent)){New-Item -ItemType Directory -Path $parent | Out-Null}
  & $keytool -genkeypair -keystore $keyPath -storetype PKCS12 -alias $Alias -keyalg RSA -keysize 3072 -validity 10000 -dname 'CN=Soulbeast Upload,O=Soulbeast,C=TH' -storepass:env SB_AAB_PRIVATE_PASSWORD -keypass:env SB_AAB_PRIVATE_PASSWORD
  if($LASTEXITCODE -ne 0){throw 'Upload key creation failed'}
 }
 $signed=[IO.Path]::Combine([IO.Path]::GetDirectoryName($bundle),[IO.Path]::GetFileNameWithoutExtension($bundle)+'-signed.aab')
 if(Test-Path -LiteralPath $signed){throw 'Refusing to overwrite an existing signed bundle'}
 & $signer -keystore $keyPath -storepass:env SB_AAB_PRIVATE_PASSWORD -keypass:env SB_AAB_PRIVATE_PASSWORD -signedjar $signed $bundle $Alias
 if($LASTEXITCODE -ne 0){throw 'AAB signing failed'}
 & $signer -verify $signed
 if($LASTEXITCODE -ne 0){throw 'AAB signature verification failed'}
 Write-Output "Signed bundle: $signed"
 Write-Output 'Back up your upload keystore and password privately. Do not send them in chat.'
}finally{
 Remove-Item Env:SB_AAB_PRIVATE_PASSWORD -ErrorAction SilentlyContinue
 $plain=$null
 [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($secretPtr)
 $secret.Dispose()
}
