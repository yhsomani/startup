import React, { lazy, Suspense } from 'react';

interface LazyLoadProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

const LazyLoad = ({ children, fallback = <div>Loading...</div> }: LazyLoadProps) => (
  <Suspense fallback={fallback}>
    {children}
  </Suspense>
);

const loadRemote = (remoteName: string, modulePath: string) => {
  return lazy(() => {
    const remote = window[remoteName];
    if (!remote) {
      return Promise.reject(new Error(`Remote ${remoteName} not found`));
    }
    return remote.get(modulePath).then((factory: any) => ({
      default: factory().default
    }));
  });
};

export const LMSApp = loadRemote('lms', './App');
export const ChallengeApp = loadRemote('challenge', './App');

export default LazyLoad;

declare global {
  interface Window {
    [key: string]: any;
  }
}