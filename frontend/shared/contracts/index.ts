/**
 * TalentSphere Frontend Contract Compliance
 * Ensures frontend rendering logic consistency with backend contracts
 */

import React from 'react';
import { z } from 'zod';
import { toast } from 'react-toastify';
import {
  ApiResponse,
  ApiError,
  User,
  Course,
  Challenge,
  Enrollment,
  CourseProgress,
  Submission,
  Notification,
  PaginationInfo
} from '@talentsphere/types';

// =============================================================================
// FRONTEND CONTRACT SCHEMAS (Zod)
// =============================================================================

/**
 * API Response schema
 */
const ApiResponseSchema = z.object({
  success: z.boolean(),
  data: z.any().optional(),
  error: z.object({
    code: z.string(),
    message: z.string(),
    details: z.record(z.any()).optional(),
    field: z.string().optional(),
    timestamp: z.string(),
    requestId: z.string()
  }).optional(),
  message: z.string().optional(),
  timestamp: z.string(),
  requestId: z.string(),
  pagination: z.object({
    page: z.number(),
    limit: z.number(),
    total: z.number(),
    totalPages: z.number(),
    hasNext: z.boolean(),
    hasPrev: z.boolean()
  }).optional()
});

/**
 * User schema
 */
const UserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  firstName: z.string().min(1).max(50),
  lastName: z.string().min(1).max(50),
  avatar: z.string().url().optional(),
  role: z.enum(['student', 'instructor', 'admin', 'super_admin']),
  isActive: z.boolean(),
  isVerified: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
  lastLoginAt: z.string().optional(),
  preferences: z.object({
    theme: z.enum(['light', 'dark', 'auto']),
    language: z.string(),
    timezone: z.string(),
    notifications: z.object({
      email: z.boolean(),
      push: z.boolean(),
      inApp: z.boolean(),
      marketing: z.boolean()
    })
  })
});

/**
 * Course schema
 */
const CourseSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1).max(255),
  description: z.string().min(10).max(10000),
  shortDescription: z.string().max(500).optional(),
  instructorId: z.string().uuid(),
  categoryId: z.string().uuid(),
  difficulty: z.enum(['beginner', 'intermediate', 'advanced', 'expert']),
  duration: z.number().min(1),
  price: z.number().min(0),
  currency: z.string(),
  status: z.enum(['draft', 'published', 'archived', 'under_review']),
  thumbnail: z.string().url().optional(),
  previewVideo: z.string().url().optional(),
  tags: z.array(z.string()).max(20),
  learningObjectives: z.array(z.string()).max(100),
  prerequisites: z.array(z.string()).max(50),
  enrollmentCount: z.number().min(0),
  rating: z.number().min(0).max(5),
  reviewCount: z.number().min(0),
  createdAt: z.string(),
  updatedAt: z.string(),
  isEnrolled: z.boolean().optional(),
  progress: z.object({
    completedModules: z.number(),
    totalModules: z.number(),
    completionPercentage: z.number()
  }).optional()
});

/**
 * Challenge schema
 */
const ChallengeSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1).max(255),
  description: z.string().min(10).max(5000),
  difficulty: z.enum(['easy', 'medium', 'hard', 'expert']),
  type: z.enum(['algorithm', 'data_structure', 'system_design', 'frontend', 'backend', 'full_stack']),
  categoryId: z.string().uuid(),
  tags: z.array(z.string()).max(10),
  timeLimit: z.number().min(1),
  memoryLimit: z.number().min(64),
  points: z.number().min(10),
  submissionCount: z.number().min(0),
  successRate: z.number().min(0).max(1),
  isPublished: z.boolean(),
  createdAt: z.string(),
  userSubmission: z.object({
    status: z.enum(['pending', 'running', 'success', 'failed', 'error', 'timeout', 'memory_limit_exceeded']),
    score: z.number().optional(),
    submittedAt: z.string().optional()
  }).optional()
});

// =============================================================================
// CONTRACT VALIDATION UTILITIES
// =============================================================================

/**
 * Type-safe API response validator
 */
function validateApiResponse<T>(response: unknown, dataSchema?: z.ZodType<T>): ApiResponse<T> {
  try {
    const validatedResponse = ApiResponseSchema.parse(response);
    
    if (validatedResponse.data && dataSchema) {
      validatedResponse.data = dataSchema.parse(validatedResponse.data);
    }
    
    return validatedResponse;
  } catch (error) {
    console.error('API Response validation failed:', error);
    throw new ContractValidationError('Invalid API response structure', error);
  }
}

/**
 * Validate API response with detailed error reporting
 */
