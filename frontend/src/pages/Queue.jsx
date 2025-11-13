import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  Users,
  Clock,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Coffee,
  TrendingUp,
  Calendar,
  UserX
} from 'lucide-react'
import api from '../services/api'
import { Card, Button, Table } from '../components/ui'
import { showToast } from '../components/ui/ToastContainer'

const Queue = () => {
  const [myQueues, setMyQueues] = useState([])
  const [allQueues, setAllQueues] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('my-queue')

  useEffect(() => {
    fetchQueues()
  }, [])

  const fetchQueues = async () => {
    try {
      const [myQueuesResponse, allQueuesResponse] = await Promise.all([
        api.get('/queue/my/queues'),
        api.get('/queue/all')
      ])
      setMyQueues(myQueuesResponse.data)
      setAllQueues(allQueuesResponse.data)
    } catch (error) {
      showToast('Failed to fetch queue data', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleLeaveQueue = async (queueId) => {
    try {
      await api.delete(`/queue/leave/${queueId}`)
      showToast('Successfully left the queue', 'success')
      fetchQueues()
    } catch (error) {
      showToast(error.response?.data?.error || 'Failed to leave queue', 'error')
    }
  }

  const getStatusColor = (position, total) => {
    const percentage = (position / total) * 100
    if (percentage <= 25) return 'text-green-600 bg-green-100'
    if (percentage <= 50) return 'text-yellow-600 bg-yellow-100'
    if (percentage <= 75) return 'text-orange-600 bg-orange-100'
    return 'text-red-600 bg-red-100'
  }

  const getStatusIcon = (position, total) => {
    const percentage = (position / total) * 100
    if (percentage <= 25) return <CheckCircle className="w-4 h-4" />
    if (percentage <= 50) return <Clock className="w-4 h-4" />
    if (percentage <= 75) return <AlertTriangle className="w-4 h-4" />
    return <XCircle className="w-4 h-4" />
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
            <Users className="w-8 h-8 mr-3 text-primary-600" />
            Queue Management
          </h1>
          <p className="text-text-secondary mt-1">
            Manage your training session queues and waitlist positions
          </p>
        </div>
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
          className="bg-gradient-coffee text-white px-4 py-2 rounded-full text-sm font-medium"
        >
          {myQueues.length} Active Queues
        </motion.div>
      </motion.div>

      {/* Tabs */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="flex space-x-1 bg-neutral-100 dark:bg-neutral-800 p-1 rounded-lg"
      >
        <button
          onClick={() => setActiveTab('my-queue')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'my-queue'
              ? 'bg-white dark:bg-neutral-700 text-primary-600 shadow-sm'
              : 'text-text-secondary hover:text-text-primary'
          }`}
        >
          My Queue
        </button>
        <button
          onClick={() => setActiveTab('all-queues')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'all-queues'
              ? 'bg-white dark:bg-neutral-700 text-primary-600 shadow-sm'
              : 'text-text-secondary hover:text-text-primary'
          }`}
        >
          All Queues
        </button>
      </motion.div>

      {/* My Queue Tab */}
      {activeTab === 'my-queue' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          {myQueues.length === 0 ? (
            <Card className="p-12 text-center">
              <Users className="w-16 h-16 text-neutral-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-text-primary mb-2">
                No Active Queues
              </h3>
              <p className="text-text-secondary mb-6">
                You're not currently in any training session queues
              </p>
              <Button onClick={() => setActiveTab('all-queues')}>
                Browse Available Sessions
              </Button>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {myQueues.map((queue, index) => (
                <motion.div
                  key={queue.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 * index }}
                >
                  <Card className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="text-xl font-display font-bold text-text-primary mb-2">
                          {queue.session_title}
                        </h3>
                        <div className="flex items-center space-x-4 mb-4">
                          <div className={`flex items-center space-x-2 px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(queue.queue_position, queue.total_in_queue)}`}>
                            {getStatusIcon(queue.queue_position, queue.total_in_queue)}
                            <span>Position {queue.queue_position} of {queue.total_in_queue}</span>
                          </div>
                        </div>
                        <div className="space-y-2 text-sm text-text-secondary">
                          <div className="flex items-center">
                            <Calendar className="w-4 h-4 mr-2" />
                            Joined: {new Date(queue.joined_at).toLocaleDateString()}
                          </div>
                          <div className="flex items-center">
                            <Clock className="w-4 h-4 mr-2" />
                            Estimated wait: {Math.ceil(queue.queue_position / 2)} hours
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex space-x-3">
                      <Button
                        variant="outline"
                        className="flex-1"
                        onClick={() => showToast(`You're in position ${queue.queue_position}`, 'info')}
                      >
                        <TrendingUp className="w-4 h-4 mr-2" />
                        View Progress
                      </Button>
                      <Button
                        variant="destructive"
                        onClick={() => handleLeaveQueue(queue.id)}
                      >
                        <UserX className="w-4 h-4 mr-2" />
                        Leave
                      </Button>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      )}

      {/* All Queues Tab */}
      {activeTab === 'all-queues' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="p-6">
            <h2 className="text-xl font-display font-bold text-text-primary mb-6">
              All Session Queues
            </h2>
            <Table
              headers={['Session', 'Queue Length', 'Status', 'Actions']}
              data={allQueues.map(queue => ({
                session: (
                  <div>
                    <div className="font-medium text-text-primary">{queue.session_title}</div>
                    <div className="text-sm text-text-secondary">{queue.session_date}</div>
                  </div>
                ),
                queueLength: (
                  <div className="flex items-center space-x-2">
                    <Users className="w-4 h-4 text-primary-600" />
                    <span className="font-medium">{queue.queue_length}</span>
                  </div>
                ),
                status: (
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    queue.queue_length === 0
                      ? 'bg-green-100 text-green-800'
                      : queue.queue_length < 5
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {queue.queue_length === 0 ? 'No Queue' : queue.queue_length < 5 ? 'Short' : 'Long'}
                  </span>
                ),
                actions: (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => showToast(`Queue length: ${queue.queue_length}`, 'info')}
                  >
                    View Details
                  </Button>
                )
              }))}
            />
          </Card>
        </motion.div>
      )}
    </div>
  )
}

export default Queue


