import { DbConnection } from '../module_bindings'

const TOKEN_KEY = 'nations_spacetime_token'

export const SPACETIME_HOST =
  import.meta.env.VITE_SPACETIME_HOST ?? 'ws://127.0.0.1:3000'

export const SPACETIME_DB =
  import.meta.env.VITE_SPACETIME_DB ?? 'nations'

export function getStoredToken(): string | undefined {
  return localStorage.getItem(TOKEN_KEY) ?? undefined
}

export function storeToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token)
}

export const connectionBuilder = DbConnection.builder()
  .withUri(SPACETIME_HOST)
  .withDatabaseName(SPACETIME_DB)
  .withToken(getStoredToken())
  .onConnect((_conn, _identity, token) => {
    storeToken(token)
  })
