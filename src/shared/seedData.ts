import type { ReviewQueueItem, SeedPack } from './types.js';
import { releaseResourceCount, releaseResourceSeedQueries, releaseReviewQueue } from './releaseResourceCatalog.js';

const releaseQueryById = new Map<string, (typeof releaseResourceSeedQueries)[number]>(
  releaseResourceSeedQueries.map((seedQuery) => [seedQuery.id, seedQuery]),
);
const allReleaseCollections = releaseResourceSeedQueries.map((seedQuery) => seedQuery.name);

function querySeed(id: string): string {
  return releaseQueryById.get(id)?.query ?? id;
}

function countReleaseResources(sourceCollections: string[]): number {
  const collectionSet = new Set(sourceCollections);
  return releaseReviewQueue.filter((item) => item.sourceCollection && collectionSet.has(item.sourceCollection)).length;
}

function countPackResources(sourceCollections: string[], sourceIds: string[] = []): number {
  return countReleaseResources(sourceCollections) + sourceIds.length;
}

export const seedPacks: SeedPack[] = [
  {
    id: 'primary-theosophy-corpus',
    name: 'Primary Theosophy Corpus',
    description: 'Primary and movement-adjacent Theosophical sources for akasha, astral light, and early record-reading claims.',
    querySeeds: [
      querySeed('theosophy-core'),
      querySeed('blavatsky'),
      querySeed('leadbeater-besant'),
      querySeed('sinnett-esoteric-buddhism'),
      '"Akashic Records" Leadbeater',
      '"astral light" Theosophy',
    ],
    sourceIds: [
      'blavatsky-secret-doctrine',
      'sinnett-esoteric-buddhism',
      'leadbeater-akashic-records',
      'besant-leadbeater-man',
    ],
    sourceCollections: [
      'Theosophy core texts',
      'H. P. Blavatsky and Theosophical reception',
      'Leadbeater, Besant, and clairvoyant histories',
      'A. P. Sinnett and early Theosophical cosmology',
    ],
    resourceCount: countPackResources(
      [
        'Theosophy core texts',
        'H. P. Blavatsky and Theosophical reception',
        'Leadbeater, Besant, and clairvoyant histories',
        'A. P. Sinnett and early Theosophical cosmology',
      ],
      ['blavatsky-secret-doctrine', 'sinnett-esoteric-buddhism', 'leadbeater-akashic-records', 'besant-leadbeater-man'],
    ),
    reviewPolicy: 'auto-promote',
    targetSourceTypes: ['primary esoteric', 'historical'],
    minimumCitationStatus: 'partial',
    claimExtractionAllowed: true,
    promotionNotesTemplate:
      'Promote as primary esoteric or historical context; require page-level citations before extracting claims.',
    riskFlags: ['metaphysical testimony', 'movement self-description', 'edition verification required'],
  },
  {
    id: 'anthroposophy-akashic-chronicle',
    name: 'Anthroposophy / Akashic Chronicle',
    description: 'Steiner and Anthroposophical sources around Cosmic Memory, From the Akashic Record, and Akashic Chronicle language.',
    querySeeds: [
      querySeed('anthroposophy'),
      querySeed('rudolf-steiner'),
      '"Akashic Chronicle" Steiner',
      '"Cosmic Memory" Steiner',
      '"From the Akashic Record"',
    ],
    sourceIds: ['steiner-akashic-record'],
    sourceCollections: ['Anthroposophy and Steiner archives', 'Rudolf Steiner texts and lectures'],
    resourceCount: countPackResources(['Anthroposophy and Steiner archives', 'Rudolf Steiner texts and lectures'], [
      'steiner-akashic-record',
    ]),
    reviewPolicy: 'auto-promote',
    targetSourceTypes: ['primary esoteric', 'historical'],
    minimumCitationStatus: 'partial',
    claimExtractionAllowed: true,
    promotionNotesTemplate:
      'Promote as Anthroposophical testimony; label spiritual research claims separately from conventional history.',
    riskFlags: ['spiritual-science claim boundaries', 'translation/edition variance', 'page references required'],
  },
  {
    id: 'edgar-cayce-book-of-life',
    name: 'Edgar Cayce / Book of Life',
    description: 'Cayce movement sources and related Book of Life language for modern spiritual testimony and reception history.',
    querySeeds: [
      querySeed('edgar-cayce'),
      '"Edgar Cayce" "Akashic Records"',
      '"Book of Life" Cayce',
      '"soul records" Cayce',
    ],
    sourceIds: ['cayce-readings', 'are-akashic-records'],
    sourceCollections: ['Edgar Cayce and modern spiritual testimony'],
    resourceCount: countPackResources(['Edgar Cayce and modern spiritual testimony'], [
      'cayce-readings',
      'are-akashic-records',
    ]),
    reviewPolicy: 'auto-promote',
    targetSourceTypes: ['modern spiritual', 'historical'],
    minimumCitationStatus: 'partial',
    claimExtractionAllowed: true,
    promotionNotesTemplate:
      'Promote as modern spiritual testimony; extract reading IDs or archive references before claim reuse.',
    riskFlags: ['experiential testimony', 'reading ID required', 'do not validate metaphysical access claims'],
  },
  {
    id: 'akasha-term-history',
    name: 'Akasha Term-History',
    description: 'South Asian, Theosophical, and comparative term-history sources that keep akasha distinct from Western Akashic Records doctrine.',
    querySeeds: [
      querySeed('akashic-akasha'),
      '"akasha" Sanskrit',
      '"akasa" ether',
      '"akasha" Jainism',
      '"akasha" Theosophy',
    ],
    sourceIds: ['britannica-akasha-jainism', 'akasha-wikipedia'],
    sourceCollections: ['Akashic and akasha terminology'],
    resourceCount: countPackResources(['Akashic and akasha terminology'], [
      'britannica-akasha-jainism',
      'akasha-wikipedia',
    ]),
    reviewPolicy: 'citation-only',
    targetSourceTypes: ['religious/comparative', 'historical', 'academic'],
    minimumCitationStatus: 'partial',
    claimExtractionAllowed: true,
    promotionNotesTemplate:
      'Promote for terminology boundaries; do not collapse South Asian akasha into Western occult record claims.',
    riskFlags: ['translation ambiguity', 'tradition collapse risk', 'reference replacement recommended'],
  },
  {
    id: 'western-esotericism-context',
    name: 'Western Esotericism Context',
    description: 'Occultism, astral light, spiritualism, psychical research, and hidden-record context for reception history.',
    querySeeds: [
      querySeed('western-esotericism'),
      querySeed('spiritualism-psychical'),
      '"astral light"',
      '"occult memory of nature"',
      '"western esotericism" "Theosophy"',
    ],
    sourceIds: ['olcott-buddhist-catechism', 'aquarian-gospel'],
    sourceCollections: ['Western esotericism and occult history', 'Spiritualism and psychical research context'],
    resourceCount: countPackResources(['Western esotericism and occult history', 'Spiritualism and psychical research context'], [
      'olcott-buddhist-catechism',
      'aquarian-gospel',
    ]),
    reviewPolicy: 'auto-promote',
    targetSourceTypes: ['historical', 'primary esoteric', 'modern spiritual'],
    minimumCitationStatus: 'partial',
    claimExtractionAllowed: true,
    promotionNotesTemplate:
      'Promote as context for reception history; separate movement claims from documented historical relationships.',
    riskFlags: ['occult-history scope creep', 'primary/secondary boundary', 'dated terminology'],
  },
  {
    id: 'comparative-religion-boundaries',
    name: 'Comparative Religion Boundaries',
    description: 'Comparative religion sources for Book of Life, heavenly tablets, karma, Jain/Hindu contexts, and boundary-setting.',
    querySeeds: [
      querySeed('comparative-religion'),
      '"Book of Life" religion',
      '"heavenly tablets"',
      '"karma record"',
      '"collective memory" religion',
    ],
    sourceIds: ['britannica-akasha-jainism'],
    sourceCollections: ['Comparative religion and South Asian term context'],
    resourceCount: countPackResources(['Comparative religion and South Asian term context'], [
      'britannica-akasha-jainism',
    ]),
    reviewPolicy: 'citation-only',
    targetSourceTypes: ['religious/comparative', 'academic', 'historical'],
    minimumCitationStatus: 'partial',
    claimExtractionAllowed: true,
    promotionNotesTemplate:
      'Promote for comparison and boundary notes; mark analogies explicitly and avoid equivalence claims.',
    riskFlags: ['false equivalence', 'tradition-specific terminology', 'analogy-only sources'],
  },
  {
    id: 'psychology-analogue-concepts',
    name: 'Psychology And Analogue Concepts',
    description: 'Jung, collective unconscious, archetypes, mysticism, religious experience, and transpersonal analogues.',
    querySeeds: [
      querySeed('collective-unconscious'),
      querySeed('mysticism-history'),
      '"collective unconscious" Akashic',
      '"archetypes" "cosmic memory"',
      '"transpersonal psychology" "Akashic"',
    ],
    sourceIds: ['jung-collective-unconscious'],
    sourceCollections: ['Comparative psychology analogues', 'Mysticism and religious experience scholarship'],
    resourceCount: countPackResources(['Comparative psychology analogues', 'Mysticism and religious experience scholarship'], [
      'jung-collective-unconscious',
    ]),
    reviewPolicy: 'citation-only',
    targetSourceTypes: ['academic', 'historical', 'speculative'],
    minimumCitationStatus: 'partial',
    claimExtractionAllowed: true,
    promotionNotesTemplate:
      'Promote as analogue material only; do not cite psychology as validation of Akashic Records claims.',
    riskFlags: ['analogy mistaken for proof', 'speculative comparison', 'discipline boundary'],
  },
  {
    id: 'critical-skeptical-historiographic',
    name: 'Critical / Skeptical / Historiographic Sources',
    description: 'Critical history, skeptical claims, fraud allegations, and reliability checks for occult and psychical sources.',
    querySeeds: [
      querySeed('critical-skeptical'),
      '"Theosophy" criticism',
      '"Blavatsky" historical criticism',
      '"psychical research" criticism',
    ],
    sourceIds: [],
    sourceCollections: ['Critical and skeptical historiography'],
    resourceCount: countReleaseResources(['Critical and skeptical historiography']),
    reviewPolicy: 'manual',
    targetSourceTypes: ['historical', 'academic', 'low-quality'],
    minimumCitationStatus: 'partial',
    claimExtractionAllowed: true,
    promotionNotesTemplate:
      'Promote as reliability context; separate documented criticism from polemic or unsourced allegations.',
    riskFlags: ['polemic risk', 'source reliability', 'corroboration required'],
  },
  {
    id: 'modern-spiritual-commercialization',
    name: 'Modern Spiritual Commercialization',
    description: 'Modern Akashic readings, healing, coaching, courses, and monetized claims for cautious classification.',
    querySeeds: [
      querySeed('modern-commercialization'),
      querySeed('new-thought-metaphysical'),
      '"Akashic Records reading"',
      '"Akashic Records course"',
      '"Akashic healing"',
    ],
    sourceIds: ['cayce-personal-growth'],
    sourceCollections: ['Modern spiritual commercialization', 'New Thought and metaphysical publishing'],
    resourceCount: countPackResources(['Modern spiritual commercialization', 'New Thought and metaphysical publishing'], [
      'cayce-personal-growth',
    ]),
    reviewPolicy: 'quarantine',
    targetSourceTypes: ['commercial', 'modern spiritual', 'low-quality'],
    minimumCitationStatus: 'complete',
    claimExtractionAllowed: false,
    promotionNotesTemplate:
      'Quarantine promotional or monetized claims unless independently corroborated by primary, historical, or academic sources.',
    riskFlags: ['promotional claims', 'paid services', 'low-trust until corroborated'],
  },
  {
    id: 'public-domain-full-text-priority',
    name: 'Public-Domain Full Text Priority',
    description: 'Full-text archive leads prioritized for page-level citation, quotation checks, and later extraction work.',
    querySeeds: [
      'site:archive.org "Akashic Records"',
      'site:archive.org theosophy akasha',
      'site:archive.org anthroposophy "Rudolf Steiner"',
      'site:archive.org "psychical research"',
    ],
    sourceIds: [],
    sourceCollections: allReleaseCollections,
    resourceCount: releaseResourceCount,
    reviewPolicy: 'auto-promote',
    targetSourceTypes: ['primary esoteric', 'historical', 'academic', 'religious/comparative', 'modern spiritual'],
    minimumCitationStatus: 'partial',
    claimExtractionAllowed: true,
    promotionNotesTemplate:
      'Promote full-text archive sources first when page image references can be verified before claim extraction.',
    riskFlags: ['scan quality review', 'edition verification', 'page-level citation required'],
  },
];

