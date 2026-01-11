import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { IdleDetector, IdleDetectorCallbacks, IdleState } from "./idle-detector"
import { Logger } from "./logger"

vi.mock("./logger", () => {
  const Logger = vi.fn()
  Logger.prototype.info = vi.fn()
  Logger.prototype.warn = vi.fn()
  Logger.prototype.error = vi.fn()
  Logger.prototype.debug = vi.fn()
  return { Logger }
})

describe("IdleDetector", () => {
  let idleDetector: IdleDetector
  let mockOnStateChange: ReturnType<typeof vi.fn>
  let mockCallbacks: IdleDetectorCallbacks
  let stateChangeListeners: Array<(state: chrome.idle.IdleState) => void> = []

  const mockChromeIdle = {
    setDetectionInterval: vi.fn(),
    queryState: vi.fn(),
    onStateChanged: {
      addListener: vi.fn((listener) => {
        stateChangeListeners.push(listener)
      }),
      removeListener: vi.fn((listener) => {
        stateChangeListeners = stateChangeListeners.filter(
          (l) => l !== listener
        )
      })
    }
  }

  beforeEach(() => {
    vi.clearAllMocks()
    stateChangeListeners = []
    mockOnStateChange = vi.fn()
    mockCallbacks = { onStateChange: mockOnStateChange }

    global.chrome = {
      idle: mockChromeIdle
    } as any

    idleDetector = IdleDetector.getInstance()
  })

  afterEach(() => {
    idleDetector.stop()
    vi.clearAllTimers()
  })

  describe("getInstance", () => {
    it("should return singleton instance", () => {
      const instance1 = IdleDetector.getInstance()
      const instance2 = IdleDetector.getInstance()
      expect(instance1).toBe(instance2)
    })
  })

  describe("start", () => {
    it("should initialize chrome.idle with correct detection interval", () => {
      idleDetector.start(mockCallbacks)
      expect(mockChromeIdle.setDetectionInterval).toHaveBeenCalledWith(60)
    })

    it("should register state change listener", () => {
      idleDetector.start(mockCallbacks)
      expect(mockChromeIdle.onStateChanged.addListener).toHaveBeenCalledTimes(1)
      expect(stateChangeListeners.length).toBe(1)
    })

    it("should not start if already running", () => {
      idleDetector.start(mockCallbacks)
      mockChromeIdle.setDetectionInterval.mockClear()
      mockChromeIdle.onStateChanged.addListener.mockClear()

      idleDetector.start(mockCallbacks)

      expect(mockChromeIdle.setDetectionInterval).not.toHaveBeenCalled()
      expect(mockChromeIdle.onStateChanged.addListener).not.toHaveBeenCalled()
    })

    it("should handle missing chrome.idle API gracefully", () => {
      global.chrome = {} as any

      // Since we mocked Logger, we should check if it was called
      const loggerWarnSpy = vi.spyOn(Logger.prototype, "warn")

      idleDetector.start(mockCallbacks)

      expect(loggerWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining("chrome.idle API not available")
      )
    })
  })

  describe("stop", () => {
    it("should remove state change listener", () => {
      idleDetector.start(mockCallbacks)
      idleDetector.stop()

      expect(
        mockChromeIdle.onStateChanged.removeListener
      ).toHaveBeenCalledTimes(1)
      expect(stateChangeListeners.length).toBe(0)
    })

    it("should clear callbacks", () => {
      idleDetector.start(mockCallbacks)
      idleDetector.stop()

      expect(stateChangeListeners.length).toBe(0)
    })

    it("should not throw if stop called before start", () => {
      expect(() => idleDetector.stop()).not.toThrow()
    })

    it("should handle missing chrome.idle API gracefully", () => {
      idleDetector.start(mockCallbacks)
      global.chrome = {} as any

      expect(() => idleDetector.stop()).not.toThrow()
    })
  })

  describe("queryCurrentState", () => {
    it("should return current idle state", async () => {
      mockChromeIdle.queryState.mockImplementation((interval, callback) => {
        callback("active")
      })

      const state = await idleDetector.queryCurrentState()

      expect(state).toBe("active")
      expect(mockChromeIdle.queryState).toHaveBeenCalledWith(
        60,
        expect.any(Function)
      )
    })

    it("should handle idle state", async () => {
      mockChromeIdle.queryState.mockImplementation((interval, callback) => {
        callback("idle")
      })

      const state = await idleDetector.queryCurrentState()
      expect(state).toBe("idle")
    })

    it("should handle locked state", async () => {
      mockChromeIdle.queryState.mockImplementation((interval, callback) => {
        callback("locked")
      })

      const state = await idleDetector.queryCurrentState()
      expect(state).toBe("locked")
    })

    it("should throw error if chrome.idle not available", async () => {
      global.chrome = {} as any

      await expect(idleDetector.queryCurrentState()).rejects.toThrow(
        "chrome.idle API not available"
      )
    })
  })

  describe("state change handling", () => {
    beforeEach(() => {
      vi.useFakeTimers()
      idleDetector.stop()
    })

    afterEach(() => {
      vi.useRealTimers()
    })

    it("should call callback when transitioning from active to idle", () => {
      idleDetector.start(mockCallbacks)

      const listener = stateChangeListeners[0]
      listener("idle")

      vi.advanceTimersByTime(300)

      expect(mockOnStateChange).toHaveBeenCalledWith("idle")
      expect(mockOnStateChange).toHaveBeenCalledTimes(1)
    })

    it("should call callback when transitioning from idle to active", () => {
      idleDetector.start(mockCallbacks)

      const listener = stateChangeListeners[0]
      listener("idle")
      vi.advanceTimersByTime(300)
      mockOnStateChange.mockClear()

      listener("active")
      vi.advanceTimersByTime(300)

      expect(mockOnStateChange).toHaveBeenCalledWith("active")
      expect(mockOnStateChange).toHaveBeenCalledTimes(1)
    })

    it("should pass locked state to callback", () => {
      idleDetector.start(mockCallbacks)

      const listener = stateChangeListeners[0]
      listener("locked")

      vi.advanceTimersByTime(300)

      expect(mockOnStateChange).toHaveBeenCalledWith("locked")
    })

    it("should call callback when transitioning from idle to locked", () => {
      idleDetector.start(mockCallbacks)

      const listener = stateChangeListeners[0]
      listener("idle")
      vi.advanceTimersByTime(300)
      mockOnStateChange.mockClear()

      listener("locked")
      vi.advanceTimersByTime(300)

      expect(mockOnStateChange).toHaveBeenCalledWith("locked")
    })

    it("should call callback when transitioning from locked to idle", () => {
      idleDetector.start(mockCallbacks)

      const listener = stateChangeListeners[0]
      listener("locked")
      vi.advanceTimersByTime(300)
      mockOnStateChange.mockClear()

      listener("idle")
      vi.advanceTimersByTime(300)

      expect(mockOnStateChange).toHaveBeenCalledWith("idle")
    })

    it("should debounce rapid state changes and use final state", () => {
      idleDetector.start(mockCallbacks)

      const listener = stateChangeListeners[0]
      listener("idle")
      vi.advanceTimersByTime(100)
      listener("active")
      vi.advanceTimersByTime(100)
      listener("idle")
      vi.advanceTimersByTime(300)

      expect(mockOnStateChange).toHaveBeenCalledWith("idle")
      expect(mockOnStateChange).toHaveBeenCalledTimes(1)
    })

    it("should clear debounce timer on stop", () => {
      idleDetector.start(mockCallbacks)

      const listener = stateChangeListeners[0]
      listener("idle")

      idleDetector.stop()
      vi.advanceTimersByTime(300)

      expect(mockOnStateChange).not.toHaveBeenCalled()
    })
  })

  describe("edge cases", () => {
    beforeEach(() => {
      vi.useFakeTimers()
      idleDetector.stop()
    })

    afterEach(() => {
      vi.useRealTimers()
    })

    it("should handle multiple start calls with different callbacks", () => {
      const firstCallback = vi.fn()
      const secondCallback = vi.fn()

      idleDetector.start({ onStateChange: firstCallback })
      idleDetector.start({ onStateChange: secondCallback })

      const listener = stateChangeListeners[0]
      listener("idle")

      vi.advanceTimersByTime(300)

      expect(secondCallback).toHaveBeenCalledWith("idle")
      expect(firstCallback).not.toHaveBeenCalled()
    })

    it("should handle stop then start cycle", () => {
      idleDetector.start(mockCallbacks)
      idleDetector.stop()
      idleDetector.start(mockCallbacks)

      expect(stateChangeListeners.length).toBe(1)

      const listener = stateChangeListeners[0]
      listener("idle")
      vi.advanceTimersByTime(300)

      expect(mockOnStateChange).toHaveBeenCalledWith("idle")
    })
  })
})
