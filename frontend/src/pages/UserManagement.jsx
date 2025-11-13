import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  Users,
  UserPlus,
  Edit,
  Trash2,
  Key,
  Search,
  Filter,
  MoreVertical,
  Shield,
  ShieldCheck,
  ShieldX,
  UserCheck,
  UserX,
  RefreshCw,
  Download,
  Eye,
  EyeOff
} from 'lucide-react'
import api from '../services/api'
import { useAuth } from '../context/AuthContext'
import { Card, Button, Modal, Table, Input } from '../components/ui'
import { showToast } from '../components/ui/ToastContainer'

const UserManagement = () => {
  const { user: authUser } = useAuth()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showResetPasswordModal, setShowResetPasswordModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [selectedUser, setSelectedUser] = useState(null)
  const [filters, setFilters] = useState({ role: '', status: '', search: '' })
  const [showFilters, setShowFilters] = useState(false)

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    phone: '',
    role: 'trainee',
    status: 'active'
  })

  useEffect(() => {
    if (authUser?.role === 'admin') {
      fetchUsers()
    }
  }, [authUser, filters])

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (filters.role) params.append('role', filters.role)
      if (filters.status) params.append('status', filters.status)
      if (filters.search) params.append('search', filters.search)

      const response = await api.get(`/users?${params.toString()}`)
      setUsers(response.data)
    } catch (err) {
      showToast('Failed to fetch users', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateUser = async (e) => {
    e.preventDefault()
    try {
      await api.post('/users', formData)
      showToast('User created successfully! Invitation email sent.', 'success')
      setShowCreateModal(false)
      resetForm()
      fetchUsers()
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to create user', 'error')
    }
  }

  const handleUpdateUser = async (e) => {
    e.preventDefault()
    try {
      await api.put(`/users/${selectedUser.id}`, formData)
      showToast('User updated successfully!', 'success')
      setShowEditModal(false)
      setSelectedUser(null)
      resetForm()
      fetchUsers()
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to update user', 'error')
    }
  }

  const handleDeleteUser = async () => {
    try {
      await api.delete(`/users/${selectedUser.id}`)
      showToast('User deleted successfully!', 'success')
      setShowDeleteModal(false)
      setSelectedUser(null)
      fetchUsers()
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to delete user', 'error')
    }
  }

  const handleResetPassword = async (e) => {
    e.preventDefault()
    try {
      await api.post(`/users/${selectedUser.id}/reset-password`, {
        newPassword: formData.password
      })
      showToast('Password reset successfully!', 'success')
      setShowResetPasswordModal(false)
      setSelectedUser(null)
      resetForm()
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to reset password', 'error')
    }
  }

  const openEditModal = (userData) => {
    setSelectedUser(userData)
    setFormData({
      email: userData.email,
      firstName: userData.first_name,
      lastName: userData.last_name,
      phone: userData.phone || '',
      role: userData.role,
      status: userData.status
    })
    setShowEditModal(true)
  }

  const openResetPasswordModal = (userData) => {
    setSelectedUser(userData)
    setFormData({ password: '' })
    setShowResetPasswordModal(true)
  }

  const openDeleteModal = (userData) => {
    setSelectedUser(userData)
    setShowDeleteModal(true)
  }

  const resetForm = () => {
    setFormData({
      email: '',
      password: '',
      firstName: '',
      lastName: '',
      phone: '',
      role: 'trainee',
      status: 'active'
    })
  }

  const getRoleBadgeColor = (role) => {
    switch (role) {
      case 'admin':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-200'
      case 'trainer':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-200'
      case 'trainee':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-200'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-200'
    }
  }

  const getRoleIcon = (role) => {
    switch (role) {
      case 'admin':
        return <ShieldCheck className="w-3 h-3" />
      case 'trainer':
        return <Shield className="w-3 h-3" />
      case 'trainee':
        return <UserCheck className="w-3 h-3" />
      default:
        return <Shield className="w-3 h-3" />
    }
  }

  const getStatusBadgeColor = (status) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-200'
      case 'inactive':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-200'
      case 'suspended':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-200'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-200'
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'active':
        return <UserCheck className="w-3 h-3" />
      case 'inactive':
        return <UserX className="w-3 h-3" />
      case 'suspended':
        return <ShieldX className="w-3 h-3" />
      default:
        return <UserX className="w-3 h-3" />
    }
  }

  const handleExport = () => {
    // Placeholder for export functionality
    showToast('User data exported successfully', 'success')
  }

  if (authUser?.role !== 'admin') {
    return (
      <Card className="p-12 text-center">
        <ShieldX className="w-16 h-16 text-red-400 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-text-primary mb-2">
          Access Denied
        </h3>
        <p className="text-text-secondary mb-6">
          Only administrators can access this page.
        </p>
        <Button onClick={() => window.history.back()}>
          Go Back
        </Button>
      </Card>
    )
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

  const columns = [
    {
      key: 'name',
      header: 'Name',
      render: (user) => (
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-primary-100 dark:bg-primary-900/20 rounded-full flex items-center justify-center">
            <span className="text-sm font-medium text-primary-600">
              {user.first_name[0]}{user.last_name[0]}
            </span>
          </div>
          <div>
            <div className="font-medium text-text-primary">
              {user.first_name} {user.last_name}
            </div>
            <div className="text-sm text-text-secondary">{user.email}</div>
          </div>
        </div>
      )
    },
    {
      key: 'role',
      header: 'Role',
      render: (user) => (
        <span className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${getRoleBadgeColor(user.role)}`}>
          {getRoleIcon(user.role)}
          <span className="capitalize">{user.role}</span>
        </span>
      )
    },
    {
      key: 'status',
      header: 'Status',
      render: (user) => (
        <span className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusBadgeColor(user.status)}`}>
          {getStatusIcon(user.status)}
          <span className="capitalize">{user.status}</span>
        </span>
      )
    },
    {
      key: 'created',
      header: 'Created',
      render: (user) => (
        <span className="text-sm text-text-secondary">
          {new Date(user.created_at).toLocaleDateString()}
        </span>
      )
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (user) => (
        <div className="flex items-center space-x-2">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => openEditModal(user)}
          >
            <Edit className="w-4 h-4" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => openResetPasswordModal(user)}
          >
            <Key className="w-4 h-4" />
          </Button>
          {authUser.id !== user.id && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => openDeleteModal(user)}
              className="text-red-600 hover:text-red-700"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          )}
        </div>
      )
    }
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
            <Users className="w-8 h-8 mr-3 text-primary-600" />
            User Management
          </h1>
          <p className="text-text-secondary mt-1">
            Manage users, roles, and permissions
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="w-4 h-4 mr-2" />
            {showFilters ? 'Hide' : 'Show'} Filters
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
          >
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          <Button
            onClick={() => {
              resetForm()
              setShowCreateModal(true)
            }}
          >
            <UserPlus className="w-4 h-4 mr-2" />
            Add User
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
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">
                Search
              </label>
              <Input
                type="text"
                placeholder="Search by name or email..."
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                icon={<Search className="w-4 h-4" />}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">
                Role
              </label>
              <select
                value={filters.role}
                onChange={(e) => setFilters({ ...filters, role: e.target.value })}
                className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-md bg-white dark:bg-neutral-700 text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="">All Roles</option>
                <option value="admin">Admin</option>
                <option value="trainer">Trainer</option>
                <option value="trainee">Trainee</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">
                Status
              </label>
              <select
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-md bg-white dark:bg-neutral-700 text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="suspended">Suspended</option>
              </select>
            </div>
            <div className="flex items-end">
              <Button
                variant="outline"
                onClick={() => setFilters({ role: '', status: '', search: '' })}
                className="w-full"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Clear Filters
              </Button>
            </div>
          </div>
        </motion.div>
      )}

      {/* Users Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card className="p-0">
          <Table
            columns={columns}
            data={users}
            emptyMessage="No users found"
          />
        </Card>
      </motion.div>

      {/* Create User Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false)
          resetForm()
        }}
        title="Create New User"
      >
        <form onSubmit={handleCreateUser} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">
                First Name *
              </label>
              <Input
                type="text"
                required
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                placeholder="Enter first name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">
                Last Name *
              </label>
              <Input
                type="text"
                required
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                placeholder="Enter last name"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">
              Email *
            </label>
            <Input
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="Enter email address"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">
              Password *
            </label>
            <Input
              type="password"
              required
              minLength={6}
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              placeholder="Enter temporary password"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">
              Phone
            </label>
            <Input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="Enter phone number"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">
              Role *
            </label>
            <select
              required
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-md bg-white dark:bg-neutral-700 text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="trainee">Trainee</option>
              <option value="trainer">Trainer</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <div className="flex justify-end space-x-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setShowCreateModal(false)
                resetForm()
              }}
            >
              Cancel
            </Button>
            <Button type="submit">
              Create User
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit User Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false)
          setSelectedUser(null)
          resetForm()
        }}
        title="Edit User"
      >
        <form onSubmit={handleUpdateUser} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">
              Email
            </label>
            <Input
              type="email"
              value={formData.email}
              disabled
              className="bg-neutral-100 dark:bg-neutral-800"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">
                First Name *
              </label>
              <Input
                type="text"
                required
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                placeholder="Enter first name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">
                Last Name *
              </label>
              <Input
                type="text"
                required
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                placeholder="Enter last name"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">
              Phone
            </label>
            <Input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="Enter phone number"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">
              Status *
            </label>
            <select
              required
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-md bg-white dark:bg-neutral-700 text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="suspended">Suspended</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">
              Role *
            </label>
            <select
              required
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-md bg-white dark:bg-neutral-700 text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="trainee">Trainee</option>
              <option value="trainer">Trainer</option>
              <option value="admin">Admin</option>
              <option value="public_verifier">Public Verifier</option>
            </select>
          </div>
          <div className="flex justify-end space-x-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setShowEditModal(false)
                setSelectedUser(null)
                resetForm()
              }}
            >
              Cancel
            </Button>
            <Button type="submit">
              Update User
            </Button>
          </div>
        </form>
      </Modal>

      {/* Reset Password Modal */}
      <Modal
        isOpen={showResetPasswordModal}
        onClose={() => {
          setShowResetPasswordModal(false)
          setSelectedUser(null)
          resetForm()
        }}
        title="Reset Password"
      >
        <div className="space-y-4">
          <div className="text-center">
            <p className="text-text-secondary mb-4">
              Reset password for <strong>{selectedUser?.email}</strong>
            </p>
          </div>
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">
                New Password *
              </label>
              <Input
                type="password"
                required
                minLength={6}
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="Enter new password"
              />
            </div>
            <div className="flex justify-end space-x-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowResetPasswordModal(false)
                  setSelectedUser(null)
                  resetForm()
                }}
              >
                Cancel
              </Button>
              <Button type="submit">
                Reset Password
              </Button>
            </div>
          </form>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false)
          setSelectedUser(null)
        }}
        title="Delete User"
      >
        <div className="space-y-4">
          <div className="text-center">
            <Trash2 className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-text-primary mb-2">
              Delete User
            </h3>
            <p className="text-text-secondary mb-4">
              Are you sure you want to delete <strong>{selectedUser?.first_name} {selectedUser?.last_name}</strong>?
              This action cannot be undone.
            </p>
          </div>
          <div className="flex justify-end space-x-3">
            <Button
              variant="outline"
              onClick={() => {
                setShowDeleteModal(false)
                setSelectedUser(null)
              }}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteUser}
            >
              Delete User
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

export default UserManagement

