param(
  [Parameter(Mandatory = $true)]
  [string]$ProjectRef
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

Write-Host "Linking CLI to dedicated project $ProjectRef..."
npx --yes supabase link --project-ref $ProjectRef

Write-Host "Applying migrations..."
npx --yes supabase db push

Write-Host @"

Next:
1. Restore the Lovable Cloud export (tables + auth.users) if you have it.
2. Create an admin user in Authentication > Users if Auth was not restored.
3. Edit supabase/seed_admin.sql with that email and run it in the SQL editor.
4. Enable Google in Authentication > Providers (client ID/secret + redirect URLs).
5. Copy .env.example to .env with this project's URL and keys.

"@
