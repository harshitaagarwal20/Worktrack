/**
 * Generate and parse order IDs in `ORD-001` style.
 */
export function formatOrderId(seq: number, prefix = 'EMP', width = 3): string {
  if (!Number.isInteger(seq) || seq < 0) throw new Error('seq must be a non-negative integer')
  const num = seq.toString().padStart(width, '0')
  return `${prefix}-${num}`
}

/**
 * Given the last order id like `ORD-005`, return the next id `ORD-006`.
 * If `lastId` is undefined/null, returns `ORD-001`.
 */
export function nextOrderIdFromLast(lastId?: string, prefix = 'EMP', width = 3): string {
  if (!lastId) return formatOrderId(1, prefix, width)
  const parts = lastId.split('-')
  const raw = parts[parts.length - 1]
  const n = parseInt(raw, 10)
  if (Number.isNaN(n)) return formatOrderId(1, prefix, width)
  return formatOrderId(n + 1, prefix, width)
}

/**
 * Parse numeric sequence from an order id. Returns undefined if not parsable.
 */
export function parseOrderSeq(orderId: string): number | undefined {
  if (!orderId) return undefined
  const m = orderId.match(/-(\d+)$/)
  if (!m) return undefined
  const n = parseInt(m[1], 10)
  return Number.isNaN(n) ? undefined : n
}

export default { formatOrderId, nextOrderIdFromLast, parseOrderSeq }

// Employee-specific wrappers (convenience)
export function formatEmployeeId(seq: number, width = 3) {
  return formatOrderId(seq, 'EMP', width)
}

export function nextEmployeeIdFromLast(lastId?: string, width = 3) {
  return nextOrderIdFromLast(lastId, 'EMP', width)
}

export function parseEmployeeSeq(employeeId: string) {
  return parseOrderSeq(employeeId)
}
