import type { ReviewQueueItem, SeedPack } from './types.js';

export const seedPacks: SeedPack[] = [
  {
    id: 'core-historical-lineage',
    name: 'Core historical lineage',
    description: 'Primary references for akasha, Theosophy, Anthroposophy, and early Akashic-record language.',
    querySeeds: [
      '"Akashic Records" Theosophy',
      '"From the Akashic Record" Steiner',
      '"akasha" Sanskrit ether Theosophy',
      '"Secret Doctrine" akasha',
    ],
    sourceIds: [
      'blavatsky-secret-doctrine',
      'sinnett-esoteric-buddhism',
      'leadbeater-akashic-records',
      'steiner-akashic-record',
    ],
  },
  {
    id: 'modern-spiritual-testimony',
    name: 'Modern spiritual testimony',
    description: 'Twentieth-century and contemporary movement sources that make experiential claims.',
    querySeeds: [
      '"Akashic Records" Edgar Cayce',
      '"Book of Life" Edgar Cayce Akashic',
      '"Akashic Records" personal growth',
    ],
    sourceIds: ['cayce-readings', 'are-akashic-records', 'aquarian-gospel'],
  },
  {
    id: 'comparative-reference',
    name: 'Comparative reference',
    description: 'Reference and comparative sources useful for checking terminology, analogies, and boundaries.',
    querySeeds: [
      '"Akashic record" encyclopedia',
      '"akasha" Jainism Britannica',
      '"collective unconscious" Akashic Records',
    ],
    sourceIds: [
      'britannica-akashic-record',
      'encyclopedia-akashic-records',
      'britannica-akasha-jainism',
      'jung-collective-unconscious',
    ],
  },
];

export const seedReviewQueue: ReviewQueueItem[] = [
  {
    id: 'seed-theosophy-wiki-akashic',
    title: 'Akashic Records - Theosophy Wiki',
    url: 'https://theosophy.wiki/en/Akashic_Records',
    domain: 'theosophy.wiki',
    proposedSourceType: 'primary esoteric',
    summary:
      'Reference article gathering Theosophical explanations of Akashic Records, including Leadbeater-era terminology.',
    provenance: 'curated seed',
    status: 'pending',
    confidenceLevel: 'medium',
    citationNotes: 'Useful as a movement reference; verify quoted passages against primary editions.',
    discoveredAt: '2026-04-30T00:00:00.000Z',
  },
  {
    id: 'seed-openlibrary-cosmic-memory',
    title: 'Cosmic Memory by Rudolf Steiner - Open Library',
    url: 'https://openlibrary.org/books/OL8188632M/Cosmic_Memory',
    domain: 'openlibrary.org',
    proposedSourceType: 'historical',
    summary: 'Library metadata for Steiner editions and related archive records.',
    provenance: 'curated seed',
    status: 'pending',
    confidenceLevel: 'medium',
    citationNotes: 'Use for bibliographic triangulation, not as the primary text when RS Archive is available.',
    discoveredAt: '2026-04-30T00:00:00.000Z',
  },
  {
    id: 'seed-cayce-circulating-file',
    title: 'The Akashic Records Circulating File',
    url: 'https://content.edgarcayce.org/umbraco/api/publications/GetPublication/39972',
    domain: 'content.edgarcayce.org',
    proposedSourceType: 'modern spiritual',
    summary: 'A.R.E. circulating-file material collecting Cayce readings related to Akashic Records.',
    provenance: 'curated seed',
    status: 'pending',
    confidenceLevel: 'medium',
    citationNotes: 'Treat as movement testimony and archive material; do not treat metaphysical claims as verified.',
    discoveredAt: '2026-04-30T00:00:00.000Z',
  },
  {
    id: 'seed-man-whence-how-whither',
    title: 'Man: Whence, How and Whither',
    url: 'https://archive.org/details/manwhencehowandw031919mbp',
    domain: 'archive.org',
    proposedSourceType: 'primary esoteric',
    summary: 'Besant and Leadbeater clairvoyant-investigation text connected to Akashic-record style claims.',
    provenance: 'curated seed',
    status: 'pending',
    confidenceLevel: 'medium',
    citationNotes: 'Primary esoteric source; cite as testimony within Theosophical literature.',
    discoveredAt: '2026-04-30T00:00:00.000Z',
  },
];
