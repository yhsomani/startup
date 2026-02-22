/**
 * @talentsphere/api - React Query hooks
 *
 * Provides pre-configured query hooks with TalentSphere's API client.
 */
import { api } from "./http";
import type { ApiError } from "./http";

export interface UseQueryOptions<T> {
    enabled?: boolean;
    staleTime?: number;
    cacheTime?: number;
    refetchOnWindowFocus?: boolean;
    retry?: number | boolean;
    onSuccess?: (data: T) => void;
    onError?: (error: ApiError) => void;
}

export interface UseMutationOptions<TData, TVariables> {
    onSuccess?: (data: TData) => void;
    onError?: (error: ApiError) => void;
    onSettled?: () => void;
}

export type QueryKey = readonly [string, unknown?] | string[];

export function queryClientProvider() {
    const { QueryClient } = require("@tanstack/react-query");
    return new QueryClient({
        defaultOptions: {
            queries: {
                staleTime: 5 * 60 * 1000,
                retry: 1,
                refetchOnWindowFocus: false,
            },
        },
    });
}

export async function fetchApi<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const response = await api.get<T>(endpoint, options as any);
    return response.data;
}

export { api };
