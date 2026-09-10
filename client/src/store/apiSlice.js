import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { io } from 'socket.io-client';

let socket;
const getSocket = () => {
  if (!socket) {
    socket = io(import.meta.env.VITE_SOCKET_URL || 'http://localhost:3000');
  }
  return socket;
};

export const apiSlice = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({ 
    baseUrl: import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1',
    prepareHeaders: (headers) => {
      const token = localStorage.getItem('token');
      if (token) {
        headers.set('authorization', `Bearer ${token}`);
      }
      return headers;
    }
  }),
  tagTypes: ['Patient', 'Appointment', 'Triage', 'Document', 'Queue', 'Encounter'],
  endpoints: (builder) => ({

    // Health check
    getHealth: builder.query({
      query: () => '/health',
    }),

    // Fetch triage queue for a department (used by both Nurse and Doctor dashboards)
    getTriageQueue: builder.query({
      query: (department) => `/triage/queue/${department}`,
      providesTags: ['Queue'],
      // Real-time WebSocket integration: auto-update cache when new triage arrives
      async onCacheEntryAdded(arg, { updateCachedData, cacheDataLoaded, cacheEntryRemoved }) {
        const ws = getSocket();
        
        try {
          await cacheDataLoaded;
          
          const listener = (event) => {
            if (event.type === 'NEW_PATIENT_TRIAGE') {
              updateCachedData((draft) => {
                // Add new patient to the front (will be re-sorted on next refetch)
                const exists = draft.find(p => p.id === event.data.id);
                if (!exists) {
                  draft.unshift(event.data);
                }
              });
            } else if (event.type === 'ENCOUNTER_STATUS_CHANGE') {
              updateCachedData((draft) => {
                const idx = draft.findIndex(p => p.id === event.data.id);
                if (idx !== -1) {
                  if (event.data.status === 'COMPLETED' || event.data.status === 'IN_CONSULTATION') {
                    // Remove from waiting queue
                    draft.splice(idx, 1);
                  } else {
                    draft[idx] = { ...draft[idx], ...event.data };
                  }
                }
              });
            }
          };
          
          ws.on('triage-alert', listener);
          
          await cacheEntryRemoved;
          ws.off('triage-alert', listener);
        } catch {
          // no-op if cache entry fails
        }
      }
    }),

    // Fetch full encounter detail (SOCRATES, AYUSH, transcript)
    getEncounterDetail: builder.query({
      query: (encounterId) => `/triage/encounter/${encounterId}`,
      providesTags: (result, error, id) => [{ type: 'Encounter', id }],
    }),

    // Complete triage (submit from TriageChat)
    completeTriage: builder.mutation({
      query: (body) => ({
        url: '/triage/complete',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Queue'],
    }),

    // Update encounter status (doctor marks IN_CONSULTATION, COMPLETED, etc.)
    updateEncounterStatus: builder.mutation({
      query: ({ encounterId, status, doctorId }) => ({
        url: `/triage/encounter/${encounterId}/status`,
        method: 'PATCH',
        body: { status, doctorId },
      }),
      invalidatesTags: (result, error, { encounterId }) => [
        'Queue',
        { type: 'Encounter', id: encounterId }
      ],
    }),

    // Legacy alias for backwards compatibility
    getLiveDashboard: builder.query({
      query: (department) => `/triage/queue/${department}`,
      providesTags: ['Queue'],
      async onCacheEntryAdded(arg, { updateCachedData, cacheDataLoaded, cacheEntryRemoved }) {
        const ws = getSocket();
        
        try {
          await cacheDataLoaded;
          
          const listener = (event) => {
            if (event.type === 'NEW_PATIENT_TRIAGE') {
              updateCachedData((draft) => {
                const exists = draft.find(p => p.id === event.data.id);
                if (!exists) {
                  draft.unshift(event.data);
                }
              });
            }
          };
          
          ws.on('triage-alert', listener);
          
          await cacheEntryRemoved;
          ws.off('triage-alert', listener);
        } catch {
          // no-op
        }
      }
    }),

    // Fetch patient's medical timeline documents
    getPatientDocuments: builder.query({
      query: (patientId) => `/ocr/documents/${patientId}`,
      providesTags: (result, error, id) => [{ type: 'Document', id }],
    }),

  }),
});

export const { 
  useGetHealthQuery,
  useGetTriageQueueQuery,
  useGetEncounterDetailQuery,
  useCompleteTriageMutation,
  useUpdateEncounterStatusMutation,
  useGetLiveDashboardQuery,
  useGetPatientDocumentsQuery
} = apiSlice;
