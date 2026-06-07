import type { Plugin } from 'vite'
import { loadEnv } from 'vite'
import type { GenerateStrategyRequest } from '../src/lib/strategy-api-types.ts'
import { handleStrategyGenerate } from './strategy/generate.ts'

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

export function strategyApiPlugin(): Plugin {
  return {
    name: 'nations-strategy-api',
    configureServer(server) {
      const env = loadEnv(server.config.mode, server.config.root, '')
      const apiKey = env.GEMINI_API_KEY ?? process.env.GEMINI_API_KEY ?? ''

      server.middlewares.use(async (req, res, next) => {
        if (!req.url?.startsWith('/api/strategy/generate') || req.method !== 'POST') {
          next()
          return
        }

        res.setHeader('Content-Type', 'application/json')

        try {
          const body = (await readJsonBody(req)) as GenerateStrategyRequest
          const clientKey =
            (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ??
            req.socket.remoteAddress ??
            'local'

          const result = await handleStrategyGenerate(body, { apiKey, clientKey })
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
      })
    },
  }
}
