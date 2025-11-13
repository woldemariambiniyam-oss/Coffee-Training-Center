import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  FileText,
  Clock,
  Target,
  CheckCircle,
  XCircle,
  Play,
  BarChart3,
  Calendar,
  Trophy,
  AlertCircle,
  BookOpen,
  TrendingUp
} from 'lucide-react'
import api from '../services/api'
import moment from 'moment'
import { Card, Button, Table, Progress } from '../components/ui'
import { showToast } from '../components/ui/ToastContainer'

const Exams = () => {
  const [exams, setExams] = useState([])
  const [myAttempts, setMyAttempts] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('available')

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [examsRes, attemptsRes] = await Promise.all([
        api.get('/exams?status=active'),
        api.get('/exams/my/attempts')
      ])
      setExams(examsRes.data)
      setMyAttempts(attemptsRes.data)
    } catch (error) {
      showToast('Failed to fetch exam data', 'error')
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (exam, attempt) => {
    if (attempt) {
      return attempt.passed ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
    }
    return 'bg-blue-100 text-blue-800'
  }

  const getStatusText = (exam, attempt) => {
    if (attempt) {
      return attempt.passed ? 'Passed' : 'Failed'
    }
    return 'Available'
  }

  const getScoreColor = (score, passingScore) => {
    if (score >= passingScore) return 'text-green-600'
    if (score >= passingScore * 0.8) return 'text-yellow-600'
    return 'text-red-600'
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
            <FileText className="w-8 h-8 mr-3 text-primary-600" />
            Examinations
          </h1>
          <p className="text-text-secondary mt-1">
            Take exams and track your progress
          </p>
        </div>
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
          className="bg-gradient-coffee text-white px-4 py-2 rounded-full text-sm font-medium"
        >
          {exams.length} Active Exams
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
          onClick={() => setActiveTab('available')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'available'
              ? 'bg-white dark:bg-neutral-700 text-primary-600 shadow-sm'
              : 'text-text-secondary hover:text-text-primary'
          }`}
        >
          Available Exams
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'history'
              ? 'bg-white dark:bg-neutral-700 text-primary-600 shadow-sm'
              : 'text-text-secondary hover:text-text-primary'
          }`}
        >
          My History
        </button>
      </motion.div>

      {/* Available Exams Tab */}
      {activeTab === 'available' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          {exams.length === 0 ? (
            <Card className="p-12 text-center">
              <FileText className="w-16 h-16 text-neutral-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-text-primary mb-2">
                No Active Exams
              </h3>
              <p className="text-text-secondary">
                There are currently no active examinations available
              </p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {exams.map((exam, index) => {
                const attempt = myAttempts.find(a => a.exam_id === exam.id)
                return (
                  <motion.div
                    key={exam.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 * index }}
                  >
                    <Card className="p-6 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <h3 className="text-xl font-display font-bold text-text-primary mb-2">
                            {exam.title}
                          </h3>
                          <p className="text-text-secondary text-sm line-clamp-2 mb-4">
                            {exam.description}
                          </p>
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(exam, attempt)}`}>
                          {getStatusText(exam, attempt)}
                        </span>
                      </div>

                      <div className="space-y-3 mb-6">
                        <div className="flex items-center text-sm text-text-secondary">
                          <BookOpen className="w-4 h-4 mr-2 text-primary-600" />
                          {exam.session_title}
                        </div>
                        <div className="flex items-center text-sm text-text-secondary">
                          <Clock className="w-4 h-4 mr-2 text-primary-600" />
                          {exam.duration_minutes} minutes
                        </div>
                        <div className="flex items-center text-sm text-text-secondary">
                          <Target className="w-4 h-4 mr-2 text-primary-600" />
                          Passing Score: {exam.passing_score}%
                        </div>
                        {exam.start_time && (
                          <div className="flex items-center text-sm text-text-secondary">
                            <Calendar className="w-4 h-4 mr-2 text-primary-600" />
                            {moment(exam.start_time).format('MMM DD, YYYY HH:mm')}
                          </div>
                        )}
                      </div>

                      {attempt ? (
                        <div className="space-y-4">
                          <div className="bg-neutral-50 dark:bg-neutral-800 p-4 rounded-lg">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm font-medium text-text-secondary">Your Score</span>
                              <span className={`font-bold ${getScoreColor(attempt.percentage_score, exam.passing_score)}`}>
                                {attempt.percentage_score.toFixed(1)}%
                              </span>
                            </div>
                            <Progress
                              value={attempt.percentage_score}
                              max={100}
                              className="mb-2"
                            />
                            <div className="flex items-center justify-between text-xs text-text-secondary">
                              <span>Passing: {exam.passing_score}%</span>
                              <span className={attempt.passed ? 'text-green-600' : 'text-red-600'}>
                                {attempt.passed ? '✓ Passed' : '✗ Failed'}
                              </span>
                            </div>
                          </div>
                          <Button
                            as={Link}
                            to={`/exams/${exam.id}/take`}
                            variant="outline"
                            className="w-full"
                          >
                            <BarChart3 className="w-4 h-4 mr-2" />
                            View Results
                          </Button>
                        </div>
                      ) : (
                        <Button
                          as={Link}
                          to={`/exams/${exam.id}/take`}
                          className="w-full"
                        >
                          <Play className="w-4 h-4 mr-2" />
                          Start Exam
                        </Button>
                      )}
                    </Card>
                  </motion.div>
                )
              })}
            </div>
          )}
        </motion.div>
      )}

      {/* History Tab */}
      {activeTab === 'history' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          {myAttempts.length === 0 ? (
            <Card className="p-12 text-center">
              <Trophy className="w-16 h-16 text-neutral-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-text-primary mb-2">
                No Exam Attempts Yet
              </h3>
              <p className="text-text-secondary mb-6">
                Start your first exam to see your progress here
              </p>
              <Button onClick={() => setActiveTab('available')}>
                Browse Available Exams
              </Button>
            </Card>
          ) : (
            <Card className="p-6">
              <h2 className="text-xl font-display font-bold text-text-primary mb-6">
                Exam History
              </h2>
              <Table
                headers={['Exam', 'Score', 'Status', 'Date', 'Actions']}
                data={myAttempts.map(attempt => ({
                  exam: (
                    <div>
                      <div className="font-medium text-text-primary">{attempt.exam_title}</div>
                      <div className="text-sm text-text-secondary">{attempt.session_title}</div>
                    </div>
                  ),
                  score: (
                    <div className="flex items-center space-x-2">
                      <span className={`font-bold ${getScoreColor(attempt.percentage_score, attempt.passing_score || 70)}`}>
                        {attempt.percentage_score.toFixed(1)}%
                      </span>
                      <div className="w-16">
                        <Progress value={attempt.percentage_score} max={100} size="sm" />
                      </div>
                    </div>
                  ),
                  status: (
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      attempt.passed
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {attempt.passed ? (
                        <>
                          <CheckCircle className="w-3 h-3 inline mr-1" />
                          Passed
                        </>
                      ) : (
                        <>
                          <XCircle className="w-3 h-3 inline mr-1" />
                          Failed
                        </>
                      )}
                    </span>
                  ),
                  date: (
                    <div className="text-sm text-text-secondary">
                      {moment(attempt.submitted_at).format('MMM DD, YYYY')}
                    </div>
                  ),
                  actions: (
                    <Button
                      size="sm"
                      variant="outline"
                      as={Link}
                      to={`/exams/${attempt.exam_id}/take`}
                    >
                      View
                    </Button>
                  )
                }))}
              />
            </Card>
          )}
        </motion.div>
      )}
    </div>
  )
}

export default Exams


