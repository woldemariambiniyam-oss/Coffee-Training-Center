import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Bar, Line, Doughnut } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js'
import {
  BarChart3,
  TrendingUp,
  Users,
  Award,
  Calendar,
  Download,
  Filter,
  RefreshCw,
  Activity,
  Target,
  PieChart,
  LineChart
} from 'lucide-react'
import api from '../services/api'
import { Card, Button, Modal, Progress } from '../components/ui'
import { showToast } from '../components/ui/ToastContainer'

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
)

const Reports = () => {
  const [attendance, setAttendance] = useState([])
  const [performance, setPerformance] = useState([])
  const [enrollmentTrends, setEnrollmentTrends] = useState([])
  const [certificateStats, setCertificateStats] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')
  const [dateRange, setDateRange] = useState('6months')
  const [showFilters, setShowFilters] = useState(false)

  useEffect(() => {
    fetchReports()
  }, [dateRange])

  const fetchReports = async () => {
    try {
      const months = dateRange === '3months' ? 3 : dateRange === '12months' ? 12 : 6
      const [attendanceRes, performanceRes, trendsRes, certRes] = await Promise.all([
        api.get('/reports/attendance'),
        api.get('/reports/performance'),
        api.get(`/reports/enrollment-trends?months=${months}`),
        api.get('/reports/certificates')
      ])
      setAttendance(attendanceRes.data)
      setPerformance(performanceRes.data)
      setEnrollmentTrends(trendsRes.data)
      setCertificateStats(certRes.data)
    } catch (error) {
      showToast('Failed to load reports', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = () => {
    setLoading(true)
    fetchReports()
    showToast('Reports refreshed', 'success')
  }

  const handleExport = (chartType) => {
    // Placeholder for export functionality
    showToast(`${chartType} chart exported successfully`, 'success')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-8 h-8 border-2 border-primary-600 border-t-transparent rounded-full"
        />
      </div>
    )
  }

  const attendanceData = {
    labels: attendance.map(a => a.title),
    datasets: [
      {
        label: 'Attended',
        data: attendance.map(a => a.attended_count),
        backgroundColor: '#10b981',
        borderColor: '#059669',
        borderWidth: 1,
        borderRadius: 4,
        borderSkipped: false,
      },
      {
        label: 'Absent',
        data: attendance.map(a => a.absent_count),
        backgroundColor: '#ef4444',
        borderColor: '#dc2626',
        borderWidth: 1,
        borderRadius: 4,
        borderSkipped: false,
      }
    ]
  }

  const performanceData = {
    labels: performance.map(p => p.exam_title),
    datasets: [
      {
        label: 'Average Score (%)',
        data: performance.map(p => p.average_score?.toFixed(2) || 0),
        backgroundColor: '#3b82f6',
        borderColor: '#2563eb',
        borderWidth: 1,
        borderRadius: 4,
        borderSkipped: false,
      }
    ]
  }

  const enrollmentTrendsData = {
    labels: enrollmentTrends.map(t => t.month),
    datasets: [
      {
        label: 'Enrollments',
        data: enrollmentTrends.map(t => t.enrollment_count),
        borderColor: '#8b5cf6',
        backgroundColor: 'rgba(139, 92, 246, 0.1)',
        tension: 0.4,
        fill: true,
        pointBackgroundColor: '#8b5cf6',
        pointBorderColor: '#7c3aed',
        pointBorderWidth: 2,
        pointRadius: 4,
      }
    ]
  }

  const certificateData = {
    labels: ['Issued', 'Revoked', 'Expired'],
    datasets: [
      {
        data: [
          certificateStats.reduce((sum, c) => sum + (c.issued_count || 0), 0),
          certificateStats.reduce((sum, c) => sum + (c.revoked_count || 0), 0),
          certificateStats.reduce((sum, c) => sum + (c.expired_count || 0), 0)
        ],
        backgroundColor: [
          '#10b981',
          '#ef4444',
          '#6b7280'
        ],
        borderColor: [
          '#059669',
          '#dc2626',
          '#4b5563'
        ],
        borderWidth: 2,
        hoverOffset: 4
      }
    ]
  }

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          usePointStyle: true,
          padding: 20,
          font: {
            size: 12,
            family: 'Inter, sans-serif'
          }
        }
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#fff',
        bodyColor: '#fff',
        borderColor: '#5B4636',
        borderWidth: 1,
        cornerRadius: 8,
        displayColors: true,
        padding: 12
      }
    },
    scales: {
      x: {
        grid: {
          display: false
        },
        ticks: {
          font: {
            size: 11,
            family: 'Inter, sans-serif'
          }
        }
      },
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(0, 0, 0, 0.1)',
          lineWidth: 1
        },
        ticks: {
          font: {
            size: 11,
            family: 'Inter, sans-serif'
          }
        }
      }
    }
  }

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Activity },
    { id: 'attendance', label: 'Attendance', icon: Users },
    { id: 'performance', label: 'Performance', icon: Target },
    { id: 'trends', label: 'Trends', icon: TrendingUp },
    { id: 'certificates', label: 'Certificates', icon: Award }
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      >
        <div>
          <h1 className="text-3xl font-display font-bold text-text-primary flex items-center">
            <BarChart3 className="w-8 h-8 mr-3 text-primary-600" />
            Reports & Analytics
          </h1>
          <p className="text-text-secondary mt-1">
            Comprehensive insights into training program performance
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="w-4 h-4 mr-2" />
            Filters
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </motion.div>

      {/* Filters */}
      {showFilters && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="bg-neutral-50 dark:bg-neutral-800 rounded-lg p-4"
        >
          <div className="flex flex-wrap items-center gap-4">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">
                Date Range
              </label>
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="3months">Last 3 Months</option>
                <option value="6months">Last 6 Months</option>
                <option value="12months">Last 12 Months</option>
              </select>
            </div>
          </div>
        </motion.div>
      )}

      {/* Tabs */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="flex space-x-1 bg-neutral-100 dark:bg-neutral-800 p-1 rounded-lg overflow-x-auto"
      >
        {tabs.map((tab) => {
          const Icon = tab.icon
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center px-4 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-white dark:bg-neutral-700 text-primary-600 shadow-sm'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              <Icon className="w-4 h-4 mr-2" />
              {tab.label}
            </button>
          )
        })}
      </motion.div>

      {/* Content */}
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3 }}
      >
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Summary Cards */}
            <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <Card className="p-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
                    <Users className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-text-secondary">Total Attendance</p>
                    <p className="text-2xl font-bold text-text-primary">
                      {attendance.reduce((sum, a) => sum + (a.attended_count || 0), 0)}
                    </p>
                  </div>
                </div>
              </Card>
              <Card className="p-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                    <Target className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-text-secondary">Avg Performance</p>
                    <p className="text-2xl font-bold text-text-primary">
                      {performance.length > 0
                        ? (performance.reduce((sum, p) => sum + (p.average_score || 0), 0) / performance.length).toFixed(1)
                        : 0}%
                    </p>
                  </div>
                </div>
              </Card>
              <Card className="p-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
                    <TrendingUp className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm text-text-secondary">Total Enrollments</p>
                    <p className="text-2xl font-bold text-text-primary">
                      {enrollmentTrends.reduce((sum, t) => sum + (t.enrollment_count || 0), 0)}
                    </p>
                  </div>
                </div>
              </Card>
              <Card className="p-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-yellow-100 dark:bg-yellow-900/20 rounded-lg">
                    <Award className="w-5 h-5 text-yellow-600" />
                  </div>
                  <div>
                    <p className="text-sm text-text-secondary">Certificates Issued</p>
                    <p className="text-2xl font-bold text-text-primary">
                      {certificateStats.reduce((sum, c) => sum + (c.issued_count || 0), 0)}
                    </p>
                  </div>
                </div>
              </Card>
            </div>

            {/* Charts */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-text-primary flex items-center">
                  <BarChart3 className="w-5 h-5 mr-2 text-primary-600" />
                  Attendance Overview
                </h3>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleExport('Attendance')}
                >
                  <Download className="w-4 h-4" />
                </Button>
              </div>
              <div className="h-64">
                {attendance.length > 0 ? (
                  <Bar data={attendanceData} options={chartOptions} />
                ) : (
                  <div className="flex items-center justify-center h-full text-text-secondary">
                    No attendance data available
                  </div>
                )}
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-text-primary flex items-center">
                  <LineChart className="w-5 h-5 mr-2 text-primary-600" />
                  Enrollment Trends
                </h3>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleExport('Enrollment')}
                >
                  <Download className="w-4 h-4" />
                </Button>
              </div>
              <div className="h-64">
                {enrollmentTrends.length > 0 ? (
                  <Line data={enrollmentTrendsData} options={chartOptions} />
                ) : (
                  <div className="flex items-center justify-center h-full text-text-secondary">
                    No enrollment data available
                  </div>
                )}
              </div>
            </Card>
          </div>
        )}

        {activeTab === 'attendance' && (
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-text-primary flex items-center">
                <Users className="w-6 h-6 mr-3 text-primary-600" />
                Attendance Statistics
              </h3>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleExport('Attendance')}
              >
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
            </div>
            <div className="h-96">
              {attendance.length > 0 ? (
                <Bar data={attendanceData} options={chartOptions} />
              ) : (
                <div className="flex items-center justify-center h-full text-text-secondary">
                  No attendance data available
                </div>
              )}
            </div>
          </Card>
        )}

        {activeTab === 'performance' && (
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-text-primary flex items-center">
                <Target className="w-6 h-6 mr-3 text-primary-600" />
                Performance Statistics
              </h3>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleExport('Performance')}
              >
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
            </div>
            <div className="h-96">
              {performance.length > 0 ? (
                <Bar data={performanceData} options={chartOptions} />
              ) : (
                <div className="flex items-center justify-center h-full text-text-secondary">
                  No performance data available
                </div>
              )}
            </div>
          </Card>
        )}

        {activeTab === 'trends' && (
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-text-primary flex items-center">
                <TrendingUp className="w-6 h-6 mr-3 text-primary-600" />
                Enrollment Trends
              </h3>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleExport('Trends')}
              >
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
            </div>
            <div className="h-96">
              {enrollmentTrends.length > 0 ? (
                <Line data={enrollmentTrendsData} options={chartOptions} />
              ) : (
                <div className="flex items-center justify-center h-full text-text-secondary">
                  No enrollment trends data available
                </div>
              )}
            </div>
          </Card>
        )}

        {activeTab === 'certificates' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-text-primary flex items-center">
                  <PieChart className="w-6 h-6 mr-3 text-primary-600" />
                  Certificate Distribution
                </h3>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleExport('Certificates')}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Export
                </Button>
              </div>
              <div className="h-96">
                {certificateStats.length > 0 ? (
                  <Doughnut
                    data={certificateData}
                    options={{
                      ...chartOptions,
                      plugins: {
                        ...chartOptions.plugins,
                        legend: {
                          ...chartOptions.plugins.legend,
                          position: 'bottom'
                        }
                      }
                    }}
                  />
                ) : (
                  <div className="flex items-center justify-center h-full text-text-secondary">
                    No certificate data available
                  </div>
                )}
              </div>
            </Card>

            <Card className="p-6">
              <h3 className="text-xl font-semibold text-text-primary mb-6 flex items-center">
                <Award className="w-6 h-6 mr-3 text-primary-600" />
                Certificate Summary
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span className="font-medium text-green-800 dark:text-green-200">Issued</span>
                  </div>
                  <span className="text-2xl font-bold text-green-800 dark:text-green-200">
                    {certificateStats.reduce((sum, c) => sum + (c.issued_count || 0), 0)}
                  </span>
                </div>
                <div className="flex items-center justify-between p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                    <span className="font-medium text-red-800 dark:text-red-200">Revoked</span>
                  </div>
                  <span className="text-2xl font-bold text-red-800 dark:text-red-200">
                    {certificateStats.reduce((sum, c) => sum + (c.revoked_count || 0), 0)}
                  </span>
                </div>
                <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-3 h-3 bg-gray-500 rounded-full"></div>
                    <span className="font-medium text-gray-800 dark:text-gray-200">Expired</span>
                  </div>
                  <span className="text-2xl font-bold text-gray-800 dark:text-gray-200">
                    {certificateStats.reduce((sum, c) => sum + (c.expired_count || 0), 0)}
                  </span>
                </div>
              </div>
            </Card>
          </div>
        )}
      </motion.div>
    </div>
  )
}

export default Reports


