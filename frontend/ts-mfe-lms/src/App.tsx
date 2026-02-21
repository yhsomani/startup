import React from 'react'
import { CourseCatalog } from './components/CourseCatalog'
import { useCourses } from '@talentsphere/state'

const App: React.FC = () => {
  const { courses, loading, error, enrollCourse } = useCourses()

  const handleEnroll = async (courseId: string) => {
    try {
      await enrollCourse(courseId)
    } catch (error) {
      console.error('Failed to enroll in course:', error)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-900"></div>
          <p className="mt-4 text-gray-600">Loading courses...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 text-lg">Error loading courses</p>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            TalentSphere Learning Management
          </h1>
          <p className="text-gray-600">
            Discover and enroll in courses from expert instructors
          </p>
        </header>
        
        <main>
          <CourseCatalog
            courses={courses}
            onEnroll={handleEnroll}
          />
        </main>
      </div>
    </div>
  )
}

export default App