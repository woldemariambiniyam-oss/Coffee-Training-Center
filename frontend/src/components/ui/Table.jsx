import { useState } from 'react'
import { motion } from 'framer-motion'
import { ChevronUp, ChevronDown, Search, Filter } from 'lucide-react'
import Input from './Input'

const Table = ({
  columns,
  data,
  searchable = false,
  sortable = true,
  pagination = false,
  pageSize = 10,
  className = '',
  emptyMessage = 'No data available',
}) => {
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' })
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)

  // Filter data based on search term
  const filteredData = data.filter(item =>
    Object.values(item).some(value =>
      String(value).toLowerCase().includes(searchTerm.toLowerCase())
    )
  )

  // Sort data
  const sortedData = [...filteredData].sort((a, b) => {
    if (!sortConfig.key) return 0

    const aValue = a[sortConfig.key]
    const bValue = b[sortConfig.key]

    if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1
    if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1
    return 0
  })

  // Paginate data
  const totalPages = Math.ceil(sortedData.length / pageSize)
  const paginatedData = pagination
    ? sortedData.slice((currentPage - 1) * pageSize, currentPage * pageSize)
    : sortedData

  const handleSort = (key) => {
    if (!sortable) return

    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc',
    }))
  }

  const getSortIcon = (columnKey) => {
    if (sortConfig.key !== columnKey) {
      return <ChevronUp className="w-4 h-4 opacity-30" />
    }
    return sortConfig.direction === 'asc'
      ? <ChevronUp className="w-4 h-4" />
      : <ChevronDown className="w-4 h-4" />
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Search and filters */}
      {(searchable || pagination) && (
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          {searchable && (
            <div className="w-full sm:w-80">
              <Input
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                icon={<Search className="w-4 h-4" />}
              />
            </div>
          )}

          {pagination && (
            <div className="text-sm text-text-secondary">
              Showing {Math.min((currentPage - 1) * pageSize + 1, filteredData.length)} to{' '}
              {Math.min(currentPage * pageSize, filteredData.length)} of {filteredData.length} entries
            </div>
          )}
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto">
        <motion.table
          className="w-full bg-white dark:bg-neutral-800 rounded-lg shadow-soft border border-neutral-200 dark:border-neutral-700"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          <thead className="bg-neutral-50 dark:bg-neutral-700">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  className={`px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider ${
                    column.sortable !== false && sortable ? 'cursor-pointer hover:bg-neutral-100 dark:hover:bg-neutral-600' : ''
                  }`}
                  onClick={() => column.sortable !== false && handleSort(column.key)}
                >
                  <div className="flex items-center space-x-1">
                    <span>{column.label || column.header}</span>
                    {column.sortable !== false && sortable && getSortIcon(column.key)}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-200 dark:divide-neutral-700">
            {paginatedData.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-6 py-12 text-center text-text-secondary"
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              paginatedData.map((item, index) => (
                <motion.tr
                  key={item.id || index}
                  className="hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2, delay: index * 0.05 }}
                >
                  {columns.map((column) => (
                    <td key={column.key} className="px-6 py-4 whitespace-nowrap text-sm text-text-primary">
                      {column.render ? column.render(item) : item[column.key]}
                    </td>
                  ))}
                </motion.tr>
              ))
            )}
          </tbody>
        </motion.table>
      </div>

      {/* Pagination */}
      {pagination && totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 text-sm border border-neutral-300 rounded hover:bg-neutral-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>

            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const pageNumber = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i
              return (
                <button
                  key={pageNumber}
                  onClick={() => setCurrentPage(pageNumber)}
                  className={`px-3 py-1 text-sm border rounded ${
                    currentPage === pageNumber
                      ? 'bg-primary-600 text-white border-primary-600'
                      : 'border-neutral-300 hover:bg-neutral-50'
                  }`}
                >
                  {pageNumber}
                </button>
              )
            })}

            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="px-3 py-1 text-sm border border-neutral-300 rounded hover:bg-neutral-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default Table
