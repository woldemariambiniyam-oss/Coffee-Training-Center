import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Menu,
  X,
  Home,
  Calendar,
  Users,
  FileText,
  Award,
  BarChart3,
  Settings,
  LogOut,
  Moon,
  Sun,
  Coffee
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import { Button } from './ui'

const Navbar = () => {
  const { user, logout } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const navigate = useNavigate()
  const location = useLocation()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const navigationItems = [
    { path: '/dashboard', label: 'Dashboard', icon: Home, roles: ['admin', 'trainer', 'trainee'] },
    { path: '/sessions', label: 'Sessions', icon: Calendar, roles: ['admin', 'trainer', 'trainee'] },
    { path: '/queue', label: 'Queue', icon: Users, roles: ['admin', 'trainer', 'trainee'] },
    { path: '/exams', label: 'Exams', icon: FileText, roles: ['admin', 'trainer', 'trainee'] },
    { path: '/certificates', label: 'Certificates', icon: Award, roles: ['admin', 'trainer', 'trainee'] },
    { path: '/reports', label: 'Reports', icon: BarChart3, roles: ['admin', 'trainer'] },
    { path: '/users', label: 'User Management', icon: Settings, roles: ['admin'] },
  ]

  const filteredNavItems = navigationItems.filter(item =>
    user && item.roles.includes(user.role)
  )

  const isActivePath = (path) => location.pathname === path

  return (
    <nav className="sticky top-0 z-40 bg-white dark:bg-neutral-800 border-b border-neutral-200 dark:border-neutral-700 shadow-soft">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/dashboard" className="flex items-center space-x-2">
            <motion.div
              whileHover={{ rotate: 10 }}
              className="p-2 bg-gradient-coffee rounded-lg"
            >
              <Coffee className="w-6 h-6 text-white" />
            </motion.div>
            <span className="text-xl font-display font-bold text-primary-700 dark:text-primary-300">
              CTC
            </span>
          </Link>

          {/* Desktop Navigation */}
          {user && (
            <>
              <div className="hidden md:flex items-center space-x-1">
                {filteredNavItems.map((item) => {
                  const Icon = item.icon
                  const isActive = isActivePath(item.path)

                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                        isActive
                          ? 'bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-primary-300'
                          : 'text-neutral-600 hover:text-primary-600 hover:bg-neutral-50 dark:text-neutral-300 dark:hover:text-primary-300 dark:hover:bg-neutral-700'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{item.label}</span>
                    </Link>
                  )
                })}
              </div>

              {/* User Actions */}
              <div className="flex items-center space-x-3">
                {/* Theme Toggle */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={toggleTheme}
                  className="p-2"
                  aria-label="Toggle theme"
                >
                  {theme === 'light' ? (
                    <Moon className="w-4 h-4" />
                  ) : (
                    <Sun className="w-4 h-4" />
                  )}
                </Button>

                {/* User Info */}
                <div className="hidden sm:flex items-center space-x-2 text-sm">
                  <span className="text-text-secondary">Welcome,</span>
                  <span className="font-medium text-text-primary">{user.firstName}</span>
                </div>

                {/* Logout Button */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleLogout}
                  className="hidden sm:flex"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Logout
                </Button>

                {/* Mobile Menu Toggle */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                  className="md:hidden p-2"
                  aria-label="Toggle mobile menu"
                >
                  {isMobileMenuOpen ? (
                    <X className="w-5 h-5" />
                  ) : (
                    <Menu className="w-5 h-5" />
                  )}
                </Button>
              </div>
            </>
          )}
        </div>

        {/* Mobile Navigation Menu */}
        <AnimatePresence>
          {isMobileMenuOpen && user && (
            <motion.div
              className="md:hidden border-t border-neutral-200 dark:border-neutral-700"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
            >
              <div className="py-4 space-y-2">
                {filteredNavItems.map((item) => {
                  const Icon = item.icon
                  const isActive = isActivePath(item.path)

                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={`flex items-center space-x-3 px-3 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                        isActive
                          ? 'bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-primary-300'
                          : 'text-neutral-600 hover:text-primary-600 hover:bg-neutral-50 dark:text-neutral-300 dark:hover:text-primary-300 dark:hover:bg-neutral-700'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      <span>{item.label}</span>
                    </Link>
                  )
                })}

                {/* Mobile User Info & Logout */}
                <div className="border-t border-neutral-200 dark:border-neutral-700 pt-4 mt-4">
                  <div className="flex items-center justify-between px-3 py-2">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-text-secondary">Welcome,</span>
                      <span className="text-sm font-medium text-text-primary">{user.firstName}</span>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        handleLogout()
                        setIsMobileMenuOpen(false)
                      }}
                    >
                      <LogOut className="w-4 h-4 mr-2" />
                      Logout
                    </Button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </nav>
  )
}

export default Navbar