function validateApiResponseWithDetails<T>(
  response: unknown,
  dataSchema?: z.ZodType<T>
): { isValid: boolean; data?: ApiResponse<T>; errors: string[] } {
  try {
    const validatedResponse = ApiResponseSchema.parse(response);
    let errors: string[] = [];
    
    if (validatedResponse.data && dataSchema) {
      try {
        validatedResponse.data = dataSchema.parse(validatedResponse.data);
      } catch (dataError) {
        errors = dataError instanceof z.ZodError 
          ? dataError.errors.map(e => `${e.path.join('.')}: ${e.message}`)
          : ['Data validation failed'];
      }
    }
    
    return {
      isValid: errors.length === 0,
      data: validatedResponse,
      errors
    };
  } catch (error) {
    return {
      isValid: false,
      errors: [error instanceof Error ? error.message : 'Response validation failed']
    };
  }
}

/**
 * Contract validation error
 */
class ContractValidationError extends Error {
  constructor(message: string, public cause?: unknown) {
    super(message);
    this.name = 'ContractValidationError';
  }
}

// =============================================================================
// CONTRACT-COMPLIANT API CLIENT
// =============================================================================

/**
 * Contract-compliant HTTP client
 */
class ContractApiClient {
  private baseUrl: string;
  private token: string | null = null;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  /**
   * Set authentication token
   */
  setToken(token: string): void {
    this.token = token;
  }

