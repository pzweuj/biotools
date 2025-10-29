import packageJson from '@/package.json'

/**
 * 应用版本号
 * 从 package.json 中读取，确保版本号统一维护
 */
export const APP_VERSION = packageJson.version
