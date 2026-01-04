import { IDLE_THRESHOLD_SECONDS } from "../lib/constants"
import { Logger } from "./logger"

const logger = new Logger("IdleDetector")

export type IdleState = "active" | "idle" | "locked"

export interface IdleDetectorCallbacks {
  onStateChange: (isIdle: boolean) => void
}

export class IdleDetector {
  private static instance: IdleDetector
  private callbacks?: IdleDetectorCallbacks
  private detectionInterval: number
  private isRunning: boolean = false
  private currentState: IdleState = "active"
  private stateChangeDebounceTimer?: NodeJS.Timeout

  private constructor() {
    this.detectionInterval = IDLE_THRESHOLD_SECONDS
  }

  static getInstance(): IdleDetector {
    if (!IdleDetector.instance) {
      IdleDetector.instance = new IdleDetector()
    }
    return IdleDetector.instance
  }

  start(callbacks: IdleDetectorCallbacks): void {
    if (this.isRunning) {
      // If already running, update callbacks but don't re-register listener
      this.callbacks = callbacks
      return
    }

    if (!chrome.idle) {
      logger.warn("chrome.idle API not available")
      return
    }

    this.callbacks = callbacks
    this.isRunning = true

    chrome.idle.setDetectionInterval(this.detectionInterval)
    chrome.idle.onStateChanged.addListener(this.handleStateChangeEvent)
    logger.info("Idle detection started", { threshold: this.detectionInterval })
  }

  stop(): void {
    if (!this.isRunning) {
      return
    }

    this.isRunning = false

    if (chrome.idle?.onStateChanged) {
      chrome.idle.onStateChanged.removeListener(this.handleStateChangeEvent)
    }

    if (this.stateChangeDebounceTimer) {
      clearTimeout(this.stateChangeDebounceTimer)
      this.stateChangeDebounceTimer = undefined
    }

    this.callbacks = undefined
    this.currentState = "active"
  }

  async queryCurrentState(): Promise<IdleState> {
    if (!chrome.idle) {
      throw new Error("chrome.idle API not available")
    }

    return new Promise((resolve) => {
      chrome.idle.queryState(this.detectionInterval, (state) => {
        resolve(state as IdleState)
      })
    })
  }

  private handleStateChangeEvent = (newState: chrome.idle.IdleState): void => {
    this.handleStateChange(newState as IdleState)
  }

  private handleStateChange(newState: IdleState): void {
    if (this.stateChangeDebounceTimer) {
      clearTimeout(this.stateChangeDebounceTimer)
    }

    this.stateChangeDebounceTimer = setTimeout(() => {
      const wasIdle =
        this.currentState === "idle" || this.currentState === "locked"
      const isNowIdle = newState === "idle" || newState === "locked"

      if (wasIdle !== isNowIdle) {
        this.currentState = newState
        this.callbacks?.onStateChange(isNowIdle)
      } else {
        this.currentState = newState
      }

      this.stateChangeDebounceTimer = undefined
    }, 300)
  }
}
