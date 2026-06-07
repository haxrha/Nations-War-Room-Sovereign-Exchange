export type StrategyChatRole = 'user' | 'assistant'

export type StrategyGenerateMode = 'generate' | 'refine' | 'explain'

export type StrategyChatTurn = {
  role: StrategyChatRole
  content: string
}

export type StrategyGameSnapshot = {
  tick: number
  myCountry: {
    name: string
    balance: number
    gdpScore: number
    resources: Record<string, number>
  }
  spotPrices: Record<string, number>
  commodities: { id: string; symbol: string; name: string; unit: string }[]
  openOffersCount: number
  myOpenOffersCount: number
  cheapestOffersBySymbol: Record<
    string,
    { pricePerUnit: number; qty: number; sellerIsBot: boolean } | undefined
  >
}

export type StrategyPreferences = {
  risk?: 'conservative' | 'moderate' | 'aggressive'
  focusSymbols?: string[]
}

export type GenerateStrategyRequest = {
  message: string
  mode?: StrategyGenerateMode
  chatHistory?: StrategyChatTurn[]
  context?: {
    currentCode?: string
    sampleId?: string
    sampleCode?: string
    gameSnapshot?: StrategyGameSnapshot | null
  }
  preferences?: StrategyPreferences
}

export type GeneratedStrategy = {
  name: string
  summary: string
  code: string
  assumptions: string[]
  risks: string[]
  parameters: Record<string, unknown>
}

export type StrategyValidation = {
  syntaxOk: boolean
  hasMyBot: boolean
  forbiddenPatterns: string[]
  warnings: string[]
}

export type GenerateStrategySuccess = {
  ok: true
  strategy: GeneratedStrategy
  validation: StrategyValidation
  usage?: {
    model: string
    inputTokens?: number
    outputTokens?: number
  }
}

export type GenerateStrategyFailure = {
  ok: false
  error: {
    code: string
    message: string
    retryable: boolean
  }
}

export type GenerateStrategyResponse = GenerateStrategySuccess | GenerateStrategyFailure
