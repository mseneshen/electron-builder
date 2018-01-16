import BluebirdPromise from "bluebird-lst"
import { isEnvTrue } from "builder-util"
import { getBin, getBinFromGithub } from "builder-util/out/binDownload"
import { Lazy } from "lazy-val"
import * as path from "path"
import { Platform } from "../core"

export function getLinuxToolsPath() {
  //noinspection SpellCheckingInspection
  return getBinFromGithub("linux-tools", "mac-10.12.3", "SQ8fqIRVXuQVWnVgaMTDWyf2TLAJjJYw3tRSqQJECmgF6qdM7Kogfa6KD49RbGzzMYIFca9Uw3MdsxzOPRWcYw==")
}

export function getAppImage() {
  //noinspection SpellCheckingInspection
  return getBinFromGithub("appimage", "9.0.4", "pTFOnybYI2iGAyDUgXjzTkfuQ/E2ux8uLI1lXGB0RDoKhvFEq3y+q0sFzMOsbPTKZCcBRGhTujRlnsnTwgJmyw==")
}

export const fpmPath = new Lazy(() => {
  if (process.platform === "win32" || process.env.USE_SYSTEM_FPM === "true") {
    return BluebirdPromise.resolve("fpm")
  }

  const osAndArch = process.platform === "darwin" ? "mac" : `linux-x86${process.arch === "ia32" ? "" : "_64"}`

  if (process.platform === "darwin") {
    //noinspection SpellCheckingInspection
    return getBinFromGithub("fpm", "1.9.2.1-20150715-2.2.2-mac", "6sZZoRKkxdmv3a6E5dnZgVl23apGnImhDtGHKhgCE1WOtXBUJnx+w0WvB2HD2/sitz4f93Mf7+QqDCIbfP7LOw==")
      .then(it => path.join(it, "fpm"))
  }

  //noinspection SpellCheckingInspection
  const checksum = process.arch === "ia32" ? "cTT/HdjrQ6qTJQhTZaZC3lyDkRCyNFtNBZ0F7n6mh5B3YmD5ttJZ0xn65pQS03dhEi67A8K1xXNO+tyEEviiIg==" : "0zKxWlHuQEUsXJpWll5Bc4OTI8d0jcMVlme9OeHI+Y+s3sv1S4KyGLOEVEkNw6pRU8F+A1Dj5IR95/+U8YzB0A=="
  return getBinFromGithub("fpm", `1.9.2-2.3.1-${osAndArch}`, checksum)
    .then(it => path.join(it, "fpm"))
})

// noinspection JSUnusedGlobalSymbols
export function prefetchBuildTools() {
  // yes, we starting to use native Promise
  return Promise.all([getAppImage(), fpmPath.value, getAppBuilderTool()])
}

export function getZstd() {
  // noinspection SpellCheckingInspection
  return getTool({
    name: "zstd",
    version: "1.3.3",
    mac: "RnFYU+gEieQFCu943WEmh++PT5TZjDSqSCZvZj7ArfVkc+JS+DdGi30/466gqx9VFKsk6XpYrCpZNryFSvDOuw==",
    "linux-x64": "M1YpBtWX9C99hwRHF8bOLdN5bUFChMwWRc/NzGSwG48VVtegEV2RCFqbT1v0ZcSLC54muhOtK1VgMEmTKr0ouQ==",
    "win-ia32": "uUG8l+JQZtgFOq5G9lg3ryABiFA2gv14inJTAmpprywmbVfCVe++ikzJcjg5ZdLKhYDcB3nIsKE5c7pWY7+1yA==",
    "win-x64": "lBCx8nuRkEu8oQqgXosuO9e35BQOSyugFaK5ExBiTKh6qkv6amsYEUNELZGmEqH+FXscagxq+7+QUYkWJfmROQ==",
  })
}

