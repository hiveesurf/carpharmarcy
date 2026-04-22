#!/usr/bin/env bash
# Link selected cursor-rules-java .md rule files into .cursor/rules/ as .mdc symlinks.
# Default source: ~/Downloads/cursor-rules-java-main/.cursor/rules
# Override: export CURSOR_JAVA_RULES_SRC=/path/to/.cursor/rules

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SRC="${CURSOR_JAVA_RULES_SRC:-$HOME/Downloads/cursor-rules-java-main/.cursor/rules}"
DEST="$ROOT/.cursor/rules"

if [[ ! -d "$SRC" ]]; then
  echo "Source directory not found: $SRC" >&2
  echo "Clone or unpack cursor-rules-java, then set CURSOR_JAVA_RULES_SRC to its .cursor/rules path." >&2
  exit 1
fi

mkdir -p "$DEST"

# Rules most relevant to this Spring Boot + Maven + Flyway backend
RULE_IDS=(
  301-frameworks-spring-boot-core
  302-frameworks-spring-boot-rest
  311-frameworks-spring-jdbc
  312-frameworks-spring-data-jdbc
  313-frameworks-spring-db-migrations-flyway
  321-frameworks-spring-boot-testing-unit-tests
  322-frameworks-spring-boot-testing-integration-tests
  323-frameworks-spring-boot-testing-acceptance-tests
  030-architecture-adr-general
  033-architecture-diagrams
  031-architecture-adr-functional-requirements
  032-architecture-adr-non-functional-requirements
  110-java-maven-best-practices
  111-java-maven-dependencies
  112-java-maven-plugins
  113-java-maven-documentation
  123-java-exception-handling
  124-java-secure-coding
  040-planning-plan-mode
)

linked=0
missing=0
for id in "${RULE_IDS[@]}"; do
  f="$SRC/${id}.md"
  if [[ -f "$f" ]]; then
    ln -sf "$f" "$DEST/${id}.mdc"
    ((linked++)) || true
  else
    echo "Optional rule not found (skip): $f" >&2
    ((missing++)) || true
  fi
done

echo "Linked $linked rules into $DEST (from $SRC)."
if ((missing > 0)); then
  echo "Note: $missing ids were missing — your clone may be a different version." >&2
fi
