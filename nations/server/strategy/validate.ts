const FORBIDDEN_PATTERNS: { pattern: RegExp; label: string }[] = [
  { pattern: /\bfetch\s*\(/, label: 'fetch()' },
  { pattern: /\bimport\s+/, label: 'import' },
  { pattern: /\brequire\s*\(/, label: 'require()' },
  { pattern: /\beval\s*\(/, label: 'eval()' },
  { pattern: /\bFunction\s*\(/, label: 'Function constructor' },
  { pattern: /\bwhile\s*\(\s*true\s*\)/, label: 'while(true)' },
  { pattern: /\bfor\s*\(\s*;\s*;\s*\)/, label: 'infinite for-loop' },
  { pattern: /\bXMLHttpRequest\b/, label: 'XMLHttpRequest' },
  { pattern: /\bWebSocket\b/, label: 'WebSocket' },
  { pattern: /\blocalStorage\b/, label: 'localStorage' },
  { pattern: /\bsessionStorage\b/, label: 'sessionStorage' },
]

export function validateStrategyCode(code: string): {
  syntaxOk: boolean
  hasMyBot: boolean
  forbiddenPatterns: string[]
  warnings: string[]
} {
  const forbiddenPatterns: string[] = []
  const warnings: string[] = []

  for (const { pattern, label } of FORBIDDEN_PATTERNS) {
    if (pattern.test(code)) forbiddenPatterns.push(label)
  }

  const hasMyBot = /function\s+myBot\s*\(/.test(code) || /const\s+myBot\s*=/.test(code)
  if (!hasMyBot) warnings.push('Code should define function myBot(gameState)')

  if (/offerId\s*:\s*["'`]\d+["'`]/.test(code)) {
    warnings.push('Avoid hard-coded offerId values — select from openOffers at runtime')
  }

  let syntaxOk = true
  try {
    // eslint-disable-next-line no-new-func
    new Function(code)
  } catch {
    syntaxOk = false
    warnings.push('JavaScript syntax check failed')
  }

  return { syntaxOk, hasMyBot, forbiddenPatterns, warnings }
}

export function isStrategyCodeSafe(code: string): boolean {
  const v = validateStrategyCode(code)
  return v.syntaxOk && v.hasMyBot && v.forbiddenPatterns.length === 0
}
