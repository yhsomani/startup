import React from 'react'
import { CourseCard } from './CourseCard'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'



import { Course } from '../types/course'

interface CourseCatalogProps {
  courses: Course[]
  onEnroll: (courseId: string) => void
}

export const CourseCatalog: React.FC<CourseCatalogProps> = ({ courses, onEnroll }) => {
  const [searchTerm, setSearchTerm] = React.useState('')
  const [selectedCategory, setSelectedCategory] = React.useState('all')
  const [selectedLevel, setSelectedLevel] = React.useState('all')

  const categories = ['all', 'programming', 'data-science', 'design', 'business', 'math']
  const levels = ['all', 'beginner', 'intermediate', 'advanced']

  const filteredCourses = courses.filter(course => {
    const matchesSearch = course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      course.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === 'all' || course.category === selectedCategory
    const matchesLevel = selectedLevel === 'all' || course.level === selectedLevel

    return matchesSearch && matchesCategory && matchesLevel
  })

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="flex-1">
          <div className="relative">
            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400">🔍</span>
            <Input
              type="text"
              placeholder="Search courses..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <Select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="w-full md:w-48"
        >
          {categories.map(category => (
            <option key={category} value={category}>
              {category.charAt(0).toUpperCase() + category.slice(1)}
            </option>
          ))}
        </Select>

        <Select
          value={selectedLevel}
          onChange={(e) => setSelectedLevel(e.target.value)}
          className="w-full md:w-48"
        >
          {levels.map(level => (
            <option key={level} value={level}>
              {level.charAt(0).toUpperCase() + level.slice(1)}
            </option>
          ))}
        </Select>
      </div>

      <div className="flex items-center gap-2">
        <span>Filter:</span>
        <span className="text-gray-500">
          {filteredCourses.length} of {courses.length} courses
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredCourses.map(course => (
          <CourseCard
            key={course.id}
            course={course}
            onClick={onEnroll}
          />
        ))}
      </div>

      {filteredCourses.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">No courses found matching your criteria.</p>
          <p className="text-gray-400">Try adjusting your search or filters.</p>
        </div>
      )}
    </div>
  )
}
