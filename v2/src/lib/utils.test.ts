import { describe, it, expect } from 'vitest'
import { cn } from './utils'

describe('cn utility', () => {
  it('should merge class names correctly', () => {
    expect(cn('px-2 py-1', 'bg-red-500')).toBe('px-2 py-1 bg-red-500')
  })

  it('should handle conditional classes', () => {
    expect(cn('px-2', true && 'py-1', false && 'bg-red-500')).toBe('px-2 py-1')
  })

  it('should merge tailwind classes properly (override)', () => {
    // tailwind-merge should ensure p-4 overrides p-2
    expect(cn('p-2', 'p-4')).toBe('p-4')
  })

  it('should handle complex combinations', () => {
    expect(cn('text-base', undefined, null, 'text-lg')).toBe('text-lg')
  })
})
