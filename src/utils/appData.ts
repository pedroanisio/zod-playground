import LZString from 'lz-string'

import {DEFAULT_APP_DATA, STORAGE_KEY} from '../constants'

export type AppData = {
  schema: string
  values: string[]
  version: string
  isZodMini: boolean
} | null

function parseAppData(appData: string): AppData {
  try {
    const parsed = JSON.parse(appData) as unknown
    if (!parsed || typeof parsed !== 'object') return null
    const record = parsed as Record<string, unknown>

    const schema =
      typeof record.schema === 'string' ? record.schema : DEFAULT_APP_DATA.schema
    const parsedValues = Array.isArray(record.values)
      ? record.values.filter((value): value is string => typeof value === 'string')
      : DEFAULT_APP_DATA.values
    const values = parsedValues.length > 0 ? parsedValues : DEFAULT_APP_DATA.values
    const version =
      typeof record.version === 'string' && record.version.length > 0
        ? record.version
        : DEFAULT_APP_DATA.version

    // backward compatibility
    const isZodMini = typeof record.isZodMini === 'boolean' ? record.isZodMini : false

    return {
      schema,
      values,
      version,
      isZodMini,
    }
  } catch {
    return null
  }
}

export function getAppDataFromLocalStorage(): AppData {
  const appData = localStorage.getItem(STORAGE_KEY)
  return appData ? parseAppData(appData) : null
}

export function getAppDataFromSearchParams(): AppData {
  const urlParams = new URLSearchParams(window.location.search)
  const compressedAppData = urlParams.get('appdata')

  if (compressedAppData) {
    const appData = LZString.decompressFromEncodedURIComponent(compressedAppData)
    if (!appData) return null
    return parseAppData(appData)
  }

  return null
}

export function getURLwithAppData(appData: AppData): string {
  const queryParams = new URLSearchParams()
  const compressedAppData = LZString.compressToEncodedURIComponent(JSON.stringify(appData))

  queryParams.set('appdata', compressedAppData)

  return `${window.location.protocol}//${window.location.host}?${queryParams}`
}
