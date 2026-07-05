import { setClient } from '../src/client';
import { MockSupabaseClient } from './mock_supabase';

// Create a global mock client for tests
const mockClient = new MockSupabaseClient();
setClient(mockClient as any);

// Make mock client accessible in tests
(globalThis as any).__mockSupabaseClient = mockClient;
