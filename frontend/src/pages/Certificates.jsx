import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  Award,
  Calendar,
  Shield,
  ExternalLink,
  Download,
  QrCode,
  CheckCircle,
  XCircle,
  Clock,
  Trophy,
  FileText,
  Eye
} from 'lucide-react'
import api from '../services/api'
import moment from 'moment'
import { Card, Button, Modal, Progress } from '../components/ui'
import { showToast } from '../components/ui/ToastContainer'

const Certificates = () => {
  const [certificates, setCertificates] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedCertificate, setSelectedCertificate] = useState(null)
  const [showQRModal, setShowQRModal] = useState(false)

  useEffect(() => {
    fetchCertificates()
  }, [])

  const fetchCertificates = async () => {
    try {
      const response = await api.get('/certificates/my')
      setCertificates(response.data)
    } catch (error) {
      showToast('Failed to load certificates', 'error')
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'issued':
        return 'bg-green-100 text-green-800'
      case 'revoked':
        return 'bg-red-100 text-red-800'
      case 'expired':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-blue-100 text-blue-800'
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'issued':
        return <CheckCircle className="w-4 h-4" />
      case 'revoked':
        return <XCircle className="w-4 h-4" />
      case 'expired':
        return <Clock className="w-4 h-4" />
      default:
        return <Shield className="w-4 h-4" />
    }
  }

  const handleDownload = async (certificate) => {
    try {
      // Assuming there's a download endpoint
      const response = await api.get(`/certificates/${certificate.id}/download`, {
        responseType: 'blob'
      })
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `certificate-${certificate.certificate_number}.pdf`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      showToast('Certificate downloaded successfully', 'success')
    } catch (error) {
      showToast('Failed to download certificate', 'error')
    }
  }

  const handleVerify = (certificateNumber) => {
    window.open(`/verify/${certificateNumber}`, '_blank')
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
            <Award className="w-8 h-8 mr-3 text-primary-600" />
            My Certificates
          </h1>
          <p className="text-text-secondary mt-1">
            View and manage your earned certificates
          </p>
        </div>
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
          className="bg-gradient-coffee text-white px-4 py-2 rounded-full text-sm font-medium"
        >
          {certificates.length} Certificates
        </motion.div>
      </motion.div>

      {certificates.length === 0 ? (
        <Card className="p-12 text-center">
          <Trophy className="w-16 h-16 text-neutral-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-text-primary mb-2">
            No Certificates Yet
          </h3>
          <p className="text-text-secondary mb-6">
            Complete sessions and exams to earn your certificates
          </p>
          <Button onClick={() => window.location.href = '/sessions'}>
            Browse Sessions
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {certificates.map((cert, index) => (
            <motion.div
              key={cert.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * index }}
            >
              <Card className="p-6 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-display font-bold text-text-primary mb-2 line-clamp-2">
                      {cert.session_title}
                    </h3>
                    <div className="flex items-center space-x-2 mb-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center space-x-1 ${getStatusColor(cert.status)}`}>
                        {getStatusIcon(cert.status)}
                        <span className="capitalize">{cert.status}</span>
                      </span>
                    </div>
                  </div>
                  <Award className="w-8 h-8 text-primary-600 flex-shrink-0" />
                </div>

                <div className="space-y-3 mb-6">
                  <div className="flex items-center text-sm text-text-secondary">
                    <FileText className="w-4 h-4 mr-2 text-primary-600" />
                    {cert.certificate_number}
                  </div>
                  <div className="flex items-center text-sm text-text-secondary">
                    <Calendar className="w-4 h-4 mr-2 text-primary-600" />
                    Issued: {moment(cert.issue_date).format('MMM DD, YYYY')}
                  </div>
                  {cert.expiry_date && (
                    <div className="flex items-center text-sm text-text-secondary">
                      <Clock className="w-4 h-4 mr-2 text-primary-600" />
                      Expires: {moment(cert.expiry_date).format('MMM DD, YYYY')}
                    </div>
                  )}
                </div>

                {cert.qr_code_url && (
                  <div className="mb-4 p-4 bg-neutral-50 dark:bg-neutral-800 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-text-secondary">QR Code</span>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setSelectedCertificate(cert)
                          setShowQRModal(true)
                        }}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                    </div>
                    <img
                      src={cert.qr_code_url}
                      alt="QR Code"
                      className="w-20 h-20 mx-auto rounded"
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <Button
                    onClick={() => handleVerify(cert.certificate_number)}
                    variant="outline"
                    className="w-full"
                  >
                    <Shield className="w-4 h-4 mr-2" />
                    Verify Online
                  </Button>
                  <Button
                    onClick={() => handleDownload(cert)}
                    className="w-full"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download PDF
                  </Button>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {/* QR Code Modal */}
      <Modal
        isOpen={showQRModal}
        onClose={() => setShowQRModal(false)}
        title="Certificate QR Code"
      >
        {selectedCertificate && (
          <div className="space-y-4">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-text-primary mb-2">
                {selectedCertificate.session_title}
              </h3>
              <p className="text-sm text-text-secondary mb-4">
                Certificate #{selectedCertificate.certificate_number}
              </p>
            </div>

            <div className="flex justify-center">
              <div className="p-4 bg-white rounded-lg border-2 border-neutral-200">
                <img
                  src={selectedCertificate.qr_code_url}
                  alt="QR Code"
                  className="w-48 h-48"
                />
              </div>
            </div>

            <div className="text-center text-sm text-text-secondary">
              Scan this QR code to verify the certificate authenticity
            </div>

            <div className="flex space-x-3">
              <Button
                onClick={() => handleVerify(selectedCertificate.certificate_number)}
                className="flex-1"
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Open Verification Page
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowQRModal(false)}
                className="flex-1"
              >
                Close
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}

export default Certificates