  /**
   * Make contract-compliant request
   */
  async request<T = any>(
    endpoint: string,
    options: RequestInit = {},
    dataSchema?: z.ZodType<T>
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}${endpoint}`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }

    const config: RequestInit = {
      ...options,
      headers,
    };

    try {
      const response = await fetch(url, config);
      const responseData = await response.json();

      // Validate response contract
      const validatedResponse = validateApiResponse(responseData, dataSchema);

      // Handle different response types
      if (!response.ok) {
        throw new ApiError(
          validatedResponse.error?.message || `HTTP ${response.status}`,
          validatedResponse.error?.code || 'HTTP_ERROR',
          response.status,
          validatedResponse.error?.details
        );
      }

      return validatedResponse;
    } catch (error) {
      console.error('Contract API Client Error:', error);
      throw error;
    }
  }

  /**
   * GET request
   */
  async get<T>(endpoint: string, dataSchema?: z.ZodType<T>): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'GET' }, dataSchema);
  }

  /**
   * POST request
   */
  async post<T, R = any>(endpoint: string, data?: T, dataSchema?: z.ZodType<R>): Promise<ApiResponse<R>> {
    return this.request<R>(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    }, dataSchema);
  }

  /**
   * PUT request
   */
  async put<T, R = any>(endpoint: string, data?: T, dataSchema?: z.ZodType<R>): Promise<ApiResponse<R>> {
    return this.request<R>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    }, dataSchema);
  }

  /**
   * DELETE request
   */
  async delete<T = any>(endpoint: string, dataSchema?: z.ZodType<T>): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'DELETE' }, dataSchema);
  }
}

/**
 * API Error class
 */
class ApiError extends Error {
  constructor(
    message: string,
    public code: string,
    public status: number,
    public details?: any
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// =============================================================================
// CONTRACT-COMPLIANT REACT HOOKS
// =============================================================================

/**
 * Contract-compliant data fetching hook
 */
function useContractQuery<T>(
  key: string,
  fetcher: () => Promise<ApiResponse<T>>,
  dataSchema?: z.ZodType<T>
) {
  const [data, setData] = React.useState<T | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const fetchData = React.useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetcher();
      const validation = validateApiResponseWithDetails(response, dataSchema);

      if (!validation.isValid) {
        setError(`Contract validation failed: ${validation.errors.join(', ')}`);
        toast.error('Data validation failed');
        return;
      }

      if (validation.data?.success) {
        setData(validation.data.data);
      } else {
        setError(validation.data?.error?.message || 'Request failed');
        toast.error(validation.data?.error?.message || 'Request failed');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [fetcher, dataSchema]);

  React.useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
}

/**
 * Contract-compliant mutation hook
 */
function useContractMutation<T, R = any>(
  mutationFn: (data: T) => Promise<ApiResponse<R>>,
  dataSchema?: z.ZodType<R>
) {
  const [data, setData] = React.useState<R | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const mutate = React.useCallback(async (input: T) => {
    setLoading(true);
    setError(null);

    try {
      const response = await mutationFn(input);
      const validation = validateApiResponseWithDetails(response, dataSchema);

      if (!validation.isValid) {
        setError(`Contract validation failed: ${validation.errors.join(', ')}`);
        toast.error('Response validation failed');
        return null;
      }

      if (validation.data?.success) {
        setData(validation.data.data);
        toast.success('Operation completed successfully');
        return validation.data.data;
      } else {
        setError(validation.data?.error?.message || 'Request failed');
        toast.error(validation.data?.error?.message || 'Request failed');
        return null;
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setError(errorMessage);
      toast.error(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, [mutationFn, dataSchema]);

  return { data, loading, error, mutate };
}

// =============================================================================
// CONTRACT-COMPLIANT COMPONENTS
// =============================================================================

/**
 * Contract-compliant error boundary
 */
interface ContractErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

interface ContractErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

class ContractErrorBoundary extends React.Component<
  ContractErrorBoundaryProps,
  ContractErrorBoundaryState
> {
  constructor(props: ContractErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ContractErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Contract Error Boundary caught an error:', error, errorInfo);
    
    // Log contract violations to monitoring service
    if (error instanceof ContractValidationError) {
      console.error('Contract Validation Error:', {
        message: error.message,
        cause: error.cause,
        errorInfo
      });
    }
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="contract-error-boundary">
          <h2>Something went wrong</h2>
          <p>
            {this.state.error instanceof ContractValidationError
              ? 'Contract validation failed. Please refresh the page.'
              : 'An unexpected error occurred.'}
          </p>
          <details>
            <summary>Error details</summary>
            <pre>{this.state.error?.message}</pre>
          </details>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Contract-compliant user profile component
 */
interface UserProfileProps {
  userId: string;
  onUpdate?: (user: User) => void;
}

const UserProfile: React.FC<UserProfileProps> = ({ userId, onUpdate }) => {
  const apiClient = React.useMemo(() => new ContractApiClient('/api/v1/auth'), []);

  const { data: user, loading, error } = useContractQuery(
    `user-profile-${userId}`,
    () => apiClient.get<User>(`/profile`),
    UserSchema
  );

  const updateUser = useContractMutation<Partial<User>, User>(
    (userData) => apiClient.put<User, User>(`/profile`, userData),
    UserSchema
  );

  const handleSubmit = async (formData: Partial<User>) => {
    const updatedUser = await updateUser.mutate(formData);
    if (updatedUser && onUpdate) {
      onUpdate(updatedUser);
    }
  };

  if (loading) return <div>Loading profile...</div>;
  if (error) return <div>Error loading profile: {error}</div>;
  if (!user) return <div>No user data available</div>;

  return (
    <div className="user-profile">
      <h1>{user.firstName} {user.lastName}</h1>
      <p>{user.email}</p>
      <p>Role: {user.role}</p>
      {/* Profile form with contract-compliant validation */}
    </div>
  );
};

/**
 * Contract-compliant course list component
 */
interface CourseListProps {
  categoryId?: string;
  difficulty?: string;
}

const CourseList: React.FC<CourseListProps> = ({ categoryId, difficulty }) => {
  const apiClient = React.useMemo(() => new ContractApiClient('/api/v1/courses'), []);

  const { data: response, loading, error } = useContractQuery(
    `courses-${categoryId}-${difficulty}`,
    () => apiClient.get<{ courses: Course[]; pagination: PaginationInfo }>(
      `?categoryId=${categoryId}&difficulty=${difficulty}`
    )
  );

  if (loading) return <div>Loading courses...</div>;
  if (error) return <div>Error loading courses: {error}</div>;
  if (!response?.data) return <div>No courses available</div>;

  const courses = response.data.courses || [];
  const pagination = response.data.pagination;

  return (
    <div className="course-list">
      <h2>Courses ({pagination?.total || 0})</h2>
      <div className="courses-grid">
        {courses.map((course) => (
          <div key={course.id} className="course-card">
            <h3>{course.title}</h3>
            <p>{course.shortDescription}</p>
            <p>Difficulty: {course.difficulty}</p>
            <p>Price: ${course.price} {course.currency}</p>
            <p>Rating: {course.rating} ({course.reviewCount} reviews)</p>
          </div>
        ))}
      </div>
      {/* Pagination component with contract compliance */}
    </div>
  );
};

// =============================================================================
// CONTRACT MONITORING
// =============================================================================

/**
 * Contract compliance monitor
 */
class ContractMonitor {
  private violations: Array<{
    type: string;
    message: string;
    timestamp: string;
    component: string;
  }> = [];

  recordViolation(type: string, message: string, component: string): void {
    this.violations.push({
      type,
      message,
      component,
      timestamp: new Date().toISOString()
    });

    console.error('Contract Violation:', {
      type,
      message,
      component,
      timestamp: new Date().toISOString()
    });
  }

  getViolations(): typeof this.violations {
    return [...this.violations];
  }

  clearViolations(): void {
    this.violations = [];
  }

  getComplianceRate(): number {
    // Implementation would track total requests vs violations
    return 0.95; // Placeholder
  }
}

// Global monitor instance
const contractMonitor = new ContractMonitor();

// =============================================================================
// EXPORTS
// =============================================================================

export {
  // Schemas
  ApiResponseSchema,
  UserSchema,
  CourseSchema,
  ChallengeSchema,
  
  // Validation
  validateApiResponse,
  validateApiResponseWithDetails,
  ContractValidationError,
  
  // API Client
  ContractApiClient,
  ApiError,
  
  // Hooks
  useContractQuery,
  useContractMutation,
  
  // Components
  ContractErrorBoundary,
  UserProfile,
  CourseList,
  
  // Monitoring
  ContractMonitor,
  contractMonitor
};