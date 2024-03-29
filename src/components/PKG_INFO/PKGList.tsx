import React, { useEffect, useState } from 'react'
import dependenciesList from '../../../bin/packagesLists.json'

interface Dependency {
  [dependencyName: string]: string
}
interface PackageData {
  packageName: string
  dependencies: Dependency
  devDependencies: Dependency
  numDependencies: number
  version: string
}
interface ResultProps {
  onDataFiltered: (filteredData: PackageData[]) => void
  selectedType: string
}

export default function PKGList({ onDataFiltered, selectedType }: ResultProps) {
  const [data, setData] = useState<PackageData[]>([])

  const [searchTerm, setSearchTerm] = useState<string>('')

  const filteredData = data.filter(item => item.packageName.toLowerCase().includes(searchTerm.toLowerCase()))

  useEffect(() => {
    setData(dependenciesList as PackageData[])
  }, [])

  useEffect(() => {
    const fetchData = async () => {
      if (onDataFiltered) onDataFiltered(filteredData)
    }
    fetchData()
  }, [searchTerm])

  return (
    <div id="InfoList">
      <input id="searchBox" type="text" placeholder="输入要搜索的依赖名称" value={searchTerm} onChange={e => setSearchTerm(e.target.value)}></input>
      <pre>
        {filteredData.map((item, index) => (
          <React.Fragment key={index}>
            <span style={{ color: 'red', fontWeight: 'bold' }}>{item.packageName}</span>:{' '}
            <span style={{ color: 'red', fontWeight: 'bold' }}> {item.numDependencies}</span>
            <pre>{JSON.stringify({ ...item, packageName: undefined, numDependencies: undefined }, null, 1)}</pre>
            <br />
          </React.Fragment>
        ))}
      </pre>
    </div>
  )
}
