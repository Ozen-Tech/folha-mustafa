#!/bin/bash
# Publica o repositório no GitHub
# Pré-requisito: git config --global user.email "seu@email.com"
#               git config --global user.name "Seu Nome"

set -e
cd "$(dirname "$0")"

git add -A
git commit -m "Initial commit: sistema de folha de pagamento Mustafá"

REPO_NAME="${1:-folha-mustafa}"
gh repo create "$REPO_NAME" --public --source=. --remote=origin --push

echo "✓ Publicado em: https://github.com/$(gh api user -q .login)/$REPO_NAME"
