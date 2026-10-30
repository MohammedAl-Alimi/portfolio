#!/usr/bin/env bash
# Fast pre-push scan for secrets and personal information that must never enter the repo.
# Complements gitleaks; this catches project-specific strings gitleaks does not know about.
set -euo pipefail

cd "$(git rev-parse --show-toplevel)"

patterns=(
  'sk_live_'
  'sk-ant-'
  'AKIA[0-9A-Z]{16}'
  'ghp_[A-Za-z0-9]{36}'
  'github_pat_'
  'xox[baprs]-'
  '-----BEGIN (RSA|EC|OPENSSH|PGP) PRIVATE KEY-----'
  'eyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}\.'
  '/Users/[a-z-]+/'
  'act\.3'
  'act3'
)

status=0
for p in "${patterns[@]}"; do
  if hits=$(git ls-files -z | xargs -0 grep -nEI -- "$p" 2>/dev/null | grep -v -E '^(scripts/check-secrets\.sh|CLAUDE\.md):'); then
    if [ -n "$hits" ]; then
      echo "check-secrets: pattern '$p' found:" >&2
      echo "$hits" >&2
      status=1
    fi
  fi
done

# The contact email is allowed in content/profile.json and security.txt only (exact paths).
if hits=$(git ls-files -z | xargs -0 grep -nEI -- 'alalimim14' 2>/dev/null | grep -v -E '^(scripts/check-secrets\.sh|CLAUDE\.md|content/profile\.json|public/\.well-known/security\.txt):'); then
  if [ -n "$hits" ]; then
    echo "check-secrets: pattern 'alalimim14' found:" >&2
    echo "$hits" >&2
    status=1
  fi
fi

if git ls-files | grep -Eq '(^|/)\.env($|\.(local|production|development)$)'; then
  echo "check-secrets: an .env file is tracked" >&2
  status=1
fi

if [ "$status" -eq 0 ]; then
  echo "check-secrets: clean"
fi
exit "$status"
