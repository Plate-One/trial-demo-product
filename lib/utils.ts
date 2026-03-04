import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Deterministic seeded random number generator.
 * Given the same seed string, always returns the same value in [0, 1).
 */
export function seededRandom(seed: string): number {
  let hash = 0
  for (let i = 0; i < seed.length; i++) {
    const char = seed.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Convert to 32bit integer
  }
  const x = Math.sin(hash) * 10000
  return x - Math.floor(x)
}

/**
 * Returns a seeded variation value in range [-amplitude, +amplitude].
 */
export function seededVariation(seed: string, amplitude: number): number {
  return (seededRandom(seed) - 0.5) * 2 * amplitude
}
