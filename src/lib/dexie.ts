import Dexie, { type EntityTable } from 'dexie';

export interface LocalSong {
  id?: number; // Auto-increment
  title: string;
  artist: string;
  genre: string;
  fileName: string;
  duration: number;
  uploadedAt: number;
  userId: string;
  blob: Blob;
}

const db = new Dexie('MelodyMixDB') as Dexie & {
  songs: EntityTable<LocalSong, 'id'>;
};

// Schema declaration:
// ++id means it will auto-increment.
// Other fields are indexed if we need to query by them. We don't index `blob`.
db.version(1).stores({
  songs: '++id, uploadedAt, userId'
});

export { db };
