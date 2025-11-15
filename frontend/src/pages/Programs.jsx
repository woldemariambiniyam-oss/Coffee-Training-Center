import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  BookOpen,
  Plus,
  Edit,
  Trash2,
  Calendar,
  Users,
  Clock,
  Search,
  Filter,
  Coffee
} from 'lucide-react'
import api from '../services/api'
import { Card, Button, Input, Modal, Table } from '../components/ui'
import { showToast } from '../components/ui/ToastContainer'

const Programs = () => {
  const [programs, setPrograms] = useState([])
  const [filteredPrograms, setFilteredPrograms] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [activeFilter, setActiveFilter] = useState('all')
  const [showModal, setShowModal] = useState(false)
  const [editingProgram, setEditingProgram] = useState(null)
  const [categories, setCategories] = useState([])

  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    category: 'coffee_processing',
    durationDays: 1,
    isActive: true
  })

  useEffect(() => {
    fetchPrograms()
    fetchCategories()
  }, [])

  useEffect(() => {
    filterPrograms()
  }, [programs, searchTerm, categoryFilter, activeFilter])

  const fetchPrograms = async () => {
    try {
      const response = await api.get('/programs')
      setPrograms(response.data)
    } catch (error) {
      showToast('Failed to fetch programs', 'error')
    } finally {
      setLoading(false)
    }
  }

  const fetchCategories = async () => {
    try {
      const response = await api.get('/programs/meta/categories')
      setCategories(response.data)
    } catch (error) {
      console.error('Failed to fetch categories')
    }
  }

  const filterPrograms = () => {
    let filtered = programs

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(program =>
        program.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        program.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        program.description.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Category filter
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(program => program.category === categoryFilter)
    }

    // Active filter
    if (activeFilter !== 'all') {
      const isActive = activeFilter === 'active'
      filtered = filtered.filter(program => program.is_active === isActive)
    }

    setFilteredPrograms(filtered)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    try {
      if (editingProgram) {
        await api.put(`/programs/${editingProgram.id}`, formData)
        showToast('Program updated successfully', 'success')
      } else {
        await api.post('/programs', formData)
        showToast('Program created successfully', 'success')
      }

      fetchPrograms()
      setShowModal(false)
      resetForm()
    } catch (error) {
      showToast(error.response?.data?.error || 'Operation failed', 'error')
    }
  }

  const handleEdit = (program) => {
    setEditingProgram(program)
    setFormData({
      name: program.name,
      code: program.code,
      description: program.description || '',
      category: program.category,
      durationDays: program.duration_days,
      isActive: program.is_active
    })
    setShowModal(true)
  }

  const handleDelete = async (programId) => {
    if (!confirm('Are you sure you want to delete this program?')) return

    try {
      await api.delete(`/programs/${programId}`)
      showToast('Program deleted successfully', 'success')
      fetchPrograms()
    } catch (error) {
      showToast(error.response?.data?.error || 'Delete failed', 'error')
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      code: '',
      description: '',
      category: 'coffee_processing',
      durationDays: 1,
      isActive: true
    })
    setEditingProgram(null)
  }

  const getCategoryLabel = (category) => {
    const cat = categories.find(c => c.value === category)
    return cat ? cat.label : category
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
            <BookOpen className="w-8 h-8 mr-3 text-primary-600" />
            Training Programs
          </h1>
          <p className="text-text-secondary mt-1">
            Manage training programs and their sessions
          </p>
        </div>
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
          className="bg-gradient-coffee text-white px-4 py-2 rounded-full text-sm font-medium"
        >
          {filteredPrograms.length} Programs
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
            placeholder="Search programs..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            icon={<Search className="w-4 h-4" />}
          />
        </div>
        <div className="flex gap-2">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            <option value="all">All Categories</option>
            {categories.map(category => (
              <option key={category.value} value={category.value}>
                {category.label}
              </option>
            ))}
          </select>
          <select
            value={activeFilter}
            onChange={(e) => setActiveFilter(e.target.value)}
            className="px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
          <Button
            onClick={() => setShowModal(true)}
            className="flex items-center"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Program
          </Button>
        </div>
      </motion.div>

      {/* Programs Grid */}
      {filteredPrograms.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center py-12"
        >
          <BookOpen className="w-16 h-16 text-neutral-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-text-primary mb-2">
            {searchTerm || categoryFilter !== 'all' || activeFilter !== 'all'
              ? 'No programs match your filters'
              : 'No training programs yet'
            }
          </h3>
          <p className="text-text-secondary">
            {searchTerm || categoryFilter !== 'all' || activeFilter !== 'all'
              ? 'Try adjusting your search or filter criteria'
              : 'Create your first training program to get started'
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
          {filteredPrograms.map((program, index) => (
            <motion.div
              key={program.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * index }}
            >
              <Card className="p-6 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-xl font-display font-bold text-text-primary mb-2 line-clamp-2">
                      {program.name}
                    </h3>
                    <p className="text-sm text-primary-600 font-medium mb-2">
                      {program.code}
                    </p>
                    <p className="text-text-secondary text-sm line-clamp-3 mb-4">
                      {program.description}
                    </p>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    program.is_active
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {program.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>

                <div className="space-y-3 mb-6">
                  <div className="flex items-center text-sm text-text-secondary">
                    <Coffee className="w-4 h-4 mr-2 text-primary-600" />
                    {getCategoryLabel(program.category)}
                  </div>
                  <div className="flex items-center text-sm text-text-secondary">
                    <Clock className="w-4 h-4 mr-2 text-primary-600" />
                    {program.duration_days} days
                  </div>
                  <div className="flex items-center text-sm text-text-secondary">
                    <Calendar className="w-4 h-4 mr-2 text-primary-600" />
                    {program.session_count} sessions
                  </div>
                  <div className="flex items-center text-sm text-text-secondary">
                    <Users className="w-4 h-4 mr-2 text-primary-600" />
                    {program.enrolled_trainees} trainees
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={() => handleEdit(program)}
                    variant="secondary"
                    size="sm"
                    className="flex-1"
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Edit
                  </Button>
                  <Button
                    onClick={() => handleDelete(program.id)}
                    variant="danger"
                    size="sm"
                    className="flex-1"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete
                  </Button>
                </div>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false)
          resetForm()
        }}
        title={editingProgram ? 'Edit Program' : 'Create Program'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                Program Name *
              </label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                Program Code *
              </label>
              <Input
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                Category *
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                required
              >
                {categories.map(category => (
                  <option key={category.value} value={category.value}>
                    {category.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                Duration (Days) *
              </label>
              <Input
                type="number"
                min="1"
                value={formData.durationDays}
                onChange={(e) => setFormData({ ...formData, durationDays: parseInt(e.target.value) })}
                required
              />
            </div>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="isActive"
              checked={formData.isActive}
              onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              className="mr-2"
            />
            <label htmlFor="isActive" className="text-sm text-text-primary">
              Active Program
            </label>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setShowModal(false)
                resetForm()
              }}
            >
              Cancel
            </Button>
            <Button type="submit">
              {editingProgram ? 'Update' : 'Create'} Program
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

export default Programs
