import {useEffect, useRef, useState} from 'react'
import {MERMAID_CDN_URL, ZOD_MERMAID_CDN_URL} from './cdn.ts'

export type DiagramType = 'er' | 'class' | 'flowchart'
type ColorScheme = 'light' | 'dark'

export const SCHEMA_VISUALIZATION_TIMINGS = {
  debounceMs: 500,
  cdnLoadTimeoutMs: 10_000,
  renderTimeoutMs: 5_000,
} as const

export const SCHEMA_VISUALIZATION_ERROR_CODES = {
  cdnLoad: 'CDN_LOAD_ERROR',
  renderTimeout: 'RENDER_TIMEOUT_ERROR',
} as const

export type MermaidRenderResult = {svg?: string} | string

type MermaidLike = {
  initialize: (config: Record<string, unknown>) => void
  render: (id: string, text: string) => Promise<MermaidRenderResult> | MermaidRenderResult
}

type VisualizationLibraries = {
  generateMermaidDiagram: (
    schema: unknown | unknown[],
    options?: {diagramType?: DiagramType},
  ) => string
  mermaid: MermaidLike
}

let cachedLibrariesPromise: Promise<VisualizationLibraries> | null = null

export function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  errorCode: string,
): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(errorCode))
    }, timeoutMs)

    promise
      .then((result) => {
        clearTimeout(timer)
        resolve(result)
      })
      .catch((error: unknown) => {
        clearTimeout(timer)
        reject(error)
      })
  })
}

async function loadVisualizationLibraries(): Promise<VisualizationLibraries> {
  const getGenerateMermaidDiagram = (
    module: unknown,
  ): VisualizationLibraries['generateMermaidDiagram'] | null => {
    const moduleObject = module as {
      generateMermaidDiagram?: VisualizationLibraries['generateMermaidDiagram']
      default?:
        | VisualizationLibraries['generateMermaidDiagram']
        | {generateMermaidDiagram?: VisualizationLibraries['generateMermaidDiagram']}
    }

    if (typeof moduleObject.generateMermaidDiagram === 'function') {
      return moduleObject.generateMermaidDiagram
    }

    if (typeof moduleObject.default === 'function') {
      return moduleObject.default
    }

    if (
      moduleObject.default &&
      typeof moduleObject.default === 'object' &&
      typeof moduleObject.default.generateMermaidDiagram === 'function'
    ) {
      return moduleObject.default.generateMermaidDiagram
    }

    return null
  }

  const getMermaidRuntime = (module: unknown): MermaidLike | null => {
    const moduleObject = module as {
      default?: MermaidLike
      mermaid?: MermaidLike
    }
    const mermaidExport = moduleObject.default ?? moduleObject.mermaid

    if (!mermaidExport?.initialize || !mermaidExport?.render) {
      return null
    }

    return mermaidExport
  }

  const resolveVisualizationLibraries = (
    zodMermaidModule: unknown,
    mermaidModule: unknown,
  ): VisualizationLibraries => {
    const generateMermaidDiagram = getGenerateMermaidDiagram(zodMermaidModule)
    const mermaid = getMermaidRuntime(mermaidModule)

    if (!generateMermaidDiagram || !mermaid) {
      throw new Error(SCHEMA_VISUALIZATION_ERROR_CODES.cdnLoad)
    }

    return {generateMermaidDiagram, mermaid}
  }

  const loadFromCdn = () =>
    withTimeout(
      Promise.all([
        import(/* @vite-ignore */ ZOD_MERMAID_CDN_URL),
        import(/* @vite-ignore */ MERMAID_CDN_URL),
      ]).then(([zodMermaidModule, mermaidModule]) =>
        resolveVisualizationLibraries(zodMermaidModule, mermaidModule),
      ),
      SCHEMA_VISUALIZATION_TIMINGS.cdnLoadTimeoutMs,
      SCHEMA_VISUALIZATION_ERROR_CODES.cdnLoad,
    )

  const loadFromLocalPackages = async (): Promise<VisualizationLibraries> => {
    const [zodMermaidModule, mermaidModule] = await Promise.all([
      import('zod-mermaid'),
      import('mermaid'),
    ])
    return resolveVisualizationLibraries(zodMermaidModule, mermaidModule)
  }

  if (!cachedLibrariesPromise) {
    cachedLibrariesPromise = (async () => {
      try {
        return await loadFromCdn()
      } catch (cdnError) {
        try {
          return await loadFromLocalPackages()
        } catch {
          throw cdnError
        }
      }
    })()
  }

  try {
    return await cachedLibrariesPromise
  } catch (error) {
    cachedLibrariesPromise = null
    throw error
  }
}

