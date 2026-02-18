import {
  ActionIcon,
  Alert,
  Box,
  Button,
  CopyButton,
  Flex,
  SegmentedControl,
  Text,
  Tooltip,
} from '@mantine/core'
import {notifications} from '@mantine/notifications'
import {type CSSProperties, useEffect, useMemo, useRef, useState} from 'react'
import {FiCheck, FiCopy, FiDownload, FiImage, FiInfo, FiMinus, FiPlus} from 'react-icons/fi'
import classes from './SchemaVisualization.module.css'
import {
  type DiagramType,
  SCHEMA_VISUALIZATION_TIMINGS,
  useSchemaVisualization,
} from './useSchemaVisualization.ts'

type ColorScheme = 'light' | 'dark'

type SchemaVisualizationProps = {
  schema?: unknown
  colorScheme: ColorScheme
  isZod4: boolean
  schemaError?: string
}

const DIAGRAM_LABELS: Record<DiagramType, string> = {
  er: 'ER',
  class: 'Class',
  flowchart: 'Flowchart',
}

const PRIMITIVE_SCHEMA_TYPES = new Set([
  'string',
  'number',
  'boolean',
  'bigint',
  'symbol',
  'null',
  'undefined',
  'literal',
  'enum',
  'date',
])

const ZOOM_RANGE = {
  min: 0.5,
  max: 2,
  step: 0.1,
} as const

function getSchemaDefType(schema?: unknown): string | null {
  if (!schema || typeof schema !== 'object') {
    return null
  }

  const schemaObject = schema as {def?: {type?: unknown}}
  const defType = schemaObject.def?.type

  return typeof defType === 'string' ? defType : null
}

function getPrimitiveSchemaType(schema?: unknown): string | null {
  const type = getSchemaDefType(schema)

  if (!type || type === 'object') {
    return null
  }

  return PRIMITIVE_SCHEMA_TYPES.has(type) ? type : null
}