export function getAria() {
  const platform = Platform.current()
  const archQualifier = platform === Platform.MAC ? "" : `-${process.arch}`

  let checksum = ""
  if (platform === Platform.MAC) {
    // noinspection SpellCheckingInspection
    checksum = "UjstpQUAtoP/sZ9SNuWwIN1WyDfvr1V3bzLGzTZCt1IqQsf9YwBSo0jrXMMRZOqv1sy5EOvp5nyC4VvJZCRVuQ=="
  }
  else if (platform === Platform.WINDOWS) {
    // noinspection SpellCheckingInspection
    checksum = process.arch === "ia32" ?
      "aulZig14OCHqj5qUWDvIAacibzW9k+gfDGDeECzWDrF7FPYzI+Vn7Q7QnW/FXNyNnbe8PeYawTlGzD3vJxLQWg==" :
      "zksKH0Uazwtc/vfGSVy+tzsNou+thSamAGTKt8P1DLoNkdSz9ueaIFoJ7jt8jlDds8Z6Rrxls6IFkZRBDxiyfg=="
  }

  //noinspection SpellCheckingInspection
  return getBinFromGithub(`aria2-${platform.buildConfigurationKey}${archQualifier}`, "1.33.1", checksum)
    .then(it => path.join(it, `aria2c${platform === Platform.WINDOWS ? ".exe" : ""}`))
}

export interface ToolDescriptor {
  name: string
  version: string

  repository?: string

  mac: string
  "linux-ia32"?: string
  "linux-x64"?: string
  "linux-armv7"?: string

  "win-ia32": string
  "win-x64": string
}

export function getTool(descriptor: ToolDescriptor): Promise<string> {
  const platform = Platform.current()
  const checksum = platform === Platform.MAC ? descriptor.mac : (descriptor as any)[`${platform.buildConfigurationKey}-${process.arch}`]
  if (checksum == null) {
    throw new Error(`Checksum not specified for ${platform}:${process.arch}`)
  }

  let archQualifier = platform === Platform.MAC ? "" : `-${process.arch}`
  if (archQualifier === "arm") {
    archQualifier = "armv7"
  }

  // https://github.com/develar/block-map-builder/releases/download/v0.0.1/block-map-builder-v0.0.1-win-x64.7z
  const version = descriptor.version
  const name = descriptor.name
  const repository = descriptor.repository || "electron-userland/electron-builder-binaries"
  const tagPrefix = descriptor.repository == null ? `${name}-` : "v"
  return getBin(name, `${name}-v${version}-${process.arch}`, `https://github.com/${repository}/releases/download/${tagPrefix}${version}/${name}-v${version}-${platform.buildConfigurationKey}${archQualifier}.7z`, checksum)
    .then(it => path.join(it, `${name}${platform === Platform.WINDOWS ? ".exe" : ""}`))
}

export function getAppBuilderTool() {
  if (isEnvTrue(process.env.USE_SYSTEM_AB)) {
    return Promise.resolve("app-builder")
  }

  // noinspection SpellCheckingInspection
  return getTool({
    repository: "develar/app-builder",
    name: "app-builder",
    version: "0.5.0",
    mac: "tsOS/dtPCSa+WI4a01nrbQNQ5QB8FMNLQENc/KLmKiQMwMIS9hifZJ1GiUK/O59aYUoCypM3semW+SRtidV5RQ==",
    "linux-ia32": "d7MgEmrw4Zmuro5crVJO7euY0+nH7yM1+zS5uh6n26J0cYMP2KKgVQrMtfoyqzGUxxtfgUc+gKxMGTqWUbF0yQ==",
    "linux-x64": "FxLl2Q6cWxqYCwW3brgkWmt6Gp2iS9yTVp3HfI0TUWq/ei2n1asZ4WeGyrkYTi+Rw0qpZm85UpDQzT9/yKkEZw==",
    "linux-armv7": "qAMXrqF5Ek3R5sUKNRPOGceOxXxgxL50KAtrLUfqOaYaUdg78VFJym1Io8o1NdLG7eayfjjwK/VJK4m/kB0OCA==",
    "win-ia32": "sDr7H4oVd2EI8n1zKRc+ic315b2ezyHoNZzk5w57rStReBk7jUL7D7Wqd3NueP5meNfQLtoA3u0T9daOCSWG3w==",
    "win-x64": "WB1rxDGF5V2Wy0Su2IAF0iIXSOlZWOyTAQathEatkTLlBuD6wAcQiTvxM/j+wgXMpWItXQULOK0Yk1rA78VU3w==",
  })
}