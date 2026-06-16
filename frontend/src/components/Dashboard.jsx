import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  getAllTasks, 
  createTask, 
  updateTask, 
  deleteTask, 
  markImportant,
  getOverdueTasks,
  getImportantTasks 
} from '../services/api';
import {   
  LogOut, 
  Plus, 
  Star, 
  CheckCircle, 
  Circle,
  Trash2,
  Edit2,
  Calendar,
  User,
  LayoutDashboard,
  Award,
  Clock,
  Sparkles,
  Search,
  ArrowUpDown,
  ChevronDown,
  X,
  Download,
  Sun,
  Moon,
  Activity,
  Zap,
  TrendingUp,
  Flame
} from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

const Dashboard = ({ onLogout, darkMode, setDarkMode }) => {
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [darkMode]);

  const [tasks, setTasks] = useState([]);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [formData, setFormData] = useState({ 
    title: '', 
    description: '', 
    due_date: '', 
    is_important: false 
  });
  const [user, setUser] = useState(null);
  const [showProfile, setShowProfile] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [greeting, setGreeting] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  const [selectedTasks, setSelectedTasks] = useState([]);
  const [undoStack, setUndoStack] = useState([]);
  const [activityLog, setActivityLog] = useState([]);
  const [showActivity, setShowActivity] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const [showConfetti, setShowConfetti] = useState(false);
  const [streak, setStreak] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    const savedFilter = localStorage.getItem('taskFilter');
    const savedSearch = localStorage.getItem('taskSearch');
    if (savedFilter) setFilter(savedFilter);
    if (savedSearch) setSearch(savedSearch);
  }, []);

  useEffect(() => {
    localStorage.setItem('taskFilter', filter);
  }, [filter]);

  useEffect(() => {
    const pending = tasks.filter(t => !t.completed).length;
    setPendingCount(pending);
    
    if (pending > 0) {
      document.title = `(${pending}) TaskFlow Pro`;
    } else {
      document.title = 'TaskFlow Pro';
    }
  }, [tasks]);

  useEffect(() => {
    const today = new Date().toDateString();
    const completedToday = tasks.filter(t => 
      t.completed && new Date(t.updated_at || t.created_at).toDateString() === today
    ).length;
    
    if (completedToday > 0) {
      const savedStreak = localStorage.getItem('taskStreak');
      const lastDate = localStorage.getItem('lastTaskDate');
      const todayStr = new Date().toDateString();
      
      if (lastDate === todayStr) {
        setStreak(parseInt(savedStreak) || 1);
      } else {
        const newStreak = (parseInt(savedStreak) || 0) + 1;
        setStreak(newStreak);
        localStorage.setItem('taskStreak', newStreak);
        localStorage.setItem('lastTaskDate', todayStr);
      }
    }
  }, [tasks]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
        e.preventDefault();
        setShowAddModal(true);
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
        e.preventDefault();
        document.getElementById('search-input')?.focus();
      }
      if (e.key === 'Escape') {
        setShowAddModal(false);
        setEditingTask(null);
        setShowProfile(false);
        setShowSortDropdown(false);
        setShowActivity(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Good Morning');
    else if (hour < 17) setGreeting('Good Afternoon');
    else setGreeting('Good Evening');
  }, []);

  const addActivity = (action, taskTitle) => {
    const newEntry = {
      id: Date.now(),
      action,
      taskTitle,
      timestamp: new Date().toLocaleString(),
      time: new Date().toLocaleTimeString()
    };
    setActivityLog(prev => [newEntry, ...prev].slice(0, 50));
  };

  const clearActivityLog = () => {
    if (activityLog.length === 0) {
      toast('No activities to clear');
      return;
    }
    if (window.confirm('Clear all activity logs?')) {
      setActivityLog([]);
      toast.success('Activity log cleared');
    }
  };

  const fetchTasks = async () => {
    setLoading(true);
    try {
      let response;
      if (filter === 'overdue') {
        response = await getOverdueTasks();
      } else if (filter === 'important') {
        response = await getImportantTasks();
      } else {
        response = await getAllTasks();
      }
      setTasks(response.data || []);
      const pending = response.data?.filter(t => !t.completed).length || 0;
      setPendingCount(pending);
      
      if (pending > 0) {
        document.title = `(${pending}) TaskFlow Pro`;
      } else {
        document.title = 'TaskFlow Pro';
      }
    } catch (err) {
      if (err.response?.status === 401) {
        onLogout();
        navigate('/login');
      }
      toast.error('Failed to load tasks');
      console.error('Error fetching tasks:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserProfile = () => {
    try {
      const userData = localStorage.getItem('user_data');
      if (userData) {
        const parsedUser = JSON.parse(userData);
        setUser({
          name: parsedUser.name || 'User',
          email: parsedUser.email || 'user@example.com',
        });
      } else {
        setUser({
          name: 'User',
          email: 'user@example.com',
        });
      }
    } catch (err) {
      console.error('Error loading profile:', err);
      setUser({
        name: 'User',
        email: 'user@example.com',
      });
    }
  };

  useEffect(() => {
    fetchTasks();
    fetchUserProfile();
  }, [filter]);

  const debouncedSearch = useCallback(
    debounce((value) => {
      setSearch(value);
      localStorage.setItem('taskSearch', value);
    }, 300),
    []
  );

  const handleSearchChange = (e) => {
    debouncedSearch(e.target.value);
  };

  const getSortedTasks = useMemo(() => {
    const sorted = [...tasks];
    switch (sortBy) {
      case 'newest':
        return sorted.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      case 'oldest':
        return sorted.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
      case 'dueDate':
        return sorted.sort((a, b) => {
          if (!a.due_date) return 1;
          if (!b.due_date) return -1;
          return new Date(a.due_date) - new Date(b.due_date);
        });
      case 'priority':
        return sorted.sort((a, b) => (b.is_important ? 1 : 0) - (a.is_important ? 1 : 0));
      case 'alphabetical':
        return sorted.sort((a, b) => a.title.localeCompare(b.title));
      default:
        return sorted;
    }
  }, [tasks, sortBy]);

  const validateTaskData = (data) => {
    if (!data.title?.trim()) {
      return 'Title is required';
    }
    if (data.title.length > 255) {
      return 'Title must be less than 255 characters';
    }
    if (data.description && data.description.length > 500) {
      return 'Description must be less than 500 characters';
    }
    return null;
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    const validationError = validateTaskData(formData);
    if (validationError) {
      toast.error(validationError);
      return;
    }
    try {
      const taskData = {
        title: formData.title.trim(),
        description: formData.description.trim() || null,
        due_date: formData.due_date || null,
        is_important: formData.is_important || false,
      };
      const response = await createTask(taskData);
      setTasks([response.data, ...tasks]);
      addActivity('created', response.data.title);
      setShowAddModal(false);
      setFormData({ title: '', description: '', due_date: '', is_important: false });
      toast.success('Task created successfully! 🎉');
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to create task');
    }
  };

  const handleUpdateTask = async (e) => {
    e.preventDefault();
    const validationError = validateTaskData(formData);
    if (validationError) {
      toast.error(validationError);
      return;
    }
    try {
      const taskData = {
        title: formData.title.trim(),
        description: formData.description.trim() || null,
        due_date: formData.due_date || null,
        is_important: formData.is_important || false,
      };
      const response = await updateTask(editingTask.id, taskData);
      setTasks(tasks.map(task => task.id === editingTask.id ? response.data : task));
      addActivity('updated', response.data.title);
      setEditingTask(null);
      setFormData({ title: '', description: '', due_date: '', is_important: false });
      toast.success('Task updated successfully!');
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to update task');
    }
  };

  const handleToggleComplete = async (task) => {
    try {
      const updatedTasks = tasks.map(t => 
        t.id === task.id ? { ...t, completed: !t.completed } : t
      );
      setTasks(updatedTasks);
      
      const updateData = {
        title: task.title,
        description: task.description || null,
        due_date: task.due_date || null,
        is_important: task.is_important || false,
        completed: !task.completed  
      };
      
      await updateTask(task.id, updateData);
      
      const action = task.completed ? 'marked as incomplete' : 'completed';
      addActivity(action, task.title);
      
      if (!task.completed) {
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 3000);
        toast.success('🎉 Task completed! Keep up the great work!');
      } else {
        toast.success('Task marked as incomplete');
      }
    } catch (err) {
      console.error('Error toggling task completion:', err);
      setTasks(tasks);
      toast.error('Failed to update task status');
    }
  };

  const handleToggleImportant = async (taskId) => {
    try {
      const task = tasks.find(t => t.id === taskId);
      const updatedTasks = tasks.map(t => 
        t.id === taskId 
          ? { ...t, is_important: !t.is_important }
          : t
      );
      setTasks(updatedTasks);
      await markImportant(taskId);
      const action = task?.is_important ? 'removed from important' : 'marked as important';
      addActivity(action, task?.title || '');
      toast.success(task?.is_important ? 'Removed from important' : 'Marked as important ⭐');
    } catch (err) {
      console.error('Error toggling importance:', err);
      await fetchTasks();
      toast.error('Failed to update importance');
    }
  };

  const handleDeleteTask = async (taskId) => {
    const taskToDelete = tasks.find(t => t.id === taskId);
    try {
      await deleteTask(taskId);
      setTasks(tasks.filter(task => task.id !== taskId));
      addActivity('deleted', taskToDelete?.title || '');
      setUndoStack(prev => [...prev, { type: 'delete', task: taskToDelete }]);
      toast.success(
        (t) => (
          <div className="flex items-center gap-3">
            <span>Task deleted</span>
            <button
              onClick={() => handleUndo(t)}
              className="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition"
            >
              Undo
            </button>
          </div>
        ),
        { duration: 4000 }
      );
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to delete task');
    }
  };

  const handleUndo = (toastId) => {
    const lastAction = undoStack[undoStack.length - 1];
    if (lastAction && lastAction.type === 'delete') {
      setTasks(prev => [lastAction.task, ...prev]);
      addActivity('restored', lastAction.task?.title || '');
      setUndoStack(prev => prev.slice(0, -1));
      toast.dismiss(toastId);
      toast.success('Task restored!');
    }
  };

  const handleSelectTask = (taskId) => {
    setSelectedTasks(prev => 
      prev.includes(taskId) 
        ? prev.filter(id => id !== taskId)
        : [...prev, taskId]
    );
  };

  const handleSelectAll = () => {
    if (selectedTasks.length === filteredTasks.length && filteredTasks.length > 0) {
      setSelectedTasks([]);
    } else {
      setSelectedTasks(filteredTasks.map(t => t.id));
    }
  };

  const handleBulkDelete = async () => {
    if (!window.confirm(`Delete ${selectedTasks.length} tasks?`)) return;
    try {
      await Promise.all(selectedTasks.map(id => deleteTask(id)));
      const deletedTasks = tasks.filter(t => selectedTasks.includes(t.id));
      deletedTasks.forEach(t => addActivity('deleted', t.title));
      setTasks(tasks.filter(task => !selectedTasks.includes(task.id)));
      setSelectedTasks([]);
      toast.success(`${selectedTasks.length} tasks deleted`);
    } catch (err) {
      toast.error('Failed to delete tasks');
    }
  };

  const handleBulkComplete = async () => {
    try {
      const tasksToComplete = tasks.filter(t => selectedTasks.includes(t.id));
      await Promise.all(tasksToComplete.map(task => {
        const updateData = {
          title: task.title,
          description: task.description || null,
          due_date: task.due_date || null,
          is_important: task.is_important || false,
          completed: true
        };
        return updateTask(task.id, updateData);
      }));
      tasksToComplete.forEach(t => addActivity('completed', t.title));
      setTasks(tasks.map(task => 
        selectedTasks.includes(task.id) ? { ...task, completed: true } : task
      ));
      setSelectedTasks([]);
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 3000);
      toast.success(`${selectedTasks.length} tasks completed! 🎉`);
    } catch (err) {
      toast.error('Failed to complete tasks');
    }
  };

  const handleExportCSV = () => {
    const headers = ['Title', 'Description', 'Status', 'Important', 'Due Date', 'Created At'];
    const csvData = tasks.map(task => [
      task.title,
      task.description || '',
      task.completed ? 'Completed' : 'Pending',
      task.is_important ? 'Yes' : 'No',
      task.due_date ? new Date(task.due_date).toLocaleDateString() : '',
      new Date(task.created_at).toLocaleDateString()
    ]);
    
    const csv = [headers, ...csvData].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tasks-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Tasks exported successfully!');
  };

  const stats = {
    total: tasks.length,
    completed: tasks.filter(t => t.completed).length,
    pending: tasks.filter(t => !t.completed).length,
    important: tasks.filter(t => t.is_important).length,
    completionRate: tasks.length > 0 ? Math.round((tasks.filter(t => t.completed).length / tasks.length) * 100) : 0,
  };

  let filteredTasks = getSortedTasks;
  if (search) {
    filteredTasks = filteredTasks.filter(task =>
      task.title.toLowerCase().includes(search.toLowerCase()) ||
      task.description?.toLowerCase().includes(search.toLowerCase())
    );
  }

  const getDueDateColor = (dueDate) => {
    if (!dueDate) return '';
    const now = new Date();
    const due = new Date(dueDate);
    const diffDays = Math.ceil((due - now) / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return 'text-red-500 bg-red-50 dark:bg-red-900/30';
    if (diffDays === 0) return 'text-orange-500 bg-orange-50 dark:bg-orange-900/30';
    if (diffDays <= 3) return 'text-yellow-500 bg-yellow-50 dark:bg-yellow-900/30';
    if (diffDays <= 7) return 'text-blue-500 bg-blue-50 dark:bg-blue-900/30';
    return 'text-green-500 bg-green-50 dark:bg-green-900/30';
  };

  const getDueDateLabel = (dueDate) => {
    if (!dueDate) return '';
    const now = new Date();
    const due = new Date(dueDate);
    const diffDays = Math.ceil((due - now) / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return 'Overdue';
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Tomorrow';
    if (diffDays <= 3) return `${diffDays} days left`;
    if (diffDays <= 7) return 'This week';
    return 'Upcoming';
  };

  function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  const TaskSkeleton = () => (
    <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-100 dark:border-gray-700">
      <div className="flex items-start gap-4">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 rounded animate-pulse"></div>
          <div className="w-6 h-6 bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 rounded-full animate-pulse"></div>
        </div>
        <div className="flex-1">
          <div className="h-5 bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 rounded w-3/4 mb-2 animate-pulse"></div>
          <div className="h-3 bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 rounded w-1/2 animate-pulse"></div>
        </div>
        <div className="flex gap-1">
          <div className="w-8 h-8 bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 rounded-xl animate-pulse"></div>
          <div className="w-8 h-8 bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 rounded-xl animate-pulse"></div>
          <div className="w-8 h-8 bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 rounded-xl animate-pulse"></div>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="h-16 bg-white dark:bg-gray-800 rounded-2xl mb-8 animate-pulse"></div>
          <div className="h-32 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl mb-8 animate-pulse"></div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {[1,2,3,4].map(i => (
              <div key={i} className="h-24 bg-white dark:bg-gray-800 rounded-2xl animate-pulse"></div>
            ))}
          </div>
          <div className="space-y-3">
            {[1,2,3,4,5].map(i => <TaskSkeleton key={i} />)}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
      {showConfetti && (
        <div className="fixed inset-0 pointer-events-none z-50">
          <div className="absolute inset-0 overflow-hidden">
            {[...Array(50)].map((_, i) => (
              <div
                key={i}
                className="absolute animate-confetti"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `-10%`,
                  width: `${Math.random() * 10 + 5}px`,
                  height: `${Math.random() * 10 + 5}px`,
                  backgroundColor: ['#ff6b6b', '#feca57', '#48dbfb', '#1dd1a1', '#5f27cd', '#ff9ff3'][Math.floor(Math.random() * 6)],
                  animationDuration: `${Math.random() * 2 + 2}s`,
                  animationDelay: `${Math.random() * 2}s`,
                  transform: `rotate(${Math.random() * 360}deg)`,
                  borderRadius: Math.random() > 0.5 ? '50%' : '2px',
                }}
              />
            ))}
          </div>
        </div>
      )}

      <Toaster 
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: darkMode ? '#1f2937' : '#fff',
            color: darkMode ? '#f3f4f6' : '#333',
            boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
            borderRadius: '12px',
            padding: '16px',
          },
          success: {
            iconTheme: {
              primary: '#22c55e',
              secondary: darkMode ? '#1f2937' : '#fff',
            },
          },
          error: {
            iconTheme: {
              primary: '#ef4444',
              secondary: darkMode ? '#1f2937' : '#fff',
            },
          },
        }}
      />

      <nav className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200/50 dark:border-gray-700/50 sticky top-0 z-50 shadow-sm transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="absolute inset-0 bg-blue-600 rounded-xl blur-md opacity-30 animate-pulse"></div>
                <div className="relative w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                  <CheckCircle className="w-5 h-5 text-white" />
                </div>
              </div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  TaskFlow Pro
                </h1>
                <p className="text-xs text-gray-500 dark:text-gray-400 hidden sm:block">Manage your tasks efficiently</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              {streak > 0 && (
                <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 bg-orange-50 dark:bg-orange-900/30 rounded-full border border-orange-200 dark:border-orange-800/30">
                  <Flame className="w-3.5 h-3.5 text-orange-500" />
                  <span className="text-xs font-medium text-orange-700 dark:text-orange-300">
                    {streak} day{streak > 1 ? 's' : ''} streak
                  </span>
                </div>
              )}

              <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-blue-50 dark:bg-blue-900/30 rounded-full border border-blue-100 dark:border-blue-800/30">
                <Zap className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                <span className="text-xs font-medium text-blue-700 dark:text-blue-300">
                  {pendingCount} pending
                </span>
              </div>

              <button
                onClick={() => setDarkMode(!darkMode)}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                aria-label="Toggle dark mode"
              >
                {darkMode ? (
                  <Sun className="w-4 h-4 text-yellow-500" />
                ) : (
                  <Moon className="w-4 h-4 text-gray-600" />
                )}
              </button>

              <button
                onClick={() => setShowActivity(!showActivity)}
                className="relative p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition"
              >
                <Activity className="w-4 h-4 text-gray-600 dark:text-gray-300" />
                {activityLog.length > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span>
                )}
              </button>

              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition"
              >
                {mobileMenuOpen ? (
                  <X className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                ) : (
                  <svg className="w-5 h-5 text-gray-600 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                )}
              </button>

              <div className="hidden lg:flex items-center gap-3">
                <div className="px-3 py-1.5 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30 rounded-full text-sm text-gray-700 dark:text-gray-300 flex items-center gap-2">
                  <Sparkles className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                  <span>{greeting}, {user?.name || 'User'}!</span>
                </div>
                
                <button
                  onClick={() => setShowProfile(!showProfile)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition group"
                >
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-full flex items-center justify-center shadow-md group-hover:shadow-lg transition">
                    <User className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300 hidden sm:inline">
                    {user?.name || 'User'}
                  </span>
                </button>
                
                <button 
                  onClick={onLogout} 
                  className="flex items-center gap-2 px-4 py-1.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="hidden sm:inline">Logout</span>
                </button>
              </div>
            </div>
          </div>

          {mobileMenuOpen && (
            <div className="lg:hidden py-4 border-t border-gray-100 dark:border-gray-700">
              <div className="flex flex-col gap-3">
                <div className="px-3 py-2 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30 rounded-lg text-sm text-gray-700 dark:text-gray-300 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <span>{greeting}, {user?.name || 'User'}!</span>
                </div>
                {streak > 0 && (
                  <div className="flex items-center gap-2 px-3 py-2 text-sm text-orange-600 dark:text-orange-400">
                    <Flame className="w-4 h-4" />
                    <span>{streak} day streak 🔥</span>
                  </div>
                )}
                <div className="flex items-center gap-3 px-3 py-2 text-sm text-gray-600 dark:text-gray-400">
                  <Zap className="w-4 h-4 text-blue-600" />
                  <span>{pendingCount} pending tasks</span>
                </div>
                <button
                  onClick={() => {
                    setShowProfile(!showProfile);
                    setMobileMenuOpen(false);
                  }}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                >
                  <User className="w-4 h-4" />
                  <span>Profile</span>
                </button>
                <button
                  onClick={() => {
                    setShowActivity(!showActivity);
                    setMobileMenuOpen(false);
                  }}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                >
                  <Activity className="w-4 h-4" />
                  <span>Activity Log</span>
                </button>
                <button
                  onClick={() => setDarkMode(!darkMode)}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                >
                  {darkMode ? <Sun className="w-4 h-4 text-yellow-500" /> : <Moon className="w-4 h-4" />}
                  <span>{darkMode ? 'Light Mode' : 'Dark Mode'}</span>
                </button>
                <button
                  onClick={onLogout}
                  className="flex items-center gap-2 px-3 py-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Logout</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </nav>

      {showProfile && user && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setShowProfile(false)} />
          <motion.div 
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed right-4 top-20 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-700 p-6 w-80 z-50 transition-colors duration-300"
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-2xl flex items-center justify-center shadow-lg">
                <User className="w-7 h-7 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-gray-900 dark:text-white text-lg truncate">{user.name}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{user.email}</p>
              </div>
            </div>
            
            {streak > 0 && (
              <div className="flex items-center gap-2 px-3 py-2 bg-orange-50 dark:bg-orange-900/30 rounded-xl mb-3 border border-orange-200 dark:border-orange-800/30">
                <Flame className="w-4 h-4 text-orange-500" />
                <span className="text-sm font-medium text-orange-700 dark:text-orange-300">
                  {streak} day{streak > 1 ? 's' : ''} streak! 🔥
                </span>
              </div>
            )}

            <div className="grid grid-cols-3 gap-2 py-3 border-y border-gray-100 dark:border-gray-700 mb-3">
              <div className="text-center">
                <p className="text-lg font-bold text-gray-900 dark:text-white">{stats.total}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Tasks</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold text-green-600">{stats.completed}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Done</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold text-blue-600">{stats.completionRate}%</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Rate</p>
              </div>
            </div>
            <button
              onClick={() => {
                setShowProfile(false);
                onLogout();
              }}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-xl transition font-medium"
            >
              <LogOut className="w-4 h-4" />
              <span>Logout</span>
            </button>
          </motion.div>
        </>
      )}

      {showActivity && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setShowActivity(false)} />
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed right-4 top-20 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-700 p-4 w-96 z-50 max-h-96 overflow-y-auto transition-colors duration-300"
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-gray-900 dark:text-white text-sm">Activity Log</h3>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-400">{activityLog.length} entries</span>
                {activityLog.length > 0 && (
                  <button
                    onClick={clearActivityLog}
                    className="text-xs text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 px-2 py-1 rounded-lg transition flex items-center gap-1"
                  >
                    <Trash2 className="w-3 h-3" />
                    Clear All
                  </button>
                )}
              </div>
            </div>
            {activityLog.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-8">No activity yet</p>
            ) : (
              <div className="space-y-2">
                {activityLog.map((entry) => (
                  <div key={entry.id} className="flex items-start gap-2 p-2 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-lg transition">
                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-1.5 flex-shrink-0"></div>
                    <div>
                      <p className="text-sm text-gray-700 dark:text-gray-300">
                        <span className="font-medium">{entry.action}</span>
                        {entry.taskTitle && (
                          <span className="text-gray-500 dark:text-gray-400"> "{entry.taskTitle}"</span>
                        )}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">{entry.timestamp}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        </>
      )}

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="mb-8 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2"></div>
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-2">
              <Award className="w-6 h-6" />
              <h2 className="text-xl font-bold">{greeting}, {user?.name || 'User'}!</h2>
            </div>
            <div className="flex flex-wrap items-center gap-4 text-blue-100 text-sm">
              <span>
                You have <span className="font-semibold text-white">{pendingCount}</span> pending tasks
              </span>
              {stats.completionRate > 50 && (
                <span className="flex items-center gap-1">
                  <TrendingUp className="w-4 h-4" />
                  {stats.completionRate}% completion rate 🎉
                </span>
              )}
              {streak > 0 && (
                <span className="flex items-center gap-1">
                  <Flame className="w-4 h-4" />
                  {streak} day streak 🔥
                </span>
              )}
            </div>
            <div className="mt-3 max-w-xs">
              <div className="h-1.5 bg-white/20 rounded-full overflow-hidden">
                <motion.div 
                  className="h-full bg-white rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${stats.completionRate}%` }}
                  transition={{ duration: 0.7, delay: 0.3 }}
                />
              </div>
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Total Tasks', value: stats.total, icon: LayoutDashboard, color: 'from-blue-500 to-blue-600' },
            { label: 'Completed', value: stats.completed, icon: CheckCircle, color: 'from-green-500 to-emerald-600' },
            { label: 'Pending', value: pendingCount, icon: Clock, color: 'from-yellow-500 to-orange-500' },
            { label: 'Important', value: stats.important, icon: Star, color: 'from-red-500 to-pink-600' },
          ].map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 p-5 border border-gray-100 dark:border-gray-700 group cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">{stat.label}</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{stat.value}</p>
                </div>
                <div className={`w-12 h-12 bg-gradient-to-br ${stat.color} rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition`}>
                  <stat.icon className="w-6 h-6 text-white" />
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {selectedTasks.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-blue-100 dark:border-blue-900/30 p-4 mb-4 flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {selectedTasks.length} task{selectedTasks.length > 1 ? 's' : ''} selected
              </span>
              <button
                onClick={() => setSelectedTasks([])}
                className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition"
              >
                Clear
              </button>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleBulkComplete}
                className="px-3 py-1.5 text-xs bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
              >
                Complete All
              </button>
              <button
                onClick={handleBulkDelete}
                className="px-3 py-1.5 text-xs bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
              >
                Delete All
              </button>
            </div>
          </motion.div>
        )}

        <div className="flex flex-wrap gap-3 mb-6">
          <div className="flex-1 relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="w-4 h-4 text-gray-400" />
            </div>
            <input
              id="search-input"
              type="text"
              placeholder="Search tasks... (Ctrl+F)"
              className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm dark:text-white transition-colors"
              defaultValue={search}
              onChange={handleSearchChange}
            />
          </div>
          
          <div className="flex gap-2 flex-wrap">
            {['all', 'important', 'overdue'].map((f) => {
              const count = f === 'all' ? stats.total : f === 'important' ? stats.important : tasks.filter(t => t.due_date && new Date(t.due_date) < new Date() && !t.completed).length;
              return (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-4 py-2.5 rounded-xl capitalize transition-all font-medium text-sm flex items-center gap-1.5 ${
                    filter === f
                      ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/25'
                      : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700'
                  }`}
                >
                  {f === 'all' ? 'All Tasks' : f}
                  {count > 0 && (
                    <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                      filter === f ? 'bg-white/20 text-white' : 'bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-300'
                    }`}>
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
            
            <div className="relative">
              <button
                onClick={() => setShowSortDropdown(!showSortDropdown)}
                className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition text-sm font-medium text-gray-600 dark:text-gray-300"
              >
                <ArrowUpDown className="w-4 h-4" />
                <span className="hidden sm:inline">Sort</span>
                <ChevronDown className="w-3 h-3" />
              </button>
              
              {showSortDropdown && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowSortDropdown(false)} />
                  <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 py-1 z-50">
                    {['newest', 'oldest', 'dueDate', 'priority', 'alphabetical'].map((option) => (
                      <button
                        key={option}
                        onClick={() => {
                          setSortBy(option);
                          setShowSortDropdown(false);
                        }}
                        className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition ${
                          sortBy === option ? 'text-blue-600 font-medium bg-blue-50 dark:bg-blue-900/30' : 'text-gray-700 dark:text-gray-300'
                        }`}
                      >
                        {option === 'newest' && 'Newest First'}
                        {option === 'oldest' && 'Oldest First'}
                        {option === 'dueDate' && 'Due Date'}
                        {option === 'priority' && 'Priority'}
                        {option === 'alphabetical' && 'A-Z'}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            <button
              onClick={handleExportCSV}
              className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition text-sm font-medium text-gray-600 dark:text-gray-300"
              title="Export tasks as CSV"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Export</span>
            </button>

            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:shadow-lg hover:shadow-blue-500/30 transition-all font-medium"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Add Task</span>
              <span className="sm:hidden">Add</span>
            </button>
          </div>
        </div>

        <AnimatePresence>
          <div className="space-y-3">
            {filteredTasks.length > 0 && (
              <div className="flex items-center justify-between px-4 py-2.5 bg-white/60 dark:bg-gray-800/60 rounded-xl border border-gray-100/50 dark:border-gray-700/50 backdrop-blur-sm">
                <span className="text-xs text-gray-400 font-medium">
                  {filteredTasks.length} task{filteredTasks.length > 1 ? 's' : ''}
                </span>
                <button
                  onClick={handleSelectAll}
                  className="flex items-center gap-2 text-xs text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 transition font-medium group"
                >
                  <div className={`w-4 h-4 rounded border-2 flex items-center justify-center transition ${
                    selectedTasks.length === filteredTasks.length && filteredTasks.length > 0
                      ? 'bg-blue-600 border-blue-600'
                      : 'border-gray-300 dark:border-gray-600 group-hover:border-blue-400'
                  }`}>
                    {selectedTasks.length === filteredTasks.length && filteredTasks.length > 0 && (
                      <CheckCircle className="w-3 h-3 text-white" />
                    )}
                  </div>
                  {selectedTasks.length === filteredTasks.length && filteredTasks.length > 0 
                    ? 'Deselect All' 
                    : 'Select All'}
                </button>
              </div>
            )}

            {filteredTasks.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
                className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-16 text-center border border-gray-100 dark:border-gray-700"
              >
                <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Sparkles className="w-10 h-10 text-blue-600 dark:text-blue-400" />
                </div>
                <p className="text-gray-500 dark:text-gray-400 text-lg font-medium">No tasks yet</p>
                <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">Click "Add Task" to create your first task</p>
                <button
                  onClick={() => setShowAddModal(true)}
                  className="mt-4 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:shadow-lg transition-all text-sm font-medium"
                >
                  Create your first task →
                </button>
              </motion.div>
            ) : (
              <AnimatePresence>
                {filteredTasks.map((task) => (
                  <motion.div
                    key={task.id}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -50 }}
                    transition={{ duration: 0.2 }}
                    className={`group bg-white dark:bg-gray-800 rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 p-5 border border-gray-100 dark:border-gray-700 ${
                      task.completed ? 'opacity-75' : ''
                    } ${selectedTasks.includes(task.id) ? 'ring-2 ring-blue-500 bg-blue-50/30 dark:bg-blue-900/20' : ''}`}
                  >
                    <div className="flex items-start gap-4">
                      <button
                        onClick={() => handleSelectTask(task.id)}
                        className={`mt-1 w-5 h-5 rounded border-2 flex items-center justify-center transition-all duration-200 flex-shrink-0 ${
                          selectedTasks.includes(task.id)
                            ? 'bg-blue-600 border-blue-600 shadow-sm shadow-blue-200'
                            : 'border-gray-300 dark:border-gray-600 hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20'
                        }`}
                      >
                        {selectedTasks.includes(task.id) && (
                          <CheckCircle className="w-3.5 h-3.5 text-white" />
                        )}
                      </button>
                      
                      <button 
                        onClick={() => handleToggleComplete(task)} 
                        className="mt-0.5 hover:scale-110 transition flex-shrink-0"
                      >
                        {task.completed ? (
                          <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center shadow-md shadow-green-500/30">
                            <CheckCircle className="w-4 h-4 text-white" />
                          </div>
                        ) : (
                          <Circle className="w-6 h-6 text-gray-300 dark:text-gray-600 hover:text-blue-500 transition" />
                        )}
                      </button>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className={`font-semibold ${task.completed ? 'line-through text-gray-400 dark:text-gray-500' : 'text-gray-900 dark:text-white'}`}>
                            {task.title}
                          </h3>
                          {task.is_important && (
                            <span className="inline-flex items-center gap-1 text-xs px-2.5 py-0.5 bg-gradient-to-r from-red-100 to-pink-100 dark:from-red-900/30 dark:to-pink-900/30 text-red-600 dark:text-red-400 rounded-full font-medium">
                              <Star className="w-3 h-3 fill-red-500" />
                              Important
                            </span>
                          )}
                          {task.due_date && (
                            <span className={`inline-flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-full font-medium ${getDueDateColor(task.due_date)}`}>
                              <Calendar className="w-3 h-3" />
                              {getDueDateLabel(task.due_date)}
                            </span>
                          )}
                          {task.due_date && new Date(task.due_date) < new Date() && !task.completed && (
                            <span className="inline-flex items-center gap-1 text-xs px-2.5 py-0.5 bg-gradient-to-r from-red-100 to-red-200 dark:from-red-900/30 dark:to-red-800/30 text-red-600 dark:text-red-400 rounded-full font-medium animate-pulse">
                              <Clock className="w-3 h-3" />
                              Overdue
                            </span>
                          )}
                        </div>
                        {task.description && (
                          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">{task.description}</p>
                        )}
                        {task.due_date && (
                          <div className="flex items-center gap-1.5 mt-2 text-xs text-gray-400 dark:text-gray-500">
                            <Calendar className="w-3.5 h-3.5" />
                            <span>{new Date(task.due_date).toLocaleDateString('en-US', { 
                              weekday: 'short', 
                              month: 'short', 
                              day: 'numeric',
                              year: 'numeric'
                            })}</span>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all duration-300">
                        <button
                          onClick={() => handleToggleImportant(task.id)}
                          className={`p-2 rounded-xl transition ${
                            task.is_important 
                              ? 'text-yellow-500 bg-yellow-50 dark:bg-yellow-900/30' 
                              : 'text-gray-400 dark:text-gray-500 hover:text-yellow-500 hover:bg-yellow-50 dark:hover:bg-yellow-900/30'
                          }`}
                        >
                          <Star className={`w-4 h-4 ${task.is_important ? 'fill-yellow-500' : ''}`} />
                        </button>
                        <button
                          onClick={() => {
                            setEditingTask(task);
                            setFormData({
                              title: task.title,
                              description: task.description || '',
                              due_date: task.due_date ? task.due_date.slice(0, 16) : '',
                              is_important: task.is_important || false,
                            });
                          }}
                          className="p-2 rounded-xl text-gray-400 dark:text-gray-500 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteTask(task.id)}
                          className="p-2 rounded-xl text-gray-400 dark:text-gray-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 transition"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            )}
          </div>
        </AnimatePresence>
      </main>

      {(showAddModal || editingTask) && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4" style={{
          animation: 'fadeIn 0.2s ease-out'
        }}>
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.25 }}
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md p-6 transition-colors duration-300"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                {editingTask ? (
                  <Edit2 className="w-5 h-5 text-white" />
                ) : (
                  <Plus className="w-5 h-5 text-white" />
                )}
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  {editingTask ? 'Edit Task' : 'Create New Task'}
                </h2>
                <p className="text-xs text-gray-400">Press ESC to cancel</p>
              </div>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setEditingTask(null);
                  setFormData({ title: '', description: '', due_date: '', is_important: false });
                }}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>
            
            <form onSubmit={editingTask ? handleUpdateTask : handleCreateTask} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Task Title *</label>
                <input
                  type="text"
                  placeholder="Enter task title..."
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  required
                  autoFocus
                />
                <p className="text-xs text-gray-400 mt-1">Max 255 characters</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Description</label>
                <textarea
                  placeholder="Add a description (optional)..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none transition"
                  rows="3"
                  maxLength="500"
                />
                <p className="text-xs text-gray-400 mt-1">Max 500 characters</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Due Date</label>
                <input
                  type="datetime-local"
                  value={formData.due_date}
                  onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                />
              </div>
              
              <div className="flex gap-3 pt-3">
                <button 
                  type="submit" 
                  className="flex-1 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:shadow-lg hover:shadow-blue-500/30 transition-all font-medium"
                >
                  {editingTask ? 'Update Task' : 'Create Task'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setEditingTask(null);
                    setFormData({ title: '', description: '', due_date: '', is_important: false });
                  }}
                  className="flex-1 py-2.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition font-medium"
                >
                  Cancel
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      <style>{`
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-10px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes scaleIn {
          from {
            opacity: 0;
            transform: scale(0.9);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        @keyframes confetti-fall {
          0% {
            transform: translateY(-10vh) rotate(0deg) scale(1);
            opacity: 1;
          }
          100% {
            transform: translateY(110vh) rotate(720deg) scale(0.5);
            opacity: 0;
          }
        }

        .animate-confetti {
          animation: confetti-fall linear forwards;
        }
      `}</style>
    </div>
  );
};

export default Dashboard;