export function mapVisualizationError(error: unknown): string {
  if (error instanceof Error && error.message === SCHEMA_VISUALIZATION_ERROR_CODES.renderTimeout) {
    return 'Diagram generation timed out for this schema.'
  }
  return 'Diagram unavailable - could not load visualization libraries.'
}

export function normalizeRenderedSvg(renderResult: MermaidRenderResult): string {
  if (typeof renderResult === 'string') {
    return renderResult
  }
  return typeof renderResult.svg === 'string' ? renderResult.svg : ''
}

export function isGenerationCurrent(generation: number, currentGeneration: number): boolean {
  return generation === currentGeneration
}

type UseSchemaVisualizationInput = {
  schema?: unknown
  diagramType: DiagramType
  isEnabled: boolean
  colorScheme: ColorScheme
}

type UseSchemaVisualizationResult = {
  svg: string | null
  mermaidText: string
  isLoading: boolean
  error: string | null
}

export function useSchemaVisualization({
  schema,
  diagramType,
  isEnabled,
  colorScheme,
}: UseSchemaVisualizationInput): UseSchemaVisualizationResult {
  const generationRef = useRef(0)
  const [state, setState] = useState<UseSchemaVisualizationResult>({
    svg: null,
    mermaidText: '',
    isLoading: false,
    error: null,
  })

  useEffect(() => {
    if (!schema || !isEnabled) {
      generationRef.current += 1
      setState({
        svg: null,
        mermaidText: '',
        isLoading: false,
        error: null,
      })
      return
    }

    const generation = generationRef.current + 1
    generationRef.current = generation

    const timer = setTimeout(() => {
      void (async () => {
        setState((prev) => ({
          ...prev,
          isLoading: true,
          error: null,
        }))

        try {
          const {generateMermaidDiagram, mermaid} = await loadVisualizationLibraries()
          if (!isGenerationCurrent(generation, generationRef.current)) return

          const mermaidText = generateMermaidDiagram(schema, {diagramType})

          mermaid.initialize({
            startOnLoad: false,
            securityLevel: 'strict',
            theme: colorScheme === 'dark' ? 'dark' : 'default',
          })

          const renderResult = await withTimeout(
            Promise.resolve(mermaid.render(`schema-viz-${generation}`, mermaidText)),
            SCHEMA_VISUALIZATION_TIMINGS.renderTimeoutMs,
            SCHEMA_VISUALIZATION_ERROR_CODES.renderTimeout,
          )
          if (!isGenerationCurrent(generation, generationRef.current)) return

          const svg = normalizeRenderedSvg(renderResult)

          if (!svg) {
            throw new Error(SCHEMA_VISUALIZATION_ERROR_CODES.renderTimeout)
          }

          setState({
            svg,
            mermaidText,
            isLoading: false,
            error: null,
          })
        } catch (error) {
          if (!isGenerationCurrent(generation, generationRef.current)) return
          setState({
            svg: null,
            mermaidText: '',
            isLoading: false,
            error: mapVisualizationError(error),
          })
        }
      })()
    }, SCHEMA_VISUALIZATION_TIMINGS.debounceMs)

    return () => {
      clearTimeout(timer)
    }
  }, [schema, diagramType, isEnabled, colorScheme])

  return state
}
