import { describe, expect, it } from 'vitest'
import packageJson from '../package.json'

describe('package.json', () => {
  it('should have the correct name', () => {
    expect(packageJson.name).toBe('@hyparam/components')
  })
  it('should have a valid version', () => {
    expect(packageJson.version).toMatch(/^\d+\.\d+\.\d+$/)
  })
  it('should have MIT license', () => {
    expect(packageJson.license).toBe('MIT')
  })
  it('should have precise dependency versions', () => {
    const { dependencies, devDependencies } = packageJson
    const allDependencies = { ...dependencies, ...devDependencies }
    /// peer dependencies are not checked, because the user might have different versions
    Object.entries(allDependencies).filter(([name]) => !name.startsWith('@hyparam/')).forEach(([, version]) => {
      expect(version).toMatch(/^\d+\.\d+\.\d+$/)
    })
  })
})
