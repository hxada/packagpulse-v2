import * as fs from 'fs/promises'
import * as path from 'path'

//检查目录是否有package.json，如果有返回true，没有返回false，是异步函数，返回promise
async function hasPackageJson(directory: string): Promise<boolean> {
  //返回的是一个布尔值，输入的是一个字符串
  try {
    const packageJsonPath = path.resolve(directory, 'package.json') //获取绝对路径
    await fs.access(packageJsonPath, fs.constants.F_OK) //检查文件是否存在
    return true
  } catch (error) {
    return false
  }
}

//获取目录下的所有package.json，返回数组，是异步函数，返回promise
async function getPackageList(directory: string): Promise<string[]> {
  //返回的是一个数组，输入的是一个字符串
  try {
    const files = await fs.readdir(directory) //读取目录 返回文件名的数组
    const packageDirs = await Promise.all(
      //Promise.all()方法用于将多个 Promise 实例，包装成一个新的 Promise 实例，返回一个promise
      files.map(async file => {
        //files指的是目录下的文件名数组

        const filePath = path.resolve(directory, file) //获取绝对路径
        const fileStat = await fs.stat(filePath) //获取文件信息

        if (fileStat.isDirectory() && file !== '.bin') {
          const hasPackageJsonResult = await hasPackageJson(filePath)
          if (hasPackageJsonResult) {
            return file
          } else {
            const subPackageDirs = await getPackageList(filePath)
            return subPackageDirs.map(subDir => path.join(file, subDir)) //path.join()方法用于连接路径，将子目录和父目录连接起来
          }
        }
        return null
      })
    )
    return packageDirs.flat().filter(packageDir => packageDir !== null) as string[]
  } catch (error) {
    console.error(`Error in getPackageList for directory: ${directory}`, error)
    throw error
  }
}
// 清理版本号中的特殊符号的辅助函数
function cleanVersionSymbol(version: string): string {
  return version.replace(/[~^><=]/g, '') // 删除特殊符号
}
// 清理依赖关系中的版本号特殊符号的辅助函数
function cleanVersionSymbols(dependencies: Record<string, string>): Record<string, string> {
  const cleanedDependencies: Record<string, string> = {}
  for (const dependency in dependencies) {
    if (dependencies.hasOwnProperty(dependency)) {
      cleanedDependencies[dependency] = cleanVersionSymbol(dependencies[dependency])
    }
  }
  return cleanedDependencies
}

export async function analyze() {
  try {
    console.time('Search') // 开始计时
    const nodeModulesPath = path.resolve(__dirname, '../node_modules')
    const packages = await getPackageList(nodeModulesPath)

    const dependenciesList = await Promise.all(
      packages.map(async packageName => {
        const packageJsonPath = path.resolve(nodeModulesPath, packageName, 'package.json')
        const packageData = await fs.readFile(packageJsonPath, 'utf-8')
        const packageObj = JSON.parse(packageData)

        // 清理 dependencies 中的版本号特殊符号
        const cleanedDependencies = cleanVersionSymbols(packageObj.dependencies)
        // 清理 devDependencies 中的版本号特殊符号
        const cleanedDevDependencies = cleanVersionSymbols(packageObj.devDependencies)
        // 清理版本号中的特殊符号
        const cleanedVersion = cleanVersionSymbol(packageObj.version)

        const numDependencies = Object.keys(cleanedDependencies).length + Object.keys(cleanedDevDependencies).length

        return {
          packageName,
          dependencies: cleanedDependencies,
          devDependencies: cleanedDevDependencies,
          version: cleanedVersion,
          numDependencies
        }
      })
    )
    const outputFilePath = path.resolve(__dirname, 'packagesLists.json')
    await fs.writeFile(outputFilePath, JSON.stringify(dependenciesList, null, 2), 'utf-8')

    console.log(`Dependencies list written successfully!`)
    console.timeEnd('Search') // 结束计时
    return dependenciesList
  } catch (err) {
    console.log(err)
    return []
  }
}

analyze()
