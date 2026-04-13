import '@testing-library/jest-dom';

// Global mock for fetch can go here if needed.
import { TextEncoder, TextDecoder } from 'util';

global.TextEncoder = TextEncoder as any;
global.TextDecoder = TextDecoder as any;
