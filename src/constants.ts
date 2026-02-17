import type {editor} from 'monaco-editor'
import * as zod from './zod'

export const EDITOR_OPTIONS: editor.IStandaloneEditorConstructionOptions = {
  minimap: {
    enabled: false,
  },
  scrollBeyondLastLine: false,
  scrollbar: {
    useShadows: false,
  },
  overviewRulerBorder: false,
  hideCursorInOverviewRuler: true,
  automaticLayout: true,
  formatOnType: true,
  formatOnPaste: true,
  renderLineHighlight: 'none',
}

const schema = `z.object({
  name: z.string(),
  birth_year: z.number().optional()
})`

const values = ['{name: "John"}']

const FALLBACK_ZOD_VERSION = '4.0.0'
const DEFAULT_VERSION_TIMEOUT_MS = 2000

async function getDefaultVersion(): Promise<string> {
  try {
    const versionPromise = zod.getVersions('latest').then((versions) => versions[0]?.version)
    const timeoutPromise = new Promise<undefined>((resolve) => {
      setTimeout(() => resolve(undefined), DEFAULT_VERSION_TIMEOUT_MS)
    })
    const version = await Promise.race([versionPromise, timeoutPromise])
    return version ?? FALLBACK_ZOD_VERSION
  } catch {
    return FALLBACK_ZOD_VERSION
  }
}

const version = await getDefaultVersion()

export const DEFAULT_APP_DATA = {
  schema,
  values,
  version,
  isZodMini: false,
}

export const STORAGE_KEY = 'zod-playground'
