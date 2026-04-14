import type { CellValue } from "./types"

type SpreadsheetFn = (args: CellValue[]) => CellValue

function toNumbers(args: CellValue[]): number[] {
  return args.filter((v) => typeof v === "number") as number[]
}

function toNumber(v: CellValue): number {
  if (typeof v === "number") return v
  if (typeof v === "boolean") return v ? 1 : 0
  const n = Number(v)
  return isNaN(n) ? 0 : n
}

export const functions: Record<string, SpreadsheetFn> = {
  SUM(args) {
    return toNumbers(args).reduce((a, b) => a + b, 0)
  },
  AVG(args) {
    const nums = toNumbers(args)
    return nums.length === 0 ? 0 : nums.reduce((a, b) => a + b, 0) / nums.length
  },
  AVERAGE(args) {
    return functions.AVG(args)
  },
  COUNT(args) {
    return args.filter((v) => v !== undefined && v !== "").length
  },
  MIN(args) {
    const nums = toNumbers(args)
    return nums.length === 0 ? 0 : Math.min(...nums)
  },
  MAX(args) {
    const nums = toNumbers(args)
    return nums.length === 0 ? 0 : Math.max(...nums)
  },
  ABS(args) {
    return Math.abs(toNumber(args[0]))
  },
  ROUND(args) {
    const val = toNumber(args[0])
    const decimals = args.length > 1 ? toNumber(args[1]) : 0
    const factor = Math.pow(10, decimals)
    return Math.round(val * factor) / factor
  },
  CEIL(args) {
    return Math.ceil(toNumber(args[0]))
  },
  FLOOR(args) {
    return Math.floor(toNumber(args[0]))
  },
  IF(args) {
    const condition = args[0]
    const truthyVal = args[1] ?? true
    const falsyVal = args[2] ?? false
    return condition ? truthyVal : falsyVal
  },
  AND(args) {
    return args.every(Boolean)
  },
  OR(args) {
    return args.some(Boolean)
  },
  NOT(args) {
    return !args[0]
  },
  CONCAT(args) {
    return args.map(String).join("")
  },
  LEN(args) {
    return String(args[0] ?? "").length
  },
  UPPER(args) {
    return String(args[0] ?? "").toUpperCase()
  },
  LOWER(args) {
    return String(args[0] ?? "").toLowerCase()
  },
  NOW() {
    return Date.now()
  },
  TODAY() {
    return new Date().toISOString().slice(0, 10)
  },
  POW(args) {
    return Math.pow(toNumber(args[0]), toNumber(args[1]))
  },
  SQRT(args) {
    return Math.sqrt(toNumber(args[0]))
  },
  MOD(args) {
    return toNumber(args[0]) % toNumber(args[1])
  },
  INT(args) {
    return Math.trunc(toNumber(args[0]))
  },
}