function downloadBlob(blob: Blob, filename: string) {
  const objectUrl = URL.createObjectURL(blob)
  const link = document.createElement('a')

  link.href = objectUrl
  link.download = filename
  document.body.append(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(objectUrl)
}

function getSvgExportSize(svgMarkup: string): {width: number; height: number} {
  const fallback = {width: 1600, height: 900}
  const parsedSvg = new DOMParser().parseFromString(svgMarkup, 'image/svg+xml').documentElement

  const [, , viewBoxWidth, viewBoxHeight] = (parsedSvg
    .getAttribute('viewBox')
    ?.split(/\s+/)
    .map(Number) ?? []) as Array<number | undefined>
  const widthFromViewBox =
    Number.isFinite(viewBoxWidth) && viewBoxWidth && viewBoxWidth > 0 ? viewBoxWidth : undefined
  const heightFromViewBox =
    Number.isFinite(viewBoxHeight) && viewBoxHeight && viewBoxHeight > 0 ? viewBoxHeight : undefined
  const widthFromAttribute = Number.parseFloat(parsedSvg.getAttribute('width') ?? '')
  const heightFromAttribute = Number.parseFloat(parsedSvg.getAttribute('height') ?? '')

  const width =
    widthFromViewBox ??
    (Number.isFinite(widthFromAttribute) && widthFromAttribute > 0 ? widthFromAttribute : undefined)
  const height =
    heightFromViewBox ??
    (Number.isFinite(heightFromAttribute) && heightFromAttribute > 0
      ? heightFromAttribute
      : undefined)

  if (width && height) {
    return {width: Math.round(width), height: Math.round(height)}
  }

  if (width && !height) {
    return {width: Math.round(width), height: Math.round((width * 9) / 16)}
  }

  if (!width && height) {
    return {width: Math.round((height * 16) / 9), height: Math.round(height)}
  }

  return fallback
}

export function SchemaVisualization({
  schema,
  colorScheme,
  isZod4,
  schemaError,
}: SchemaVisualizationProps) {
  const [diagramType, setDiagramType] = useState<DiagramType>('er')
  const [zoomLevel, setZoomLevel] = useState(1)
  const [fitToWidth, setFitToWidth] = useState(true)
  const [baseSvgSize, setBaseSvgSize] = useState<{width: number; height: number} | null>(null)
  const diagramCanvasRef = useRef<HTMLDivElement | null>(null)

  const primitiveType = useMemo(() => getPrimitiveSchemaType(schema), [schema])
  const hasRenderableSchema = Boolean(schema) && !schemaError

  const {svg, mermaidText, isLoading, error} = useSchemaVisualization({
    schema,
    diagramType,
    isEnabled: isZod4 && hasRenderableSchema,
    colorScheme,
  })

  const liveMessage = error
    ? error
    : isLoading
      ? 'Generating schema diagram.'
      : svg
        ? `${DIAGRAM_LABELS[diagramType]} diagram generated.`
        : ''

  const ariaLabel = `${DIAGRAM_LABELS[diagramType]} diagram of schema`
  const zoomPercent = Math.round(zoomLevel * 100)

  useEffect(() => {
    if (!svg) {
      setBaseSvgSize(null)
      return
    }

    const svgElement = diagramCanvasRef.current?.querySelector('svg')
    if (!svgElement) {
      setBaseSvgSize(null)
      return
    }

    const viewBoxWidth = svgElement.viewBox.baseVal?.width
    const viewBoxHeight = svgElement.viewBox.baseVal?.height
    const attrWidth = Number.parseFloat(svgElement.getAttribute('width') ?? '')
    const attrHeight = Number.parseFloat(svgElement.getAttribute('height') ?? '')
    const rect = svgElement.getBoundingClientRect()

    const width = [viewBoxWidth, attrWidth, rect.width].find(
      (value) => Number.isFinite(value) && value > 0,
    )
    const height = [viewBoxHeight, attrHeight, rect.height].find(
      (value) => Number.isFinite(value) && value > 0,
    )

    if (width && height) {
      setBaseSvgSize({width, height})
      return
    }

    setBaseSvgSize(null)
  }, [svg])

  const zoomScale = fitToWidth ? 1 : zoomLevel
  const scaledCanvasSize =
    !fitToWidth && baseSvgSize
      ? {
          width: `${Math.ceil(baseSvgSize.width * zoomScale)}px`,
          minHeight: `${Math.ceil(baseSvgSize.height * zoomScale)}px`,
        }
      : undefined
  const exportBaseName = `schema-diagram-${diagramType}`

  const handleExportSvg = () => {
    if (!svg) return

    downloadBlob(new Blob([svg], {type: 'image/svg+xml;charset=utf-8'}), `${exportBaseName}.svg`)
    notifications.show({
      title: 'Exported SVG',
      message: `${exportBaseName}.svg`,
    })
  }

  const handleExportPng = async () => {
    if (!svg) return

    try {
      const {Canvg} = await import('canvg')
      const {width, height} = getSvgExportSize(svg)
      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height

      const ctx = canvas.getContext('2d')
      if (!ctx) {
        throw new Error('Canvas context is not available for PNG export.')
      }

      ctx.clearRect(0, 0, width, height)
      const canvgRenderer = Canvg.fromString(ctx, svg, {
        ignoreAnimation: true,
        ignoreMouse: true,
        ignoreDimensions: true,
      })
      await canvgRenderer.render()

      const pngBlob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob((result) => {
          if (!result) {
            reject(new Error('Failed to encode PNG image.'))
            return
          }
          resolve(result)
        }, 'image/png')
      })

      downloadBlob(pngBlob, `${exportBaseName}.png`)
      notifications.show({
        title: 'Exported PNG',
        message: `${exportBaseName}.png`,
      })
    } catch (exportError) {
      const message =
        exportError instanceof Error ? exportError.message : 'Could not export the diagram as PNG.'
      notifications.show({
        color: 'red',
        title: 'PNG export failed',
        message,
      })
    }
  }

  return (
    <Box className={classes.container}>
      <Flex className={classes.titleBar} align="center" justify="space-between" gap="sm">
        <Text fw={500}>Schema Diagram</Text>
        <Flex align="center" gap="sm">
          <SegmentedControl
            size="xs"
            value={diagramType}
            data={[
              {value: 'er', label: 'ER'},
              {value: 'class', label: 'Class'},
              {value: 'flowchart', label: 'Flowchart'},
            ]}
            onChange={(value) => {
              if (value === 'er' || value === 'class' || value === 'flowchart') {
                setDiagramType(value)
              }
            }}
          />
          <CopyButton value={mermaidText} timeout={1000}>
            {({copied, copy}) => (
              <Tooltip label={copied ? 'Copied' : 'Copy Mermaid'} withArrow position="top">
                <button
                  className={classes.copyButton}
                  type="button"
                  onClick={copy}
                  disabled={!mermaidText}
                  aria-label={copied ? 'Copied Mermaid' : 'Copy Mermaid'}
                >
                  {copied ? <FiCheck /> : <FiCopy />}
                </button>
              </Tooltip>
            )}
          </CopyButton>
        </Flex>
      </Flex>

      <Flex className={classes.diagramTools} align="center" justify="space-between" gap="sm">
        <Flex align="center" gap="xs">
          <Button
            size="compact-xs"
            variant={fitToWidth ? 'filled' : 'light'}
            onClick={() => {
              setFitToWidth((current) => !current)
            }}
          >
            Fit width
          </Button>
          <Text size="xs" c="dimmed">
            {zoomPercent}%
          </Text>
          <Tooltip label="Export SVG" withArrow position="top">
            <ActionIcon
              variant="light"
              aria-label="Export SVG"
              disabled={!svg}
              onClick={handleExportSvg}
            >
              <FiDownload />
            </ActionIcon>
          </Tooltip>
          <Tooltip label="Export PNG" withArrow position="top">
            <ActionIcon
              variant="light"
              aria-label="Export PNG"
              disabled={!svg}
              onClick={() => {
                void handleExportPng()
              }}
            >
              <FiImage />
            </ActionIcon>
          </Tooltip>
        </Flex>
        <Flex align="center" gap="xs">
          <Tooltip label="Zoom out" withArrow position="top">
            <ActionIcon
              variant="light"
              aria-label="Zoom out"
              disabled={fitToWidth || zoomLevel <= ZOOM_RANGE.min}
              onClick={() => {
                setZoomLevel((current) => Math.max(ZOOM_RANGE.min, current - ZOOM_RANGE.step))
              }}
            >
              <FiMinus />
            </ActionIcon>
          </Tooltip>
          <Button
            size="compact-xs"
            variant="light"
            disabled={fitToWidth || zoomLevel === 1}
            onClick={() => {
              setZoomLevel(1)
            }}
          >
            100%
          </Button>
          <Tooltip label="Zoom in" withArrow position="top">
            <ActionIcon
              variant="light"
              aria-label="Zoom in"
              disabled={fitToWidth || zoomLevel >= ZOOM_RANGE.max}
              onClick={() => {
                setZoomLevel((current) => Math.min(ZOOM_RANGE.max, current + ZOOM_RANGE.step))
              }}
            >
              <FiPlus />
            </ActionIcon>
          </Tooltip>
        </Flex>
      </Flex>

      <Text className={classes.liveRegion} aria-live="polite" role="status">
        {liveMessage}
      </Text>

      {!isZod4 && (
        <Alert color="orange" title="Requires Zod 4+" m="sm">
          Schema visualization is available for Zod 4+ versions.
        </Alert>
      )}

      {isZod4 && schemaError && (
        <Alert color="red" title="Schema could not be evaluated" m="sm">
          {schemaError}
        </Alert>
      )}

      {isZod4 && hasRenderableSchema && primitiveType && (
        <Alert color="blue" variant="light" icon={<FiInfo />} m="sm">
          Schema visualization works best with object schemas. Your current schema is a{' '}
          {primitiveType} type.
        </Alert>
      )}

      {error && (
        <Alert color="red" title="Diagram unavailable" m="sm">
          {error}
        </Alert>
      )}

      <Box className={classes.diagramArea}>
        {isLoading && <Text size="sm">Generating diagram...</Text>}

        {!isLoading && !error && svg && (
          <Box
            role="img"
            aria-label={ariaLabel}
            ref={diagramCanvasRef}
            className={`${classes.diagramCanvas} ${fitToWidth ? classes.diagramCanvasFit : classes.diagramCanvasZoom}`}
            style={
              fitToWidth
                ? undefined
                : ({
                    ...scaledCanvasSize,
                    '--schema-viz-zoom': `${zoomScale}`,
                  } as CSSProperties)
            }
            // biome-ignore lint/security/noDangerouslySetInnerHtml: mermaid returns SVG markup
            dangerouslySetInnerHTML={{__html: svg}}
          />
        )}

        {!isLoading && !error && !svg && isZod4 && hasRenderableSchema && (
          <Text size="sm" c="dimmed">
            Diagram will appear here after generation. Rendering starts after{' '}
            {SCHEMA_VISUALIZATION_TIMINGS.debounceMs}ms of inactivity.
          </Text>
        )}

        {!isLoading && !error && !svg && isZod4 && !hasRenderableSchema && !schemaError && (
          <Text size="sm" c="dimmed">
            Enter a valid Zod schema to generate a diagram.
          </Text>
        )}
      </Box>
    </Box>
  )
}
