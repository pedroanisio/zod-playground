# Schema Module: result

Source: `_specs/schemas/result.ts`

**Overview:** error handling without exception-based control flow. Define the ResultError interface contract.



## Exported Symbols

### err (function)

**Source:** `_specs/schemas/result.ts:36`

**Summary:** Create a failure result value.

#### TSDoc Tags

##### @param

error - Error payload.

##### @returns

A failure variant of {@link Result}.

---

### fail (function)

**Source:** `_specs/schemas/result.ts:48`

**Summary:** Create a failure result from standard error parts.

#### TSDoc Tags

##### @param

code - Stable error code.

##### @param

message - Human-readable error message.

##### @param

cause - Optional underlying error value.

##### @returns

A failure result with normalized {@link ResultError}.

---

### formatError (function)

**Source:** `_specs/schemas/result.ts:114`

**Summary:** Normalize an unknown error value to a display string.

#### TSDoc Tags

##### @param

error - Unknown error value.

##### @returns

Error message string.

---

### isErr (function)

**Source:** `_specs/schemas/result.ts:104`

**Summary:** Check whether a result is a failure.

#### TSDoc Tags

##### @param

result - Result to inspect.

##### @returns

`true` when the value is a failure variant.

---

### isOk (function)

**Source:** `_specs/schemas/result.ts:94`

**Summary:** Check whether a result is successful.

#### TSDoc Tags

##### @param

result - Result to inspect.

##### @returns

`true` when the value is a success variant.

---

### map (function)

**Source:** `_specs/schemas/result.ts:84`

**Summary:** Map a success payload to a new value.

#### TSDoc Tags

##### @param

result - Input result.

##### @param

fn - Mapping function for success values.

##### @returns

A mapped success result or the original failure.

---

### ok (function)

**Source:** `_specs/schemas/result.ts:26`

**Summary:** Create a successful result value.

#### TSDoc Tags

##### @param

data - Successful payload.

##### @returns

A success variant of {@link Result}.

---

### Result (type)

**Source:** `_specs/schemas/result.ts:18`

**Summary:** Represent Result values inferred from the schema layer.

---

### ResultError (interface)

**Source:** `_specs/schemas/result.ts:11`

**Summary:** Define the ResultError interface contract.

---

### unwrap (function)

**Source:** `_specs/schemas/result.ts:59`

**Summary:** Unwrap a result and return its success payload.

#### TSDoc Tags

##### @param

result - Result to unwrap.

##### @returns

Success payload value.

##### @throws

`Error` If `result` is a failure.

---

### unwrapOr (function)

**Source:** `_specs/schemas/result.ts:73`

**Summary:** Unwrap a result or return a default value.

#### TSDoc Tags

##### @param

result - Result to inspect.

##### @param

defaultValue - Fallback value when `result` is a failure.

##### @returns

Success payload or `defaultValue`.

