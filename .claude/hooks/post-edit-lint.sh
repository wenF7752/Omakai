#!/bin/bash
# PostToolUse hook: lint ONLY the single file that was just edited/written
# stdin receives JSON: {"tool_name":"Edit","tool_input":{"file_path":"/abs/path/file.ts"}}
FILE=$(node -e "let d='';process.stdin.on('data',c=>d+=c);process.stdin.on('end',()=>process.stdout.write(JSON.parse(d).tool_input.file_path||''))")

if [[ ! "$FILE" =~ \.(ts|tsx|js|jsx|mjs|cjs)$ ]]; then
  exit 0
fi

OUTPUT=$(npx eslint "$FILE" 2>&1)
EXIT_CODE=$?

if [ $EXIT_CODE -ne 0 ] && [ -n "$OUTPUT" ]; then
  # Strip the outer quotes from JSON.stringify so we can splice the value into our outer string literal cleanly.
  ESCAPED=$(echo "$OUTPUT" | node -e "let d='';process.stdin.on('data',c=>d+=c);process.stdin.on('end',()=>{const s=JSON.stringify(d);process.stdout.write(s.slice(1,-1))})")
  echo "{\"hookSpecificOutput\":{\"hookEventName\":\"PostToolUse\",\"additionalContext\":\"Lint errors found:\\n${ESCAPED}\"}}"
fi
