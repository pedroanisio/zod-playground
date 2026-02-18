import {Alert, Box, CopyButton, Flex, SegmentedControl, Text, Tooltip} from '@mantine/core'
import {useMemo, useState} from 'react'
import {FiCheck, FiCopy, FiInfo} from 'react-icons/fi'
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

export function SchemaVisualization({schema, colorScheme, isZod4}: SchemaVisualizationProps) {
  const [diagramType, setDiagramType] = useState<DiagramType>('er')
  const primitiveType = useMemo(() => getPrimitiveSchemaType(schema), [schema])

  const {svg, mermaidText, isLoading, error} = useSchemaVisualization({
    schema,
    diagramType,
    isEnabled: isZod4,
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

      <Text className={classes.liveRegion} aria-live="polite" role="status">
        {liveMessage}
      </Text>

      {!isZod4 && (
        <Alert color="orange" title="Requires Zod 4+" m="sm">
          Schema visualization is available for Zod 4+ versions.
        </Alert>
      )}

      {isZod4 && primitiveType && (
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
            className={classes.diagramCanvas}
            // biome-ignore lint/security/noDangerouslySetInnerHtml: mermaid returns SVG markup
            dangerouslySetInnerHTML={{__html: svg}}
          />
        )}

        {!isLoading && !error && !svg && isZod4 && (
          <Text size="sm" c="dimmed">
            Diagram will appear here after generation. Rendering starts after{' '}
            {SCHEMA_VISUALIZATION_TIMINGS.debounceMs}ms of inactivity.
          </Text>
        )}
      </Box>
    </Box>
  )
}
