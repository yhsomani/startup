/**
 * @talentsphere/ui
 * 
 * Shared UI component library for TalentSphere frontend.
 * 
 * Usage:
 *   import { Button, Card, Input, Modal } from '@talentsphere/ui';
 */

// Button
export { Button } from './Button';
export type { ButtonProps } from './Button';

// Input
export { Input } from './Input';
export type { InputProps } from './Input';

// Card
export { Card, CardHeader, CardTitle, CardContent, CardFooter } from './Card';
export type { CardProps, CardHeaderProps, CardTitleProps, CardContentProps, CardFooterProps } from './Card';

// Skeleton
export { Skeleton, SkeletonText, SkeletonCard, SkeletonAvatar } from './Skeleton';
export type { SkeletonProps, SkeletonTextProps } from './Skeleton';

// ErrorBoundary
export { ErrorBoundary } from './ErrorBoundary';
export type { ErrorBoundaryProps } from './ErrorBoundary';

// Modal
export { Modal } from './Modal';
export type { ModalProps } from './Modal';
