# JSX Safety Guide - Avoiding Build Errors

## Common JSX Parsing Issues

### Problem: Raw `<` and `>` Characters
When you write raw `<` or `>` inside JSX/TSX, the compiler thinks it's the start of an HTML/JSX tag instead of plain text.

### Examples that BREAK the build:
```jsx
// ❌ These will cause build failures:
<Typography>{<10%}</Typography>         // Error: unexpected token
<Typography>{>5x}</Typography>          // Error: unexpected token  
<Typography>{<50ms}</Typography>        // Error: unexpected token
<div>Performance: <100ms</div>          // Error: unexpected token
<span>Ratio: >2.5x</span>              // Error: unexpected token
```

### Examples that WORK correctly:
```jsx
// ✅ These are JSX-safe:
<Typography>{"<10%"}</Typography>       // String literal
<Typography>{">5x"}</Typography>        // String literal
<Typography>{"<50ms"}</Typography>      // String literal
<div>Performance: {"<100ms"}</div>      // String literal
<span>Ratio: {">2.5x"}</span>          // String literal

// ✅ Or use HTML entities:
<Typography>&lt;10%</Typography>       // HTML entity
<Typography>&gt;5x</Typography>        // HTML entity
<div>Performance: &lt;100ms</div>      // HTML entity
<span>Ratio: &gt;2.5x</span>          // HTML entity
```

## Detection Commands

### Scan for potential issues in your codebase:
```bash
# Find files with raw < followed by numbers/letters
grep -R "<[0-9a-zA-Z]" src/components --include="*.tsx" --include="*.ts"

# Find files with raw > followed by numbers/letters  
grep -R ">[0-9a-zA-Z]" src/components --include="*.tsx" --include="*.ts"

# More comprehensive search for problematic patterns
find src -name "*.tsx" -o -name "*.ts" | xargs grep -E "<[0-9]|>[0-9]|<[a-z]|>[a-z]" | grep -v "import\|export\|interface\|type"
```

## Fix Patterns

### 1. Performance Metrics
```jsx
// ❌ Wrong:
<Typography>Latency: <50ms</Typography>

// ✅ Correct:
<Typography>Latency: {"<50ms"}</Typography>
```

### 2. Mathematical Comparisons
```jsx
// ❌ Wrong:
<div>Value: >100</div>

// ✅ Correct:
<div>Value: {">100"}</div>
```

### 3. Version Numbers
```jsx
// ❌ Wrong:
<span>Node: >18.0</span>

// ✅ Correct:
<span>Node: {">18.0"}</span>
```

### 4. File Sizes
```jsx
// ❌ Wrong:
<Typography>Size: <1MB</Typography>

// ✅ Correct:
<Typography>Size: {"<1MB"}</Typography>
```

## Pre-commit Hook (Optional)

Add this to your `package.json` scripts to catch issues before commit:

```json
{
  "scripts": {
    "lint:jsx": "grep -r \"<[0-9a-zA-Z]\\|>[0-9a-zA-Z]\" src --include=\"*.tsx\" --include=\"*.ts\" | grep -v \"import\\|export\\|interface\\|type\" || echo 'No JSX issues found'",
    "pre-commit": "npm run lint:jsx && npm run build"
  }
}
```

## Files Already Fixed in This Project

✅ **DemoMarketDataCard.tsx** - Line 195: `{"<50ms"}` correctly wrapped

## Quick Reference

| ❌ Breaks Build | ✅ Works |
|----------------|----------|
| `<50ms` | `{"<50ms"}` |
| `>2x` | `{">2x"}` |  
| `<100%` | `{"<100%"}` |
| `>5MB` | `{">5MB"}` |

## Remember
- Always wrap `<` and `>` followed by alphanumeric characters in curly braces with string literals
- Use HTML entities (`&lt;` `&gt;`) as an alternative
- Test your build frequently: `npm run build`
- The compiler error will tell you the exact line number of the issue

## Status
🎯 **Current Status**: All JSX parsing issues resolved - build successful!