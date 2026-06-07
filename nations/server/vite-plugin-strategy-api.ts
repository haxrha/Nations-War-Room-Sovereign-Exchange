import type { Plugin } from 'vite'
import { loadEnv } from 'vite'
import type { GenerateStrategyRequest } from '../src/lib/strategy-api-types.ts'
import type { ExplainTradeRequest } from '../src/lib/trade-explain-types.ts'
import type { ProfileAnalyticsRequest } from '../src/lib/profile-analytics-types.ts'
import { handleStrategyGenerate } from './strategy/generate.ts'
import { handleTradeExplain } from './trade/explain.ts'
import { handleProfileAnalytics } from './profile/analytics.ts'

function readJsonBody(req: import('http').IncomingMessage): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = []
    req.on('data', (chunk: Buffer) => chunks.push(chunk))
    req.on('end', () => {
      try {
        const raw = Buffer.concat(chunks).toString('utf8')
        resolve(raw ? JSON.parse(raw) : {})
      } catch (e) {
        reject(e)
      }
    })
    req.on('error', reject)
  })
}

function clientKeyFromReq(req: import('http').IncomingMessage): string {
  return (
    (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ??
    req.socket.remoteAddress ??
    'local'
  )
}

export function strategyApiPlugin(): Plugin {
  return {
    name: 'nations-strategy-api',
    configureServer(server) {
      const env = loadEnv(server.config.mode, server.config.root, '')
      const apiKey = env.GEMINI_API_KEY ?? process.env.GEMINI_API_KEY ?? ''

      server.middlewares.use(async (req, res, next) => {
        const url = req.url?.split('?')[0] ?? ''

        if (url === '/api/strategy/generate' && req.method === 'POST') {
          res.setHeader('Content-Type', 'application/json')
          try {
            const body = (await readJsonBody(req)) as GenerateStrategyRequest
            const result = await handleStrategyGenerate(body, {
              apiKey,
              clientKey: clientKeyFromReq(req),
            })
            res.statusCode = result.ok ? 200 : 400
            res.end(JSON.stringify(result))
          } catch {
            res.statusCode = 500
            res.end(
              JSON.stringify({
                ok: false,
                error: {
                  code: 'SERVER_ERROR',
                  message: 'Failed to process strategy request',
                  retryable: true,
                },
              }),
            )
          }
          return
        }

        if (url === '/api/trade/explain' && req.method === 'POST') {
          res.setHeader('Content-Type', 'application/json')
          try {
            const body = (await readJsonBody(req)) as ExplainTradeRequest
            const result = await handleTradeExplain(body, {
              apiKey,
              clientKey: clientKeyFromReq(req),
            })
            res.statusCode = result.ok ? 200 : 400
            res.end(JSON.stringify(result))
          } catch {
            res.statusCode = 500
            res.end(
              JSON.stringify({
                ok: false,
                error: {
                  code: 'SERVER_ERROR',
                  message: 'Failed to explain trade',
                  retryable: true,
                },
              }),
            )
          }
          return
        }

        if (url === '/api/profile/analytics' && req.method === 'POST') {
          res.setHeader('Content-Type', 'application/json')
          try {
            const body = (await readJsonBody(req)) as ProfileAnalyticsRequest
            const result = await handleProfileAnalytics(body, {
              apiKey,
              clientKey: clientKeyFromReq(req),
            })
            res.statusCode = result.ok ? 200 : 400
            res.end(JSON.stringify(result))
          } catch {
            res.statusCode = 500
            res.end(
              JSON.stringify({
                ok: false,
                error: {
                  code: 'SERVER_ERROR',
                  message: 'Failed to generate profile analytics',
                  retryable: true,
                },
              }),
            )
          }
          return
        }

        next()
      })
    },
  }
}
