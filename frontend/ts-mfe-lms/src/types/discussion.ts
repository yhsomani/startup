export interface DiscussionDTO {
  id: string;
  title: string;
  content: string;
  courseId: string;
  courseTitle: string;
  authorId: string;
  authorName: string;
  authorAvatar: string;
  authorRole: string;
  type: DiscussionType;
  isPinned: boolean;
  isLocked: boolean;
  isResolved: boolean;
  viewCount: number;
  likeCount: number;
  replyCount: number;
  createdAt: string;
  updatedAt: string;
  lastReplyAt?: string;
  lastReplyAuthorName?: string;
  isLikedByCurrentUser: boolean;
  formattedCreatedAt: string;
  formattedUpdatedAt: string;
}

export interface DiscussionReplyDTO {
  id: string;
  content: string;
  discussionId: string;
  authorId: string;
  authorName: string;
  authorAvatar: string;
  authorRole: string;
  parentReplyId?: string;
  parentReplyAuthorName?: string;
  childReplies: DiscussionReplyDTO[];
  likeCount: number;
  isEdited: boolean;
  isInstructorReply: boolean;
  isAcceptedAnswer: boolean;
  createdAt: string;
  updatedAt: string;
  editedAt?: string;
  isLikedByCurrentUser: boolean;
  formattedCreatedAt: string;
  formattedEditedAt: string;
}

export interface CreateDiscussionRequest {
  title: string;
  content: string;
  courseId: string;
  type: DiscussionType;
}

export interface UpdateDiscussionRequest {
  title: string;
  content: string;
}

export interface CreateReplyRequest {
  content: string;
  parentReplyId?: string;
}

export interface UpdateReplyRequest {
  content: string;
}

export interface DiscussionSearchRequest {
  query?: string;
  courseId?: string;
  type?: DiscussionType;
  isResolved?: boolean;
  isPinned?: boolean;
  sortBy: DiscussionSortOrder;
  page: number;
  pageSize: number;
}

export interface DiscussionListResponse {
  discussions: DiscussionDTO[];
  pagination: PaginationMetadata;
  stats: DiscussionStats;
}

export interface DiscussionDetailResponse {
  discussion: DiscussionDTO;
  replies: DiscussionReplyDTO[];
  stats: DiscussionStats;
}

export interface DiscussionStats {
  totalDiscussions: number;
  totalReplies: number;
  resolvedQuestions: number;
  pendingQuestions: number;
  userParticipationCount: number;
  typeDistribution: Record<DiscussionType, number>;
}

export interface PaginationMetadata {
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

export enum DiscussionType {
  General = 0,
  Question = 1,
  Announcement = 2,
  Resource = 3,
  Assignment = 4
}

export enum DiscussionSortOrder {
  Latest = 0,
  Oldest = 1,
  MostReplies = 2,
  MostLikes = 3,
  MostViews = 4,
  PinnedFirst = 5
}

export interface DiscussionActivityDTO {
  id: string;
  type: string;
  title: string;
  content: string;
  courseId: string;
  courseTitle: string;
  authorId: string;
  authorName: string;
  authorAvatar: string;
  createdAt: string;
  formattedCreatedAt: string;
  actionUrl: string;
}

export interface NotificationPreferencesDTO {
  newDiscussionNotifications: boolean;
  replyNotifications: boolean;
  likeNotifications: boolean;
  instructorResponseNotifications: boolean;
  dailyDigest: boolean;
  watchedCourses: string[];
}

export interface ModerationActionDTO {
  discussionId: string;
  replyId?: string;
  action: string;
  reason?: string;
}