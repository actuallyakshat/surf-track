import { IGNORED_DOMAINS } from "./constants"

/**
 * @deprecated Use IGNORED_DOMAINS from constants.ts instead
 */
export const DEFAULT_IGNORED_DOMAINS = IGNORED_DOMAINS as unknown as string[]

/**
 * Extracts the hostname from a given URL string.
 *
 * @param url - The URL string to parse.
 * @returns The hostname if the URL is valid, otherwise returns the original input string.
 */
export function getDomainFromUrl(url: string): string {
  if (!url) return ""

  try {
    // Attempt to parse as a full URL
    const urlObj = new URL(url)
    // If protocol is present but it's a file or similar that might not have a hostname in the way we expect
    if (urlObj.protocol === "file:") {
      return "local file" // Or strictly the path? v1 treated these loosely. Let's stick to hostname.
    }
    return urlObj.hostname
  } catch (e) {
    // If it fails, it might be missing the protocol.
    // Try adding https:// and see if it works.
    try {
      if (!url.startsWith("http")) {
        const urlObj = new URL(`https://${url}`)
        return urlObj.hostname
      }
    } catch (e2) {
      // Still invalid, return original string as a fallback or empty string?
      // "Handle invalid URLs gracefully (return null or empty string, or throw - decide what's best, probably empty string or original string if not a URL)."
      // I'll return the original string to be safe, so we don't lose data, or maybe just the string itself is the "domain" in the user's mind.
    }
    return url
  }
}

/**
 * Checks if a domain should be ignored based on a list.
 *
 * @param domain - The domain to check.
 * @param ignoredList - Optional list of domains to ignore. Defaults to DEFAULT_IGNORED_DOMAINS.
 * @returns True if the domain is in the ignored list, false otherwise.
 */
export function isIgnoredDomain(
  domain: string,
  ignoredList: string[] = DEFAULT_IGNORED_DOMAINS
): boolean {
  if (!domain) return false
  return ignoredList.includes(domain)
}
