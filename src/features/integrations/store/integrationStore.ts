import { create } from 'zustand';
import { Task } from '@/features/tasks/types/task';
import {
  OdooConfig,
  OdooTaskRecord,
  OdooSyncStatus,
  IntegrationStatus,
} from '../types/integration';
import {
  testOdooConnection,
  syncTaskToOdoo,
} from '../services/odooService';

interface IntegrationState {
  // ── Odoo Connection ──────────────────────────────────────────────────────
  odooConfig: OdooConfig | null;
  integrationStatus: IntegrationStatus;
  connectionError: string | null;
  lastConnectedAt: Date | null;

  // ── Per-Task Sync Records ────────────────────────────────────────────────
  /** Map<localTaskId, OdooTaskRecord> */
  syncRecords: Record<string, OdooTaskRecord>;

  // ── Actions ──────────────────────────────────────────────────────────────
  setOdooConfig: (config: OdooConfig) => void;
  testConnection: () => Promise<boolean>;
  disconnect: () => void;
  syncTask: (task: Task) => Promise<void>;
  syncAllTasks: (tasks: Task[]) => Promise<void>;
  getSyncStatus: (taskId: string) => OdooSyncStatus;
}

export const useIntegrationStore = create<IntegrationState>((set, get) => ({
  odooConfig: null,
  integrationStatus: 'disconnected',
  connectionError: null,
  lastConnectedAt: null,
  syncRecords: {},

  setOdooConfig: (config) =>
    set({ odooConfig: config, integrationStatus: 'disconnected', connectionError: null }),

  testConnection: async () => {
    const { odooConfig } = get();
    if (!odooConfig) return false;

    set({ integrationStatus: 'connecting', connectionError: null });

    const result = await testOdooConnection(odooConfig);

    if (result.success) {
      set({
        integrationStatus: 'connected',
        lastConnectedAt: new Date(),
        odooConfig: { ...odooConfig, uid: result.uid },
        connectionError: null,
      });
      return true;
    }

    set({
      integrationStatus: 'error',
      connectionError: result.errorMessage ?? 'Koneksi gagal.',
    });
    return false;
  },

  disconnect: () =>
    set({
      integrationStatus: 'disconnected',
      connectionError: null,
      lastConnectedAt: null,
    }),

  syncTask: async (task: Task) => {
    const { odooConfig, syncRecords } = get();
    if (!odooConfig) return;

    const existing = syncRecords[task.id];

    // Set status → syncing
    set((state) => ({
      syncRecords: {
        ...state.syncRecords,
        [task.id]: {
          localTaskId: task.id,
          odooTaskId: existing?.odooTaskId,
          status: 'syncing',
        },
      },
    }));

    const result = await syncTaskToOdoo(task, odooConfig, existing?.odooTaskId);

    // Update sync record with result
    set((state) => ({
      syncRecords: {
        ...state.syncRecords,
        [task.id]: {
          localTaskId: task.id,
          odooTaskId: result.odooTaskId,
          status: result.success ? 'synced' : 'failed',
          lastSyncedAt: result.success ? new Date() : undefined,
          errorMessage: result.errorMessage,
        },
      },
    }));
  },

  syncAllTasks: async (tasks: Task[]) => {
    const activeTasks = tasks.filter((t) => !t.deletedAt);

    // Mark all as pending first
    const pendingRecords: Record<string, OdooTaskRecord> = {};
    activeTasks.forEach((t) => {
      pendingRecords[t.id] = {
        localTaskId: t.id,
        odooTaskId: get().syncRecords[t.id]?.odooTaskId,
        status: 'pending',
      };
    });
    set((state) => ({ syncRecords: { ...state.syncRecords, ...pendingRecords } }));

    // Sync sequentially to avoid overwhelming Odoo server
    for (const task of activeTasks) {
      await get().syncTask(task);
    }
  },

  getSyncStatus: (taskId: string): OdooSyncStatus =>
    get().syncRecords[taskId]?.status ?? 'idle',
}));
