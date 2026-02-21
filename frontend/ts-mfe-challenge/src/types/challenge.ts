export interface Challenge {
    id: string;
    title: string;
    description: string;
    evaluationMetric: string;
    passingScore: number;
    datasetUrl?: string;
}

export interface Submission {
    id: string;
    challengeId: string;
    status: 'pending' | 'grading' | 'passed' | 'failed';
    score?: number;
    message?: string;
    feedback?: string;
}
