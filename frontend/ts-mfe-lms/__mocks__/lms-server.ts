import { setupServer } from 'msw/node';
import { handlers } from './lms-handlers';

export const server = setupServer(...handlers);
