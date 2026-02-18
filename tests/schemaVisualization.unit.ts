import assert from 'node:assert/strict'
import {describe, test} from 'node:test'
import {
  isGenerationCurrent,
  mapVisualizationError,
  normalizeRenderedSvg,
  SCHEMA_VISUALIZATION_ERROR_CODES,
  SCHEMA_VISUALIZATION_TIMINGS,
  withTimeout,
} from '../src/features/SchemaVisualization/useSchemaVisualization.ts'

describe('schema visualization helpers', () => {
  test('timing constants match plan expectations', () => {
    assert.equal(SCHEMA_VISUALIZATION_TIMINGS.debounceMs, 500)
    assert.equal(SCHEMA_VISUALIZATION_TIMINGS.cdnLoadTimeoutMs, 10_000)
    assert.equal(SCHEMA_VISUALIZATION_TIMINGS.renderTimeoutMs, 5_000)
  })

  test('withTimeout resolves when promise completes before timeout', async () => {
    const result = await withTimeout(Promise.resolve('ok'), 100, 'TIMEOUT')
    assert.equal(result, 'ok')
  })

  test('withTimeout rejects with provided timeout code', async () => {
    const never = new Promise<string>(() => {})
    await assert.rejects(
      () => withTimeout(never, 20, 'TIMEOUT_CODE'),
      (error: unknown) => {
        assert.ok(error instanceof Error)
        assert.equal(error.message, 'TIMEOUT_CODE')
        return true
      },
    )
  })

  test('maps render timeout to user-facing timeout message', () => {
    const error = new Error(SCHEMA_VISUALIZATION_ERROR_CODES.renderTimeout)
    assert.equal(mapVisualizationError(error), 'Diagram generation timed out for this schema.')
  })

  test('maps other errors to unavailable message', () => {
    const error = new Error('SOME_OTHER_ERROR')
    assert.equal(
      mapVisualizationError(error),
      'Diagram unavailable - could not load visualization libraries.',
    )
  })

  test('extracts svg from mermaid render result variants', () => {
    assert.equal(normalizeRenderedSvg('<svg>diagram</svg>'), '<svg>diagram</svg>')
    assert.equal(normalizeRenderedSvg({svg: '<svg>object</svg>'}), '<svg>object</svg>')
    assert.equal(normalizeRenderedSvg({}), '')
  })

  test('generation comparison enforces stale-result guard', () => {
    assert.equal(isGenerationCurrent(2, 2), true)
    assert.equal(isGenerationCurrent(1, 2), false)
  })
})
