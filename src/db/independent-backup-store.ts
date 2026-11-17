import Dexie, { type EntityTable } from 'dexie';
import type { CheckpointEnvelope, RecoveryKit } from '../lib/backup-crypto';
import type { IndependentBackupPayload } from './independent-backup-payload';

export interface BackupClientState {
  id: 'client';
  kit?: RecoveryKit;
  enrolled: boolean;
  consent: boolean;
  kitConfirmed: boolean;
  enabled: boolean;
  generation: number;
  dirty: boolean;
  headId: string | null;
  pending?: { envelope: CheckpointEnvelope; generation: number; fingerprint: string };
  lastAck?: { id: string; confirmedAt: string; fingerprint: string };
  error?: { code: string; message: string };
}

export interface RestoreJournal {
  id: 'restore';
  phase: 'prepared' | 'database-written' | 'verified';
  checkpointId: string;
  /** Encrypted source remains retryable after a split IDB/localStorage restore. */
  kit: RecoveryKit;
  envelope: CheckpointEnvelope;
  safetyCopy: IndependentBackupPayload;
  safetyStorageKeys: string[];
  /** Exact pre-restore sidecar identity; never part of ordinary data exports. */
  sourceState: BackupClientState | null;
  storageConflict?: true;
  startedAt: string;
}

export interface RestoreSafetyCopy {
  id?: number;
  createdAt: string;
  checkpointId: string;
  payload: IndependentBackupPayload;
}

const initialState = (): BackupClientState => ({
  id: 'client', enrolled: false, consent: false, kitConfirmed: false, enabled: false,
  generation: 0, dirty: false, headId: null,
});

/** Separate database: never exported in a normal backup and never recursively captured. */
export class IndependentBackupStore extends Dexie {
  state!: EntityTable<BackupClientState, 'id'>;
  journal!: EntityTable<RestoreJournal, 'id'>;
  safetyCopies!: EntityTable<RestoreSafetyCopy, 'id'>;
  constructor(name = 'LangLearnIndependentBackupV1') {
    super(name);
    this.version(1).stores({ state: 'id', journal: 'id' });
    this.version(2).stores({ state: 'id', journal: 'id', safetyCopies: '++id, createdAt' });
  }
  async read(): Promise<BackupClientState> {
    return await this.state.get('client') ?? initialState();
  }
  async change(update: (state: BackupClientState) => void): Promise<BackupClientState> {
    return this.transaction('rw', this.state, async () => {
      const state = await this.read();
      update(state);
      await this.state.put(state);
      return state;
    });
  }
}

export const independentBackupStore = new IndependentBackupStore();