const curatedSeedReviewQueue: ReviewQueueItem[] = [
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
    reviewPriority: 'high',
    citationStatus: 'partial',
    accessType: 'movement page',
    stableCitation: 'Theosophy Wiki. Akashic Records. https://theosophy.wiki/en/Akashic_Records',
    citationNotes: 'Useful as a movement reference; verify quoted passages against primary editions.',
    sourceCollection: 'Theosophy core texts',
    catalogTags: ['theosophy', 'akashic records', 'movement reference'],
    qualityFlags: ['movement reference', 'quotation verification needed'],
    requiredActions: ['Verify quoted passages against primary editions', 'Capture source-level page or section references'],
    reviewerNotes: 'Needs quotation-level verification before promotion.',
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
    reviewPriority: 'medium',
    citationStatus: 'partial',
    accessType: 'catalog/reference',
    stableCitation: 'Open Library. Cosmic Memory by Rudolf Steiner. https://openlibrary.org/books/OL8188632M/Cosmic_Memory',
    citationNotes: 'Use for bibliographic triangulation, not as the primary text when RS Archive is available.',
    sourceCollection: 'Anthroposophy and Steiner archives',
    catalogTags: ['anthroposophy', 'steiner', 'bibliographic lead'],
    qualityFlags: ['bibliographic lead', 'secondary metadata'],
    requiredActions: ['Compare edition metadata with RS Archive', 'Record publisher, edition, and archive availability'],
    reviewerNotes: 'Check edition metadata and archive availability.',
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
    reviewPriority: 'high',
    citationStatus: 'partial',
    accessType: 'full text',
    stableCitation:
      'Association for Research and Enlightenment. The Akashic Records Circulating File. https://content.edgarcayce.org/umbraco/api/publications/GetPublication/39972',
    citationNotes: 'Treat as movement testimony and archive material; do not treat metaphysical claims as verified.',
    sourceCollection: 'Edgar Cayce and modern spiritual testimony',
    catalogTags: ['edgar cayce', 'akashic records', 'reading ids'],
    qualityFlags: ['movement testimony', 'metaphysical claims', 'reading IDs needed'],
    requiredActions: ['Extract Cayce reading IDs if present', 'Separate testimony from historical claims'],
    reviewerNotes: 'Review for extractable Cayce reading IDs or page references.',
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
    reviewPriority: 'medium',
    citationStatus: 'partial',
    accessType: 'full text',
    stableCitation: 'Annie Besant and C. W. Leadbeater. Man: Whence, How and Whither. https://archive.org/details/manwhencehowandw031919mbp',
    citationNotes: 'Primary esoteric source; cite as testimony within Theosophical literature.',
    sourceCollection: 'Leadbeater, Besant, and clairvoyant histories',
    catalogTags: ['theosophy', 'besant', 'leadbeater', 'public-domain scan'],
    qualityFlags: ['primary esoteric', 'public-domain scan', 'edition verification needed'],
    requiredActions: ['Check scan quality', 'Capture edition details', 'Record page references for extracted claims'],
    reviewerNotes: 'Review public-domain scan quality and edition details.',
    discoveredAt: '2026-04-30T00:00:00.000Z',
  },
];

export const seedReviewQueue: ReviewQueueItem[] = [...curatedSeedReviewQueue, ...releaseReviewQueue];
