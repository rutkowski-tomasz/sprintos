import { describe, it, expect } from 'vitest'
import { TaskStatus } from '@/types'

describe('TaskStatus', () => {
  it('maps to stable integer values that match the database schema', () => {
    expect(TaskStatus.TODO).toBe(0)
    expect(TaskStatus.NEXT).toBe(1)
    expect(TaskStatus.IN_PROGRESS).toBe(2)
    expect(TaskStatus.DONE).toBe(3)
    expect(TaskStatus.ARCHIVED).toBe(4)
  })
})
