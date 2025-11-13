import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  CheckCircle,
  AlertCircle,
  Coffee,
  Search,
  Filter
} from 'lucide-react'
import api from '../services/api'
import moment from 'moment'
import { Card, Button, Input } from '../components/ui'
import { showToast } from '../components/ui/ToastContainer'

const Sessions = () => {
  const [sessions, setSessions] = useState([])
  const [filteredSessions, setFilteredSessions] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  useEffect(() => {
    fetchSessions()
  }, [])

  useEffect(() => {
    filterSessions()
  }, [sessions, searchTerm, statusFilter])

  const fetchSessions = async () => {
    try {
      const response = await api.get('/sessions?upcoming=true')
      setSessions(response.data)
    } catch (error) {
      showToast('Failed to fetch sessions', 'error')
    } finally {
      setLoading(false)
    }
  }

  const filterSessions = () => {
    let filtered = sessions

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(session =>
        session.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        session.description.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(session => {
        if (statusFilter === 'available') return session.status === 'scheduled' && session.enrolled_count < session.max_capacity
        if (statusFilter === 'full') return session.enrolled_count >= session.max_capacity
        if (statusFilter === 'enrolled') return session.enrolled // Assuming this field exists
        return true
      })
    }

    setFilteredSessions(filtered)
  }

  const handleEnroll = async (sessionId) => {
    try {
      await api.post(`/sessions/${sessionId}/enroll`)
      showToast('Successfully enrolled in session!', 'success')
      fetchSessions()
    } catch (error) {
      showToast(error.response?.data?.error || 'Enrollment failed', 'error')
    }
  }

  const getStatusColor = (session) => {
    if (session.enrolled_count >= session.max_capacity) return 'bg-red-100 text-red-800'
    if (session.status !== 'scheduled') return 'bg-gray-100 text-gray-800'
    return 'bg-green-100 text-green-800'
  }

  const getStatusText = (session) => {
    if (session.enrolled_count >= session.max_capacity) return 'Full'
    if (session.status !== 'scheduled') return 'Not Available'
    return 'Available'
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
            <Coffee className="w-8 h-8 mr-3 text-primary-600" />
            Training Sessions
          </h1>
          <p className="text-text-secondary mt-1">
            Discover and enroll in upcoming training sessions
          </p>
        </div>
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
          className="bg-gradient-coffee text-white px-4 py-2 rounded-full text-sm font-medium"
        >
          {filteredSessions.length} Sessions Available
        </motion.div>
      </motion.div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="flex flex-col sm:flex-row gap-4"
      >
        <div className="flex-1">
          <Input
            placeholder="Search sessions..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            icon={<Search className="w-4 h-4" />}
          />
        </div>
        <div className="flex gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            <option value="all">All Sessions</option>
            <option value="available">Available</option>
            <option value="full">Full</option>
            <option value="enrolled">My Sessions</option>
          </select>
        </div>
      </motion.div>

      {/* Sessions Grid */}
      {filteredSessions.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center py-12"
        >
          <Calendar className="w-16 h-16 text-neutral-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-text-primary mb-2">
            {searchTerm || statusFilter !== 'all' ? 'No sessions match your filters' : 'No upcoming sessions'}
          </h3>
          <p className="text-text-secondary">
            {searchTerm || statusFilter !== 'all'
              ? 'Try adjusting your search or filter criteria'
              : 'Check back later for new training opportunities'
            }
          </p>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {filteredSessions.map((session, index) => (
            <motion.div
              key={session.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * index }}
            >
              <Card className="p-6 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-xl font-display font-bold text-text-primary mb-2 line-clamp-2">
                      {session.title}
                    </h3>
                    <p className="text-text-secondary text-sm line-clamp-3 mb-4">
                      {session.description}
                    </p>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(session)}`}>
                    {getStatusText(session)}
                  </span>
                </div>

                <div className="space-y-3 mb-6">
                  <div className="flex items-center text-sm text-text-secondary">
                    <Calendar className="w-4 h-4 mr-2 text-primary-600" />
                    {moment(session.session_date).format('MMM DD, YYYY')}
                  </div>
                  <div className="flex items-center text-sm text-text-secondary">
                    <Clock className="w-4 h-4 mr-2 text-primary-600" />
                    {session.duration_minutes} minutes
                  </div>
                  <div className="flex items-center text-sm text-text-secondary">
                    <Users className="w-4 h-4 mr-2 text-primary-600" />
                    {session.enrolled_count}/{session.max_capacity} enrolled
                  </div>
                  {session.location && (
                    <div className="flex items-center text-sm text-text-secondary">
                      <MapPin className="w-4 h-4 mr-2 text-primary-600" />
                      {session.location}
                    </div>
                  )}
                </div>

                <Button
                  onClick={() => handleEnroll(session.id)}
                  disabled={session.enrolled_count >= session.max_capacity || session.status !== 'scheduled'}
                  className="w-full"
                  variant={session.enrolled_count >= session.max_capacity || session.status !== 'scheduled' ? 'secondary' : 'primary'}
                >
                  {session.enrolled_count >= session.max_capacity ? (
                    <>
                      <AlertCircle className="w-4 h-4 mr-2" />
                      Session Full
                    </>
                  ) : session.status !== 'scheduled' ? (
                    <>
                      <AlertCircle className="w-4 h-4 mr-2" />
                      Not Available
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Enroll Now
                    </>
                  )}
                </Button>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  )
}

export default Sessions


