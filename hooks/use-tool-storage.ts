"use client"

// useToolStorage —— 把工具的输入与状态自动同步到 sessionStorage
// 关键约束：100% 浏览器本地；不发任何网络；标签关闭即丢失（避免长期遗留敏感数据）
//
// 用法：
//   const [seq, setSeq] = useToolStorage("tm-calculator:input", "")
//
// 设计说明：
// - sessionStorage 而非 localStorage：用户期望"换标签 / 关浏览器 = 清零"
// - 防抖写入（200 ms）：避免在 onChange 中高频写入
// - 序列化失败时自动降级为内存态，不影响功能

import { useCallback, useEffect, useRef, useState } from "react"

interface Options<T> {
  /** 自定义序列化（默认 JSON.stringify） */
  serialize?: (value: T) => string
  /** 自定义反序列化 */
  deserialize?: (raw: string) => T
  /** 写入防抖间隔（ms），默认 200 */
  debounceMs?: number
}

const PREFIX = "biotools:tool:"

function isBrowser() {
  return typeof window !== "undefined" && typeof sessionStorage !== "undefined"
}

export function useToolStorage<T>(
  key: string,
  initialValue: T | (() => T),
  options?: Options<T>,
): [T, (value: T | ((prev: T) => T)) => void, () => void] {
  const fullKey = `${PREFIX}${key}`
  const serialize = options?.serialize ?? ((v: T) => JSON.stringify(v))
  const deserialize = options?.deserialize ?? ((raw: string) => JSON.parse(raw) as T)
  const debounceMs = options?.debounceMs ?? 200

  // 仅在客户端读取，避免 SSR 不一致
  const [value, setValue] = useState<T>(() => {
    if (!isBrowser()) {
      return typeof initialValue === "function" ? (initialValue as () => T)() : initialValue
    }
    try {
      const raw = sessionStorage.getItem(fullKey)
      if (raw !== null) return deserialize(raw)
    } catch {}
    return typeof initialValue === "function" ? (initialValue as () => T)() : initialValue
  })

  const writeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const latestValueRef = useRef(value)
  latestValueRef.current = value

  // 写入：防抖
  useEffect(() => {
    if (!isBrowser()) return
    if (writeTimerRef.current) clearTimeout(writeTimerRef.current)
    writeTimerRef.current = setTimeout(() => {
      try {
        sessionStorage.setItem(fullKey, serialize(latestValueRef.current))
      } catch {
        // 可能因为隐身模式 / quota / 序列化失败而抛错；忽略
      }
    }, debounceMs)
    return () => {
      if (writeTimerRef.current) clearTimeout(writeTimerRef.current)
    }
  }, [value, fullKey, serialize, debounceMs])

  const update = useCallback((next: T | ((prev: T) => T)) => {
    setValue((prev) => (typeof next === "function" ? (next as (p: T) => T)(prev) : next))
  }, [])

  const reset = useCallback(() => {
    if (isBrowser()) {
      try {
        sessionStorage.removeItem(fullKey)
      } catch {}
    }
    setValue(typeof initialValue === "function" ? (initialValue as () => T)() : initialValue)
  }, [fullKey, initialValue])

  return [value, update, reset]
}
