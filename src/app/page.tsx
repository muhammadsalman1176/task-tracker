'use client'

import { useState, useEffect, useRef } from 'react'
import { Mic, Calendar, List, Plus, Trash2, Edit2, Check, X, Square, Sparkles, FileText, FileSpreadsheet } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Calendar as CalendarComponent } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { format, parseISO } from 'date-fns'
import { toast } from 'sonner'

interface Task {
  id: string
  description: string
  date: string
  category: string
  createdAt: string
  updatedAt: string
}

const CATEGORIES = [
  'Work',
  'Personal',
  'Health',
  'Finance',
  'Shopping',
  'Learning',
  'Other'
]

export default function Home() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined)
  const [taskInput, setTaskInput] = useState('')
  const [taskDate, setTaskDate] = useState('')
  const [taskCategory, setTaskCategory] = useState('Work')
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [editDescription, setEditDescription] = useState('')
  const [isEnhancing, setIsEnhancing] = useState(false)
  const [isEditingEnhancing, setIsEditingEnhancing] = useState(false)
  const [showPreviewDialog, setShowPreviewDialog] = useState(false)
  const [previewEnhancedText, setPreviewEnhancedText] = useState('')
  const [previewIsForEdit, setPreviewIsForEdit] = useState(false)

  // Refs for recording
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const [mounted, setMounted] = useState(false)

  // Initialize dates on client side only
  useEffect(() => {
    ;(async () => {
      setMounted(true)
      setSelectedDate(new Date())
      setTaskDate(format(new Date(), 'yyyy-MM-dd'))
    })()
  }, [])

  // Fetch tasks
  const fetchTasks = async (date?: string) => {
    setLoading(true)
    try {
      const url = date
        ? `/api/tasks?date=${date}`
        : '/api/tasks'
      const response = await fetch(url)
      const data = await response.json()
      setTasks(data.tasks || [])
    } catch (error) {
      console.error('Error fetching tasks:', error)
      toast.error('Failed to fetch tasks')
    }
    setLoading(false)
  }

  // Initial fetch
  useEffect(() => {
    ;(async () => {
      if (mounted) {
        await fetchTasks()
      }
    })()
  }, [mounted])

  // Create task
  const createTask = async () => {
    if (!taskInput.trim()) {
      toast.error('Please enter a task description')
      return
    }

    try {
      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          description: taskInput,
          date: taskDate,
          category: taskCategory
        })
      })

      const data = await response.json()
      if (response.ok) {
        setTaskInput('')
        toast.success('Task created successfully')
        fetchTasks()
      } else {
        toast.error(data.error || 'Failed to create task')
      }
    } catch (error) {
      console.error('Error creating task:', error)
      toast.error('Failed to create task')
    }
  }

  // Update task
  const updateTask = async () => {
    if (!editingTask) return

    try {
      const response = await fetch(`/api/tasks/${editingTask.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          description: editDescription
        })
      })

      if (response.ok) {
        toast.success('Task updated successfully')
        setEditingTask(null)
        setEditDescription('')
        fetchTasks()
      } else {
        toast.error('Failed to update task')
      }
    } catch (error) {
      console.error('Error updating task:', error)
      toast.error('Failed to update task')
    }
  }

  // Delete task
  const deleteTask = async (id: string) => {
    try {
      const response = await fetch(`/api/tasks/${id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        toast.success('Task deleted successfully')
        fetchTasks()
      } else {
        toast.error('Failed to delete task')
      }
    } catch (error) {
      console.error('Error deleting task:', error)
      toast.error('Failed to delete task')
    }
  }

  // Handle date selection
  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      setSelectedDate(date)
      const dateStr = format(date, 'yyyy-MM-dd')
      fetchTasks(dateStr)
    }
  }

  // Handle voice recording
  const handleVoiceRecord = async () => {
    // If recording, stop it
    if (isRecording && mediaRecorderRef.current) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
      return
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream)
      const audioChunks: Blob[] = []

      mediaRecorder.ondataavailable = (event) => {
        audioChunks.push(event.data)
      }

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunks, { type: 'audio/webm' })
        const audioData = await blobToBase64(audioBlob)

        try {
          const response = await fetch('/api/transcribe', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ audioData })
          })

          const data = await response.json()
          if (response.ok && data.transcription) {
            setTaskInput(data.transcription)
            toast.success('Voice transcribed successfully')
          } else {
            toast.error('Failed to transcribe audio')
          }
        } catch (error) {
          console.error('Error transcribing:', error)
          toast.error('Failed to transcribe audio')
        }

        setIsRecording(false)
        stream.getTracks().forEach(track => track.stop())

        // Clear refs
        mediaRecorderRef.current = null
        streamRef.current = null
        audioChunksRef.current = []
      }

      // Store refs
      mediaRecorderRef.current = mediaRecorder
      streamRef.current = stream
      audioChunksRef.current = audioChunks

      mediaRecorder.start()
      setIsRecording(true)

      // Auto-stop after 30 seconds
      setTimeout(() => {
        if (mediaRecorder.state === 'recording') {
          mediaRecorder.stop()
        }
      }, 30000)
    } catch (error) {
      console.error('Error accessing microphone:', error)
      toast.error('Failed to access microphone')
      setIsRecording(false)
    }
  }

  const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onloadend = () => resolve(reader.result as string)
      reader.onerror = reject
      reader.readAsDataURL(blob)
    })
  }

  // Enhance task description
  const enhanceText = async (text: string, category: string, isForEdit: boolean = false) => {
    if (!text.trim()) {
      toast.error('Please enter some text to enhance')
      return
    }

    try {
      if (isForEdit) {
        setIsEditingEnhancing(true)
      } else {
        setIsEnhancing(true)
      }

      const response = await fetch('/api/enhance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, category })
      })

      const data = await response.json()

      if (response.ok && data.enhancedText) {
        // Show preview dialog instead of applying directly
        setPreviewEnhancedText(data.enhancedText)
        setPreviewIsForEdit(isForEdit)
        setShowPreviewDialog(true)
        toast.success('Enhancement ready! Review the preview.')
      } else {
        toast.error('Failed to enhance text')
      }
    } catch (error) {
      console.error('Error enhancing text:', error)
      toast.error('Failed to enhance text')
    } finally {
      setIsEnhancing(false)
      setIsEditingEnhancing(false)
    }
  }

  // Apply the enhanced text from preview
  const applyEnhancedText = () => {
    if (previewIsForEdit) {
      setEditDescription(previewEnhancedText)
    } else {
      setTaskInput(previewEnhancedText)
    }
    setShowPreviewDialog(false)
    toast.success('Enhanced text applied!')
  }

  // Cancel the preview
  const cancelPreview = () => {
    setShowPreviewDialog(false)
    setPreviewEnhancedText('')
  }

  // Group tasks by date for list view
  const groupTasksByDate = (tasks: Task[]) => {
    return tasks.reduce((groups, task) => {
      const date = task.date
      if (!groups[date]) {
        groups[date] = []
      }
      groups[date].push(task)
      return groups
    }, {} as Record<string, Task[]>)
  }

  const groupedTasks = groupTasksByDate(tasks)

  // Get tasks for selected date in calendar view
  const selectedDateTasks = selectedDate
    ? tasks.filter(task => task.date === format(selectedDate, 'yyyy-MM-dd'))
    : []

  // Prevent hydration mismatch by not rendering until mounted
  if (!mounted) {
    return (
      <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      <header className="border-b bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-primary text-primary-foreground p-2 rounded-lg">
                <Check className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                  Task Tracker
                </h1>
                <p className="text-sm text-muted-foreground">Organize your daily tasks</p>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-wrap justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={downloadPDF}
                disabled={isDownloadingPDF || tasks.length === 0}
                className="flex items-center gap-2"
              >
                <FileText className="h-4 w-4" />
                <span className="hidden sm:inline">{isDownloadingPDF ? 'Downloading...' : 'Export PDF'}</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={downloadExcel}
                disabled={isDownloadingExcel || tasks.length === 0}
                className="flex items-center gap-2"
              >
                <FileSpreadsheet className="h-4 w-4" />
                <span className="hidden sm:inline">{isDownloadingExcel ? 'Downloading...' : 'Export Excel'}</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-4 py-6">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Task Input Card */}
          <Card className="border-2 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5" />
                Add New Task
              </CardTitle>
              <CardDescription>
                Type or speak to add a new task
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                {/* Date Picker */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Date</label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start text-left font-normal">
                        <Calendar className="mr-2 h-4 w-4" />
                        {taskDate ? format(parseISO(taskDate), 'PPP') : <span>Pick a date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <CalendarComponent
                        mode="single"
                        selected={parseISO(taskDate)}
                        onSelect={(date) => date && setTaskDate(format(date, 'yyyy-MM-dd'))}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                {/* Category Selection */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Category</label>
                  <Select value={taskCategory} onValueChange={setTaskCategory}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Task Description with Voice Input and Enhance */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Task Description</label>
                <div className="flex gap-2">
                  <div className="flex-1 space-y-2">
                    <Textarea
                      placeholder="Enter your task description..."
                      value={taskInput}
                      onChange={(e) => setTaskInput(e.target.value)}
                      className="min-h-[100px] resize-none"
                    />
                    <div className="flex justify-end">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => enhanceText(taskInput, taskCategory)}
                        disabled={!taskInput.trim() || isEnhancing}
                        className="text-xs"
                      >
                        <Sparkles className="mr-2 h-3 w-3" />
                        {isEnhancing ? 'Enhancing...' : 'Enhance with AI'}
                      </Button>
                    </div>
                  </div>
                  <Button
                    size="icon"
                    variant={isRecording ? "destructive" : "outline"}
                    onClick={handleVoiceRecord}
                    className="aspect-square"
                  >
                    {isRecording ? (
                      <Square className="h-5 w-5 animate-pulse" />
                    ) : (
                      <Mic className="h-5 w-5" />
                    )}
                  </Button>
                </div>
                {isRecording && (
                  <p className="text-sm text-destructive animate-pulse">
                    Recording... Click to stop
                  </p>
                )}
              </div>

              <Button onClick={createTask} className="w-full" size="lg">
                <Plus className="mr-2 h-5 w-5" />
                Add Task
              </Button>
            </CardContent>
          </Card>

          {/* Task Views */}
          <Card className="border-2 shadow-lg">
            <CardContent className="p-6">
              <Tabs defaultValue="calendar" className="w-full">
                <TabsList className="grid w-full max-w-md grid-cols-2">
                  <TabsTrigger value="calendar" className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Calendar View
                  </TabsTrigger>
                  <TabsTrigger value="list" className="flex items-center gap-2">
                    <List className="h-4 w-4" />
                    List View
                  </TabsTrigger>
                </TabsList>

                {/* Calendar View */}
                <TabsContent value="calendar" className="space-y-6 mt-6">
                  <div className="grid gap-6 md:grid-cols-2">
                    {/* Calendar */}
                    <Card>
                      <CardHeader>
                        <CardTitle>Select Date</CardTitle>
                        <CardDescription>Click a date to view tasks</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <CalendarComponent
                          mode="single"
                          selected={selectedDate}
                          onSelect={handleDateSelect}
                          className="rounded-md border"
                        />
                      </CardContent>
                    </Card>

                    {/* Tasks for Selected Date */}
                    <Card>
                      <CardHeader>
                        <CardTitle>
                          Tasks for {selectedDate && format(selectedDate, 'PPP')}
                        </CardTitle>
                        <CardDescription>
                          {selectedDateTasks.length} task{selectedDateTasks.length !== 1 ? 's' : ''} found
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        {loading ? (
                          <div className="text-center py-8 text-muted-foreground">
                            Loading...
                          </div>
                        ) : selectedDateTasks.length === 0 ? (
                          <div className="text-center py-8 text-muted-foreground">
                            No tasks for this date
                          </div>
                        ) : (
                          <div className="space-y-3 max-h-96 overflow-y-auto">
                            {selectedDateTasks.map((task) => (
                              <TaskCard
                                key={task.id}
                                task={task}
                                onDelete={() => deleteTask(task.id)}
                                onEdit={() => {
                                  setEditingTask(task)
                                  setEditDescription(task.description)
                                }}
                                isEditing={editingTask?.id === task.id}
                                editDescription={editDescription}
                                onEditChange={setEditDescription}
                                onUpdate={updateTask}
                                onCancelEdit={() => {
                                  setEditingTask(null)
                                  setEditDescription('')
                                }}
                                onEnhance={() => enhanceText(editDescription, task.category, true)}
                                isEnhancing={isEditingEnhancing}
                              />
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>

                {/* List View */}
                <TabsContent value="list" className="mt-6">
                  {loading ? (
                    <div className="text-center py-8 text-muted-foreground">
                      Loading...
                    </div>
                  ) : Object.keys(groupedTasks).length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      No tasks yet. Add your first task above!
                    </div>
                  ) : (
                    <div className="space-y-6 max-h-[600px] overflow-y-auto">
                      {Object.entries(groupedTasks)
                        .sort(([a], [b]) => b.localeCompare(a))
                        .map(([date, dateTasks]) => (
                          <Card key={date}>
                            <CardHeader>
                              <CardTitle className="flex items-center justify-between">
                                <span>{format(parseISO(date), 'PPP')}</span>
                                <Badge variant="secondary">
                                  {dateTasks.length} task{dateTasks.length !== 1 ? 's' : ''}
                                </Badge>
                              </CardTitle>
                            </CardHeader>
                            <CardContent>
                              <div className="space-y-3">
                                {dateTasks.map((task) => (
                                  <TaskCard
                                    key={task.id}
                                    task={task}
                                    onDelete={() => deleteTask(task.id)}
                                    onEdit={() => {
                                      setEditingTask(task)
                                      setEditDescription(task.description)
                                    }}
                                    isEditing={editingTask?.id === task.id}
                                    editDescription={editDescription}
                                    onEditChange={setEditDescription}
                                    onUpdate={updateTask}
                                    onCancelEdit={() => {
                                      setEditingTask(null)
                                      setEditDescription('')
                                    }}
                                    onEnhance={() => enhanceText(editDescription, task.category, true)}
                                    isEnhancing={isEditingEnhancing}
                                  />
                                ))}
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </main>

      <footer className="border-t bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm mt-auto">
        <div className="container mx-auto px-4 py-4">
          <p className="text-center text-sm text-muted-foreground">
            Task Tracker - Organize your daily tasks efficiently
          </p>
        </div>
      </footer>

      {/* Enhancement Preview Dialog */}
      <Dialog open={showPreviewDialog} onOpenChange={setShowPreviewDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              AI-Enhanced Task Preview
            </DialogTitle>
            <DialogDescription>
              Review the AI-enhanced version of your task below. You can accept it, or cancel to keep your original text.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Enhanced Version</label>
              <div className="p-4 bg-muted/50 rounded-lg border">
                <pre className="whitespace-pre-wrap text-sm font-sans leading-relaxed">
                  {previewEnhancedText}
                </pre>
              </div>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={cancelPreview}>
              <X className="mr-2 h-4 w-4" />
              Keep Original
            </Button>
            <Button onClick={applyEnhancedText}>
              <Check className="mr-2 h-4 w-4" />
              Apply Enhanced Version
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// Task Card Component
interface TaskCardProps {
  task: Task
  onDelete: () => void
  onEdit: () => void
  isEditing: boolean
  editDescription: string
  onEditChange: (value: string) => void
  onUpdate: () => void
  onCancelEdit: () => void
  onEnhance: () => void
  isEnhancing: boolean
}

function TaskCard({
  task,
  onDelete,
  onEdit,
  isEditing,
  editDescription,
  onEditChange,
  onUpdate,
  onCancelEdit,
  onEnhance,
  isEnhancing
}: TaskCardProps) {
  return (
    <Card className="group hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        {isEditing ? (
          <div className="space-y-3">
            <Textarea
              value={editDescription}
              onChange={(e) => onEditChange(e.target.value)}
              className="min-h-[80px]"
              autoFocus
            />
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={onEnhance}
                disabled={!editDescription.trim() || isEnhancing}
                className="flex-1"
              >
                <Sparkles className="mr-2 h-3 w-3" />
                {isEnhancing ? 'Enhancing...' : 'Enhance'}
              </Button>
              <Button size="sm" onClick={onUpdate} className="flex-1">
                <Check className="mr-2 h-4 w-4" />
                Save
              </Button>
              <Button size="sm" variant="outline" onClick={onCancelEdit} className="flex-1">
                <X className="mr-2 h-4 w-4" />
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <p className="text-sm text-foreground leading-relaxed">{task.description}</p>
                <Badge variant="outline" className="mt-2 text-xs">
                  {task.category}
                </Badge>
              </div>
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button size="icon" variant="ghost" onClick={onEdit}>
                  <Edit2 className="h-4 w-4" />
                </Button>
                <Button size="icon" variant="ghost" onClick={onDelete}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
