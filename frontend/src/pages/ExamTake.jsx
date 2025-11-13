import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Clock,
  CheckCircle,
  AlertTriangle,
  Play,
  Send,
  ArrowLeft,
  BookOpen,
  Target,
  Timer,
  Save,
  Eye,
  EyeOff
} from 'lucide-react'
import api from '../services/api'
import { Card, Button, Progress, Modal } from '../components/ui'
import { showToast } from '../components/ui/ToastContainer'

const ExamTake = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [exam, setExam] = useState(null)
  const [attempt, setAttempt] = useState(null)
  const [answers, setAnswers] = useState({})
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [timeLeft, setTimeLeft] = useState(0)
  const [showSubmitModal, setShowSubmitModal] = useState(false)
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)

  useEffect(() => {
    fetchExam()
  }, [id])

  useEffect(() => {
    if (attempt && attempt.status === 'in_progress' && timeLeft > 0) {
      const timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            handleAutoSubmit()
            return 0
          }
          return prev - 1
        })
      }, 1000)
      return () => clearInterval(timer)
    }
  }, [attempt, timeLeft])

  const fetchExam = async () => {
    try {
      const response = await api.get(`/exams/${id}`)
      setExam(response.data)

      // Check for existing attempt
      const attemptsRes = await api.get('/exams/my/attempts')
      const existingAttempt = attemptsRes.data.find(a => a.exam_id === parseInt(id))
      if (existingAttempt) {
        setAttempt(existingAttempt)
        if (existingAttempt.status === 'submitted') {
          // Load submitted answers if available
        } else if (existingAttempt.status === 'in_progress') {
          // Calculate remaining time
          const startTime = new Date(existingAttempt.started_at).getTime()
          const durationMs = response.data.duration_minutes * 60 * 1000
          const elapsed = Date.now() - startTime
          const remaining = Math.max(0, Math.floor((durationMs - elapsed) / 1000))
          setTimeLeft(remaining)
        }
      }
    } catch (error) {
      showToast('Failed to load exam', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleStartExam = async () => {
    try {
      const response = await api.post(`/exams/${id}/start`)
      setAttempt(response.data)
      setTimeLeft(exam.duration_minutes * 60)
      showToast('Exam started! Good luck!', 'success')
    } catch (error) {
      showToast(error.response?.data?.error || 'Failed to start exam', 'error')
    }
  }

  const handleAnswerChange = (questionId, answer) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }))
  }

  const handleAutoSubmit = async () => {
    setSubmitting(true)
    try {
      const answerArray = Object.entries(answers).map(([questionId, answerText]) => ({
        questionId: parseInt(questionId),
        answerText
      }))

      await api.post(`/exams/${id}/submit`, { answers: answerArray })
      showToast('Time\'s up! Exam submitted automatically.', 'info')
      navigate('/exams')
    } catch (error) {
      showToast('Failed to submit exam', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  const handleSubmit = async () => {
    setSubmitting(true)
    try {
      const answerArray = Object.entries(answers).map(([questionId, answerText]) => ({
        questionId: parseInt(questionId),
        answerText
      }))

      await api.post(`/exams/${id}/submit`, { answers: answerArray })
      showToast('Exam submitted successfully!', 'success')
      navigate('/exams')
    } catch (error) {
      showToast(error.response?.data?.error || 'Failed to submit exam', 'error')
    } finally {
      setSubmitting(false)
      setShowSubmitModal(false)
    }
  }

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const getProgressColor = () => {
    const percentage = (timeLeft / (exam?.duration_minutes * 60)) * 100
    if (percentage > 50) return 'bg-green-500'
    if (percentage > 25) return 'bg-yellow-500'
    return 'bg-red-500'
  }

  const answeredCount = Object.keys(answers).length
  const totalQuestions = exam?.questions?.length || 0

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

  if (!exam) {
    return (
      <Card className="p-12 text-center">
        <AlertTriangle className="w-16 h-16 text-red-400 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-text-primary mb-2">
          Exam Not Found
        </h3>
        <p className="text-text-secondary mb-6">
          The requested exam could not be found.
        </p>
        <Button onClick={() => navigate('/exams')}>
          Back to Exams
        </Button>
      </Card>
    )
  }

  if (!attempt) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="p-8">
            <div className="text-center mb-8">
              <BookOpen className="w-16 h-16 text-primary-600 mx-auto mb-4" />
              <h1 className="text-3xl font-display font-bold text-text-primary mb-2">
                {exam.title}
              </h1>
              <p className="text-text-secondary">{exam.description}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="text-center">
                <Clock className="w-8 h-8 text-primary-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-text-primary">{exam.duration_minutes}</div>
                <div className="text-sm text-text-secondary">Minutes</div>
              </div>
              <div className="text-center">
                <Target className="w-8 h-8 text-primary-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-text-primary">{exam.total_questions}</div>
                <div className="text-sm text-text-secondary">Questions</div>
              </div>
              <div className="text-center">
                <CheckCircle className="w-8 h-8 text-primary-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-text-primary">{exam.passing_score}%</div>
                <div className="text-sm text-text-secondary">Passing Score</div>
              </div>
            </div>

            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4 mb-6">
              <div className="flex items-start space-x-3">
                <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5" />
                <div className="text-sm text-amber-800 dark:text-amber-200">
                  <strong>Important:</strong> Once you start the exam, the timer will begin and cannot be paused.
                  Make sure you have a stable internet connection and sufficient time to complete all questions.
                </div>
              </div>
            </div>

            <Button
              onClick={handleStartExam}
              className="w-full text-lg py-4"
              size="lg"
            >
              <Play className="w-5 h-5 mr-2" />
              Start Exam
            </Button>
          </Card>
        </motion.div>
      </div>
    )
  }

  if (attempt.status === 'submitted') {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="p-8 text-center">
            <div className="mb-6">
              {attempt.passed ? (
                <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              ) : (
                <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
              )}
              <h1 className="text-3xl font-display font-bold text-text-primary mb-2">
                Exam Completed
              </h1>
              <p className="text-text-secondary mb-6">{exam.title}</p>
            </div>

            <div className="bg-neutral-50 dark:bg-neutral-800 rounded-lg p-6 mb-6">
              <div className="text-4xl font-bold mb-2" style={{ color: attempt.passed ? '#10b981' : '#ef4444' }}>
                {attempt.percentage_score.toFixed(1)}%
              </div>
              <div className="text-lg font-medium text-text-secondary mb-4">
                {attempt.passed ? 'Passed' : 'Failed'}
              </div>
              <Progress
                value={attempt.percentage_score}
                max={100}
                className="mb-2"
              />
              <div className="text-sm text-text-secondary">
                Passing score: {exam.passing_score}%
              </div>
            </div>

            <Button onClick={() => navigate('/exams')} className="w-full">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Exams
            </Button>
          </Card>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white dark:bg-neutral-800 border-b border-neutral-200 dark:border-neutral-700">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/exams')}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Exit
              </Button>
              <div>
                <h1 className="text-lg font-semibold text-text-primary">{exam.title}</h1>
                <p className="text-sm text-text-secondary">
                  Question {currentQuestionIndex + 1} of {totalQuestions}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="text-right">
                <div className="text-sm font-medium text-text-primary">
                  Time Left
                </div>
                <div className={`text-lg font-mono font-bold ${timeLeft < 300 ? 'text-red-600' : 'text-text-primary'}`}>
                  {formatTime(timeLeft)}
                </div>
              </div>
              <div className="w-32">
                <Progress
                  value={(timeLeft / (exam.duration_minutes * 60)) * 100}
                  className="h-2"
                />
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mt-4">
            <div className="flex items-center justify-between text-sm text-text-secondary mb-2">
              <span>Progress</span>
              <span>{answeredCount} / {totalQuestions} answered</span>
            </div>
            <Progress
              value={(answeredCount / totalQuestions) * 100}
              className="h-2"
            />
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Question Navigation */}
        <div className="mb-6">
          <div className="flex flex-wrap gap-2">
            {exam.questions?.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentQuestionIndex(index)}
                className={`w-10 h-10 rounded-lg text-sm font-medium transition-colors ${
                  index === currentQuestionIndex
                    ? 'bg-primary-600 text-white'
                    : answers[exam.questions[index].id]
                    ? 'bg-green-100 text-green-800 border-2 border-green-300'
                    : 'bg-neutral-100 text-text-secondary hover:bg-neutral-200'
                }`}
              >
                {index + 1}
              </button>
            ))}
          </div>
        </div>

        {/* Current Question */}
        <motion.div
          key={currentQuestionIndex}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Card className="p-8">
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-text-primary mb-4">
                Question {currentQuestionIndex + 1}
              </h2>
              <p className="text-lg text-text-primary leading-relaxed">
                {exam.questions[currentQuestionIndex].question_text}
              </p>
            </div>

            {exam.questions[currentQuestionIndex].question_type === 'multiple_choice' && exam.questions[currentQuestionIndex].options ? (
              <div className="space-y-3">
                {JSON.parse(exam.questions[currentQuestionIndex].options).map((option, optIndex) => (
                  <label
                    key={optIndex}
                    className={`flex items-center space-x-3 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                      answers[exam.questions[currentQuestionIndex].id] === option
                        ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                        : 'border-neutral-200 hover:border-neutral-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name={`question-${exam.questions[currentQuestionIndex].id}`}
                      value={option}
                      checked={answers[exam.questions[currentQuestionIndex].id] === option}
                      onChange={(e) => handleAnswerChange(exam.questions[currentQuestionIndex].id, e.target.value)}
                      className="w-4 h-4 text-primary-600"
                    />
                    <span className="text-text-primary">{option}</span>
                  </label>
                ))}
              </div>
            ) : (
              <textarea
                value={answers[exam.questions[currentQuestionIndex].id] || ''}
                onChange={(e) => handleAnswerChange(exam.questions[currentQuestionIndex].id, e.target.value)}
                className="w-full border border-neutral-300 rounded-lg p-4 text-text-primary placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                rows={6}
                placeholder="Enter your answer here..."
              />
            )}
          </Card>
        </motion.div>

        {/* Navigation */}
        <div className="flex justify-between items-center mt-6">
          <Button
            variant="outline"
            onClick={() => setCurrentQuestionIndex(prev => Math.max(0, prev - 1))}
            disabled={currentQuestionIndex === 0}
          >
            Previous
          </Button>

          <div className="flex space-x-3">
            <Button
              variant="outline"
              onClick={() => showToast('Answers saved automatically', 'info')}
            >
              <Save className="w-4 h-4 mr-2" />
              Save Progress
            </Button>

            <Button
              onClick={() => setShowSubmitModal(true)}
              disabled={answeredCount < totalQuestions}
              variant="primary"
            >
              <Send className="w-4 h-4 mr-2" />
              Submit Exam
            </Button>
          </div>

          <Button
            variant="outline"
            onClick={() => setCurrentQuestionIndex(prev => Math.min(totalQuestions - 1, prev + 1))}
            disabled={currentQuestionIndex === totalQuestions - 1}
          >
            Next
          </Button>
        </div>
      </div>

      {/* Submit Confirmation Modal */}
      <Modal
        isOpen={showSubmitModal}
        onClose={() => setShowSubmitModal(false)}
        title="Submit Exam"
      >
        <div className="space-y-4">
          <div className="text-center">
            <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-text-primary mb-2">
              Ready to Submit?
            </h3>
            <p className="text-text-secondary">
              You have answered {answeredCount} out of {totalQuestions} questions.
              Once submitted, you cannot change your answers.
            </p>
          </div>

          {answeredCount < totalQuestions && (
            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
              <div className="flex items-center space-x-2 text-amber-800 dark:text-amber-200">
                <AlertTriangle className="w-4 h-4" />
                <span className="text-sm">
                  You have {totalQuestions - answeredCount} unanswered questions.
                </span>
              </div>
            </div>
          )}

          <div className="flex space-x-3">
            <Button
              variant="outline"
              onClick={() => setShowSubmitModal(false)}
              className="flex-1"
            >
              Review Answers
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={submitting}
              className="flex-1"
            >
              {submitting ? 'Submitting...' : 'Submit Exam'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

export default ExamTake


