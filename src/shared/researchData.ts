import type {
  AdditionFramework,
  BibliographicRecord,
  Claim,
  ComparativeConcept,
  GenealogyEdge,
  GenealogyNode,
  ResearchMovement,
  ResearchPerson,
  ResearchTerm,
  Source,
  TimelineEvent,
} from './types.js';

const sources: Source[] = [
  {
    id: 'blavatsky-secret-doctrine',
    title: 'The Secret Doctrine',
    author: 'H. P. Blavatsky',
    date: '1888',
    url: 'https://www.theosociety.org/pasadena/sd/sd-hp.htm',
    sourceType: 'primary esoteric',
    summary:
      'A foundational Theosophical text that uses akasha and related concepts inside a broader esoteric cosmology.',
    confidenceLevel: 'high',
    citationNotes: 'Use as primary esoteric material; distinguish textual content from historical verification.',
  },
  {
    id: 'steiner-akashic-record',
    title: 'Cosmic Memory: Prehistory of Earth and Man',
    author: 'Rudolf Steiner',
    date: '1904-1908',
    url: 'https://rsarchive.org/Books/GA011/',
    sourceType: 'primary esoteric',
    summary:
      'Anthroposophical lectures and essays describing access to an Akashic record as spiritual-scientific testimony.',
    confidenceLevel: 'high',
    citationNotes: 'Treat as primary Anthroposophical testimony, not empirical evidence.',
  },
  {
    id: 'jung-collective-unconscious',
    title: 'The Archetypes and the Collective Unconscious',
    author: 'C. G. Jung',
    date: '1959',
    url: 'https://press.princeton.edu/books/paperback/9780691018331/the-archetypes-and-the-collective-unconscious',
    sourceType: 'academic',
    summary:
      'Psychological framework often compared with universal-memory ideas, though it is not an Akashic Records source.',
    confidenceLevel: 'medium',
    citationNotes: 'Use only for comparative psychological interpretation.',
  },
  {
    id: 'cayce-readings',
    title: 'Edgar Cayce Reading Collections',
    author: 'Association for Research and Enlightenment',
    date: '20th century',
    url: 'https://www.edgarcayce.org/',
    sourceType: 'modern spiritual',
    summary:
      'Modern spiritual material containing experiential claims about readings and access to nonordinary information.',
    confidenceLevel: 'medium',
    citationNotes: 'Classify as modern spiritual testimony unless corroborated by independent historical sources.',
  },
  {
    id: 'britannica-akashic-record',
    title: 'Akashic record',
    author: 'Encyclopaedia Britannica',
    date: 'reference entry',
    url: 'https://www.britannica.com/topic/Akashic-record',
    sourceType: 'historical',
    summary:
      'Concise reference entry describing the Akashic record as an occult concept rather than an empirically verified archive.',
    confidenceLevel: 'medium',
    citationNotes: 'Useful for neutral definition and public-facing summary language.',
  },
  {
    id: 'encyclopedia-akashic-records',
    title: 'Akashic Records',
    author: 'Encyclopedia.com',
    date: 'reference entry',
    url: 'https://www.encyclopedia.com/science/encyclopedias-almanacs-transcripts-and-maps/akashic-records',
    sourceType: 'historical',
    summary:
      'Reference overview that situates Akashic Records in occult and modern spiritual contexts, including Cayce-related material.',
    confidenceLevel: 'medium',
    citationNotes: 'Use as secondary reference; verify named movement claims against primary sources.',
  },
  {
    id: 'theosophy-wiki-akashic-records',
    title: 'Akashic Records',
    author: 'Theosophy Wiki',
    date: 'reference article',
    url: 'https://theosophy.wiki/en/Akashic_Records',
    sourceType: 'primary esoteric',
    summary:
      'Movement-oriented reference gathering Theosophical definitions and descriptions of record-reading claims.',
    confidenceLevel: 'medium',
    citationNotes: 'Good lead source for Theosophical terminology; verify quoted primary texts before final citation.',
  },
  {
    id: 'sinnett-esoteric-buddhism',
    title: 'Esoteric Buddhism',
    author: 'A. P. Sinnett',
    date: '1883',
    url: 'https://archive.org/details/esotericbuddhism00sinn',
    sourceType: 'primary esoteric',
    summary:
      'Early Theosophical book that helped transmit occultized Buddhist and esoteric cosmological vocabulary into Western readership.',
    confidenceLevel: 'medium',
    citationNotes: 'Use for historical lineage, with care around colonial-era and Theosophical framing.',
  },
  {
    id: 'olcott-buddhist-catechism',
    title: 'The Buddhist Catechism',
    author: 'Henry S. Olcott',
    date: '1881',
    url: 'https://archive.org/details/buddhistcatechis00olco',
    sourceType: 'religious/comparative',
    summary:
      'Theosophical-era Buddhist catechism relevant to tracing terms and ideas cited in later Akashic-record histories.',
    confidenceLevel: 'medium',
    citationNotes: 'Use as historical context, not as a direct Akashic Records source.',
  },
  {
    id: 'leadbeater-akashic-records',
    title: 'The Akashic Records',
    author: 'C. W. Leadbeater',
    date: 'early 20th century',
    url: 'https://www.cwlworld.info/The_Akashic_Records_c.pdf',
    sourceType: 'primary esoteric',
    summary:
      'Leadbeater text giving a Theosophical account of record-reading and planes of perception.',
    confidenceLevel: 'medium',
    citationNotes: 'Treat as primary esoteric testimony and doctrine, not independent historical evidence.',
  },
  {
    id: 'besant-leadbeater-man',
    title: 'Man: Whence, How and Whither',
    author: 'Annie Besant and C. W. Leadbeater',
    date: '1913',
    url: 'https://archive.org/details/manwhencehowandw031919mbp',
    sourceType: 'primary esoteric',
    summary:
      'Theosophical clairvoyant-investigation text that exemplifies record-access claims about human origins and prehistory.',
    confidenceLevel: 'medium',
    citationNotes: 'Use as primary source for claims made by authors; separate from historical verification.',
  },
  {
    id: 'are-akashic-records',
    title: 'Edgar Cayce on the Akashic Records',
    author: 'Edgar Cayce Association for Research and Enlightenment',
    date: 'modern archive page',
    url: 'https://edgarcayce.org/edgar-cayce/readings/akashic-records/',
    sourceType: 'modern spiritual',
    summary:
      'A.R.E. page presenting Cayce movement explanations of Akashic Records and the Book of Life framing.',
    confidenceLevel: 'medium',
    citationNotes: 'Use for Cayce movement self-description and reading excerpts.',
  },
  {
    id: 'cayce-personal-growth',
    title: 'Edgar Cayce, the Akashic Records and Personal Growth',
    author: 'Edgar Cayce Association for Research and Enlightenment',
    date: '2017',
    url: 'https://content.edgarcayce.org/about-us/blog/blog-posts/edgar-cayce-the-akashic-records-and-personal-growth/',
    sourceType: 'modern spiritual',
    summary:
      'Modern A.R.E. article connecting Akashic-record ideas to personal growth and life-review language.',
    confidenceLevel: 'medium',
    citationNotes: 'Classify as contemporary movement interpretation.',
  },
  {
    id: 'aquarian-gospel',
    title: 'The Aquarian Gospel of Jesus the Christ',
    author: 'Levi H. Dowling',
    date: '1908',
    url: 'https://archive.org/details/aquariangospelo00dowlgoog',
    sourceType: 'modern spiritual',
    summary:
      'Early twentieth-century New Thought text presented as material accessed from Akashic Records.',
    confidenceLevel: 'medium',
    citationNotes: 'Use as example of claimed Akashic transcription in modern spiritual literature.',
  },
  {
    id: 'britannica-akasha-jainism',
    title: 'Akasha',
    author: 'Encyclopaedia Britannica',
    date: 'reference entry',
    url: 'https://www.britannica.com/topic/akasha-Jainism',
    sourceType: 'religious/comparative',
    summary:
      'Reference entry on akasha in Jain context, useful for distinguishing South Asian term-history from Western occult usage.',
    confidenceLevel: 'medium',
    citationNotes: 'Use for comparative terminology, not for Akashic Records claims.',
  },
  {
    id: 'akasha-wikipedia',
    title: 'Akasha',
    author: 'Wikipedia contributors',
    date: 'reference article',
    url: 'https://en.wikipedia.org/wiki/Akasha',
    sourceType: 'religious/comparative',
    summary:
      'General reference article on akasha across Indian religious and philosophical contexts.',
    confidenceLevel: 'low',
    citationNotes: 'Use as lead-finding only; prefer cited primary or academic sources for final research.',
  },
  {
    id: 'akashic-records-wikipedia',
    title: 'Akashic records',
    author: 'Wikipedia contributors',
    date: 'reference article',
    url: 'https://en.wikipedia.org/wiki/Akashic_records',
    sourceType: 'historical',
    summary:
      'General reference article linking Theosophy, Steiner, Cayce, and modern popular usage.',
    confidenceLevel: 'low',
    citationNotes: 'Use as a map of leads and references, not as final authority.',
  },
];

const claims: Claim[] = [
  {
    id: 'claim-theosophy-akasha',
    sourceId: 'blavatsky-secret-doctrine',
    text: 'Theosophical literature made akasha a central concept in an esoteric cosmology during the late nineteenth century.',
    type: 'historical claim',
    evidenceGrade: 'A',
    confidenceLevel: 'high',
    citationRequired: true,
    notes: 'Historically documentable as a publication and movement claim.',
  },
  {
    id: 'claim-steiner-access',
    sourceId: 'steiner-akashic-record',
    text: 'Steiner presented Akashic-record readings as spiritual research rather than conventional historical method.',
    type: 'experiential claim',
    evidenceGrade: 'D',
    confidenceLevel: 'high',
    citationRequired: true,
    notes: 'Accurately describes the source position; does not validate the asserted access.',
  },
  {
    id: 'claim-jung-analogue',
    sourceId: 'jung-collective-unconscious',
    text: 'The collective unconscious can be compared to Akashic Records ideas as a psychological analogue, not as the same doctrine.',
    type: 'psychological interpretation',
    evidenceGrade: 'C',
    confidenceLevel: 'medium',
    citationRequired: true,
    notes: 'Comparative framing requires careful wording and citations to both traditions.',
  },
  {
    id: 'claim-cayce-testimony',
    sourceId: 'cayce-readings',
    text: 'Cayce-related materials contain subjective reports of access to records or readings beyond ordinary memory.',
    type: 'experiential claim',
    evidenceGrade: 'D',
    confidenceLevel: 'medium',
    citationRequired: true,
    notes: 'Treat as testimony and movement history, not empirical proof.',
  },
  {
    id: 'claim-britannica-occult-definition',
    sourceId: 'britannica-akashic-record',
    text: 'Reference works describe the Akashic record as an occult concept rather than a verified empirical archive.',
    type: 'historical claim',
    evidenceGrade: 'B',
    confidenceLevel: 'medium',
    citationRequired: true,
    notes: 'Useful neutral baseline for public-facing definitions.',
  },
  {
    id: 'claim-theosophy-lineage',
    sourceId: 'theosophy-wiki-akashic-records',
    text: 'Theosophical writers developed detailed accounts of record-reading through concepts of subtle planes and clairvoyant perception.',
    type: 'historical claim',
    evidenceGrade: 'B',
    confidenceLevel: 'medium',
    citationRequired: true,
    notes: 'Verify specific quotations against Leadbeater, Besant, Sinnett, or other primary texts.',
  },
  {
    id: 'claim-sinnett-transmission',
    sourceId: 'sinnett-esoteric-buddhism',
    text: 'Late nineteenth-century Theosophical literature helped transmit esoteric cosmology into Western occult readership.',
    type: 'historical claim',
    evidenceGrade: 'B',
    confidenceLevel: 'medium',
    citationRequired: true,
    notes: 'Use for intellectual genealogy rather than direct proof of Akashic Records.',
  },
  {
    id: 'claim-leadbeater-record-reading',
    sourceId: 'leadbeater-akashic-records',
    text: 'Leadbeater presented Akashic Records as accessible through trained clairvoyant perception within a Theosophical cosmology.',
    type: 'experiential claim',
    evidenceGrade: 'D',
    confidenceLevel: 'medium',
    citationRequired: true,
    notes: 'Accurately describes the source claim while leaving validity unverified.',
  },
  {
    id: 'claim-besant-leadbeater-prehistory',
    sourceId: 'besant-leadbeater-man',
    text: 'Besant and Leadbeater used clairvoyant investigation to construct esoteric narratives of human origins and prehistory.',
    type: 'experiential claim',
    evidenceGrade: 'D',
    confidenceLevel: 'medium',
    citationRequired: true,
    notes: 'Primary esoteric account; compare with historical scholarship before interpretation.',
  },
  {
    id: 'claim-cayce-book-of-life',
    sourceId: 'are-akashic-records',
    text: 'Cayce-related materials connect Akashic Records language with the Book of Life and individual soul history.',
    type: 'experiential claim',
    evidenceGrade: 'D',
    confidenceLevel: 'medium',
    citationRequired: true,
    notes: 'Classify as Cayce movement teaching and reading interpretation.',
  },
  {
    id: 'claim-aquarian-gospel-akashic',
    sourceId: 'aquarian-gospel',
    text: 'The Aquarian Gospel represents an early modern spiritual text framed as material received from Akashic Records.',
    type: 'historical claim',
    evidenceGrade: 'B',
    confidenceLevel: 'medium',
    citationRequired: true,
    notes: 'Historically documentable publication claim; does not validate the claimed access method.',
  },
  {
    id: 'claim-akasha-distinction',
    sourceId: 'britannica-akasha-jainism',
    text: 'Akasha has South Asian philosophical meanings that should not be collapsed into Western Akashic Records doctrine.',
    type: 'symbolic interpretation',
    evidenceGrade: 'C',
    confidenceLevel: 'medium',
    citationRequired: true,
    notes: 'Important terminology guardrail for comparative research.',
  },
  {
    id: 'claim-wikipedia-lead-map',
    sourceId: 'akashic-records-wikipedia',
    text: 'General reference articles are useful lead maps but should be replaced by primary or specialist sources in final citations.',
    type: 'historical claim',
    evidenceGrade: 'C',
    confidenceLevel: 'high',
    citationRequired: false,
    notes: 'Workflow rule for corpus hygiene.',
  },
];

const nodes: GenealogyNode[] = [
  {
    id: 'akasha',
    label: 'Akasha',
    period: 'Classical and premodern South Asian contexts',
    category: 'religious/comparative',
    description: 'A Sanskrit term often translated as ether, space, or subtle element depending on context.',
  },
  {
    id: 'theosophy',
    label: 'Theosophy',
    period: 'Late 19th century',
    category: 'primary esoteric',
    description: 'Popularized esoteric uses of akasha in Western occult and comparative-religion settings.',
  },
  {
    id: 'anthroposophy',
    label: 'Anthroposophy',
    period: 'Early 20th century',
    category: 'primary esoteric',
    description: 'Developed Akashic-record language through Steiner’s spiritual research claims.',
  },
  {
    id: 'cayce',
    label: 'Edgar Cayce movement',
    period: '20th century',
    category: 'modern spiritual',
    description: 'Associated Akashic Records with readings, reincarnation narratives, and spiritual counseling.',
  },
  {
    id: 'jung',
    label: 'Collective unconscious analogue',
    period: '20th century',
    category: 'psychological interpretation',
    description: 'A comparative psychological model sometimes used as an analogue, with important limits.',
  },
  {
    id: 'information-field',
    label: 'Information-field speculation',
    period: 'Late 20th to 21st century',
    category: 'speculative',
    description: 'Modern speculative framing that treats Akashic Records as a mythic data-field concept.',
  },
  {
    id: 'sinnett',
    label: 'A. P. Sinnett',
    period: 'Late 19th century',
    category: 'primary esoteric',
    description: 'Theosophical author whose work helped popularize esoteric cosmology in English-language occultism.',
  },
  {
    id: 'leadbeater-besant',
    label: 'Leadbeater and Besant clairvoyant histories',
    period: 'Early 20th century',
    category: 'primary esoteric',
    description: 'Theosophical writings that present record-style clairvoyant investigations of hidden history.',
  },
  {
    id: 'book-of-life',
    label: 'Book of Life motif',
    period: 'Biblical and modern spiritual reinterpretations',
    category: 'religious/comparative',
    description: 'A comparative motif used in Cayce-related explanations of Akashic Records.',
  },
  {
    id: 'new-thought',
    label: 'New Thought and modern metaphysical publishing',
    period: 'Late 19th to early 20th century',
    category: 'modern spiritual',
    description: 'Publishing context for texts claiming access to hidden spiritual records or higher planes.',
  },
];

const edges: GenealogyEdge[] = [
  {
    from: 'akasha',
    to: 'theosophy',
    label: 'term adapted into Western esoteric synthesis',
    relationshipKind: 'term inheritance',
    confidence: 'medium',
    sourceIds: ['blavatsky-secret-doctrine', 'britannica-akasha-jainism'],
    auditNote: 'Use this as a term-history bridge, not as evidence that South Asian akasha equals Western Akashic Records.',
  },
  {
    from: 'theosophy',
    to: 'anthroposophy',
    label: 'conceptual inheritance and reinterpretation',
    relationshipKind: 'reinterpretation',
    confidence: 'high',
    sourceIds: ['blavatsky-secret-doctrine', 'steiner-akashic-record'],
    auditNote: 'Strong as intellectual lineage; compare exact doctrinal claims before asserting continuity.',
  },
  {
    from: 'anthroposophy',
    to: 'cayce',
    label: 'parallel modern spiritual record-access motif',
    relationshipKind: 'parallel concept',
    confidence: 'low',
    sourceIds: ['steiner-akashic-record', 'cayce-readings', 'are-akashic-records'],
    auditNote: 'Do not imply direct influence without a sourced historical bridge.',
  },
  {
    from: 'jung',
    to: 'information-field',
    label: 'psychological analogy used in later theory building',
    relationshipKind: 'reinterpretation',
    confidence: 'medium',
    sourceIds: ['jung-collective-unconscious'],
    auditNote: 'Keep psychological analogy separate from metaphysical or literal archive claims.',
  },
  {
    from: 'cayce',
    to: 'information-field',
    label: 'modern spiritual testimony recast as information metaphor',
    relationshipKind: 'reinterpretation',
    confidence: 'medium',
    sourceIds: ['are-akashic-records', 'cayce-personal-growth'],
    auditNote: 'Useful for modern reception history; mark database/field language as metaphor unless the source says otherwise.',
  },
  {
    from: 'theosophy',
    to: 'sinnett',
    label: 'popularization through English-language Theosophical publishing',
    relationshipKind: 'doctrinal influence',
    confidence: 'medium',
    sourceIds: ['sinnett-esoteric-buddhism'],
    auditNote: 'Sinnett is a movement popularizer; verify exact akasha wording against the text before quoting.',
  },
  {
    from: 'sinnett',
    to: 'leadbeater-besant',
    label: 'movement vocabulary expanded into clairvoyant histories',
    relationshipKind: 'doctrinal influence',
    confidence: 'medium',
    sourceIds: ['sinnett-esoteric-buddhism', 'leadbeater-akashic-records', 'besant-leadbeater-man'],
    auditNote: 'A plausible movement-internal development; document each claim at the source level.',
  },
  {
    from: 'leadbeater-besant',
    to: 'anthroposophy',
    label: 'parallel occult-historical record access claims',
    relationshipKind: 'disputed link',
    confidence: 'low',
    sourceIds: ['leadbeater-akashic-records', 'besant-leadbeater-man', 'steiner-akashic-record'],
    auditNote: 'Treat as comparison, not established dependence, unless direct citations are found.',
  },
  {
    from: 'book-of-life',
    to: 'cayce',
    label: 'religious motif used in Cayce movement explanations',
    relationshipKind: 'parallel concept',
    confidence: 'medium',
    sourceIds: ['are-akashic-records'],
    auditNote: 'Map as a comparative motif and preserve the theological distinction from Akashic terminology.',
  },
  {
    from: 'new-thought',
    to: 'cayce',
    label: 'shared modern metaphysical publishing environment',
    relationshipKind: 'disputed link',
    confidence: 'low',
    sourceIds: ['aquarian-gospel', 'cayce-readings'],
    auditNote: 'Contextual association only; avoid direct influence claims without stronger documentation.',
  },
];

const additionFrameworks: AdditionFramework[] = [
  {
    id: 'symbolic-memory',
    name: 'Symbolic universal memory',
    description: 'Treats the Akashic Records as a symbol for cultural memory and accumulated moral imagination.',
    requiredBoundaries: ['Mark as interpretive', 'Avoid empirical claims', 'Cite source traditions being compared'],
    evidenceGrade: 'C',
    recommendedSourceIds: ['sinnett-esoteric-buddhism', 'blavatsky-secret-doctrine', 'steiner-akashic-record'],
    disallowedClaims: [
      'Do not claim symbolic memory proves literal Akashic access.',
      'Do not collapse distinct traditions into a single universal doctrine.',
      'Do not cite later interpretations as evidence for earlier source intent.',
    ],
    outputTemplate:
      'Frame the addition as a comparative interpretation. Identify the traditions being compared, cite the textual basis for each comparison, and state where the comparison stops.',
    reviewPriority: 'medium',
  },
  {
    id: 'consciousness-archive',
    name: 'Consciousness archive metaphor',
    description: 'Frames record language as a metaphor for how minds organize memory, meaning, and identity.',
    requiredBoundaries: ['Mark as metaphor', 'Separate psychology from metaphysics', 'Avoid claims of literal access'],
    evidenceGrade: 'E',
    recommendedSourceIds: ['leadbeater-akashic-records', 'cayce-readings', 'jung-collective-unconscious'],
    disallowedClaims: [
      'Do not present psychological metaphor as clinical or neuroscientific fact.',
      'Do not imply private readings are independently verified memories.',
      'Do not convert experiential claims into historical evidence.',
    ],
    outputTemplate:
      'Frame the addition as a metaphorical model. Separate source claims, psychological interpretation, and unresolved questions before suggesting any application.',
    reviewPriority: 'high',
  },
  {
    id: 'information-persistence',
    name: 'Information persistence framework',
    description: 'Speculates about persistence of information as a mythic or philosophical lens, not a proven field.',
    requiredBoundaries: ['Mark as speculative', 'Do not cite physics as proof', 'Require explicit uncertainty language'],
    evidenceGrade: 'E',
    recommendedSourceIds: ['steiner-akashic-record', 'jung-collective-unconscious', 'britannica-akashic-record'],
    disallowedClaims: [
      'Do not cite physics, quantum theory, or information theory as proof of Akashic Records.',
      'Do not state that a universal information field has been empirically established.',
      'Do not recommend belief or practice from the speculation alone.',
    ],
    outputTemplate:
      'Frame the addition as philosophical speculation. Use uncertainty language, list counterarguments, and state exactly what evidence would be needed to strengthen the claim.',
    reviewPriority: 'high',
  },
];

const people: ResearchPerson[] = [
  {
    id: 'hp-blavatsky',
    name: 'H. P. Blavatsky',
    lifespan: '1831-1891',
    role: 'Theosophical author and co-founder of the Theosophical Society',
    movementIds: ['theosophy'],
    sourceIds: ['blavatsky-secret-doctrine'],
    summary: 'Key figure in Western esoteric adaptation of akasha and occult cosmology.',
  },
  {
    id: 'ap-sinnett',
    name: 'A. P. Sinnett',
    lifespan: '1840-1921',
    role: 'Theosophical author',
    movementIds: ['theosophy'],
    sourceIds: ['sinnett-esoteric-buddhism'],
    summary: 'Popularized Theosophical esoteric cosmology for late nineteenth-century English readers.',
  },
  {
    id: 'henry-olcott',
    name: 'Henry S. Olcott',
    lifespan: '1832-1907',
    role: 'Theosophical organizer and Buddhist revivalist',
    movementIds: ['theosophy'],
    sourceIds: ['olcott-buddhist-catechism'],
    summary: 'Important comparative-religion figure around Theosophy and Buddhist catechetical literature.',
  },
  {
    id: 'annie-besant',
    name: 'Annie Besant',
    lifespan: '1847-1933',
    role: 'Theosophical leader and writer',
    movementIds: ['theosophy'],
    sourceIds: ['besant-leadbeater-man'],
    summary: 'Co-authored clairvoyant-history material that belongs in the primary esoteric corpus.',
  },
  {
    id: 'cw-leadbeater',
    name: 'C. W. Leadbeater',
    lifespan: '1854-1934',
    role: 'Theosophical writer on clairvoyance and subtle planes',
    movementIds: ['theosophy'],
    sourceIds: ['leadbeater-akashic-records', 'besant-leadbeater-man'],
    summary: 'Developed detailed descriptions of Akashic-record perception in Theosophical terms.',
  },
  {
    id: 'rudolf-steiner',
    name: 'Rudolf Steiner',
    lifespan: '1861-1925',
    role: 'Anthroposophical founder and lecturer',
    movementIds: ['anthroposophy'],
    sourceIds: ['steiner-akashic-record'],
    summary: 'Used Akashic Chronicle language for spiritual-scientific accounts of prehistory and cosmology.',
  },
  {
    id: 'edgar-cayce',
    name: 'Edgar Cayce',
    lifespan: '1877-1945',
    role: 'Modern spiritual reading figure',
    movementIds: ['cayce-movement'],
    sourceIds: ['cayce-readings', 'are-akashic-records', 'cayce-personal-growth'],
    summary: 'Associated Akashic Records with readings, soul history, and Book of Life language.',
  },
  {
    id: 'levi-dowling',
    name: 'Levi H. Dowling',
    lifespan: '1844-1911',
    role: 'New Thought era author',
    movementIds: ['new-thought'],
    sourceIds: ['aquarian-gospel'],
    summary: 'Published a text framed as received from Akashic Records.',
  },
  {
    id: 'cg-jung',
    name: 'C. G. Jung',
    lifespan: '1875-1961',
    role: 'Psychiatrist and depth psychologist',
    movementIds: ['analytical-psychology'],
    sourceIds: ['jung-collective-unconscious'],
    summary: 'Provides a psychological analogue sometimes compared to universal-memory ideas.',
  },
];

const movements: ResearchMovement[] = [
  {
    id: 'theosophy',
    name: 'Theosophy',
    period: '1875 onward',
    classification: 'primary esoteric',
    summary: 'Western esoteric movement central to the transmission and elaboration of akasha-related concepts.',
    sourceIds: ['blavatsky-secret-doctrine', 'sinnett-esoteric-buddhism', 'leadbeater-akashic-records'],
  },
  {
    id: 'anthroposophy',
    name: 'Anthroposophy',
    period: 'Early 20th century onward',
    classification: 'primary esoteric',
    summary: 'Steiner movement that developed Akashic Chronicle language as spiritual research.',
    sourceIds: ['steiner-akashic-record'],
  },
  {
    id: 'cayce-movement',
    name: 'Edgar Cayce movement',
    period: '20th century onward',
    classification: 'modern spiritual',
    summary: 'Modern spiritual archive and community around Cayce readings and Akashic Records interpretations.',
    sourceIds: ['cayce-readings', 'are-akashic-records'],
  },
  {
    id: 'new-thought',
    name: 'New Thought and metaphysical publishing',
    period: 'Late 19th to early 20th century',
    classification: 'modern spiritual',
    summary: 'Context for texts claiming access to hidden spiritual records or higher-plane revelation.',
    sourceIds: ['aquarian-gospel'],
  },
  {
    id: 'analytical-psychology',
    name: 'Analytical psychology',
    period: '20th century',
    classification: 'academic',
    summary: 'Comparative psychological framework used cautiously as an analogue, not as Akashic doctrine.',
    sourceIds: ['jung-collective-unconscious'],
  },
];

const terms: ResearchTerm[] = [
  {
    id: 'akasha-term',
    term: 'Akasha',
    aliases: ['akasa', 'akasha tattva', 'ether', 'space'],
    tradition: 'South Asian religious and philosophical contexts',
    definition: 'A term often translated as space, ether, or subtle element depending on tradition and period.',
    caution: 'Do not collapse South Asian akasha into Western Akashic Records doctrine.',
    sourceIds: ['britannica-akasha-jainism', 'akasha-wikipedia'],
  },
  {
    id: 'akashic-records-term',
    term: 'Akashic Records',
    aliases: ['akashic record', 'records of akasha', 'cosmic records'],
    tradition: 'Western esoteric and modern spiritual usage',
    definition: 'A claimed occult or spiritual record of events, actions, thoughts, or soul histories.',
    caution: 'Treat access claims as doctrine or testimony unless independently corroborated.',
    sourceIds: ['britannica-akashic-record', 'encyclopedia-akashic-records', 'theosophy-wiki-akashic-records'],
  },
  {
    id: 'akashic-chronicle-term',
    term: 'Akashic Chronicle',
    aliases: ['Akasha Chronicle', 'From the Akashic Record'],
    tradition: 'Anthroposophy',
    definition: 'Steiner-related language for spiritual-historical accounts presented as Akashic research.',
    caution: 'Separate Steiner source claims from conventional history.',
    sourceIds: ['steiner-akashic-record'],
  },
  {
    id: 'cosmic-memory-term',
    term: 'Cosmic Memory',
    aliases: ['cosmic memory', 'prehistory of earth and man'],
    tradition: 'Anthroposophy',
    definition: 'English title associated with Steiner material on Akashic-record prehistory.',
    caution: 'Use as publication/source title and doctrinal claim, not as evidence of literal access.',
    sourceIds: ['steiner-akashic-record'],
  },
  {
    id: 'book-of-life-term',
    term: 'Book of Life',
    aliases: ['God\'s book of remembrance', 'soul record'],
    tradition: 'Biblical motif and Cayce movement interpretation',
    definition: 'Religious motif used comparatively in Cayce-related explanations of soul records.',
    caution: 'Mark comparisons as interpretive unless a source explicitly makes the link.',
    sourceIds: ['are-akashic-records'],
  },
  {
    id: 'collective-unconscious-term',
    term: 'Collective unconscious',
    aliases: ['archetypal unconscious', 'archetypes'],
    tradition: 'Analytical psychology',
    definition: 'Jungian psychological model sometimes compared to universal-memory concepts.',
    caution: 'It is an analogue, not the same doctrine as Akashic Records.',
    sourceIds: ['jung-collective-unconscious'],
  },
];

const comparativeConcepts: ComparativeConcept[] = [
  {
    id: 'astral-light',
    concept: 'Astral light',
    tradition: 'Western esoteric and Theosophical vocabulary',
    relationshipToAkashicResearch: 'influence',
    summary:
      'A subtle-medium concept often adjacent to explanations of occult perception, memory, and hidden records in esoteric literature.',
    boundaryNote:
      'Do not treat astral light and Akashic Records as interchangeable unless a source explicitly equates them.',
    confidenceLevel: 'medium',
    sourceIds: ['blavatsky-secret-doctrine', 'leadbeater-akashic-records'],
  },
  {
    id: 'karma',
    concept: 'Karma',
    tradition: 'South Asian religious traditions and Western esoteric reinterpretation',
    relationshipToAkashicResearch: 'influence',
    summary:
      'Karma is often paired with record or soul-history language in modern spiritual interpretations, especially around accountability and life review.',
    boundaryNote:
      'Distinguish classical karma doctrines from Western occult record-keeping metaphors.',
    confidenceLevel: 'medium',
    sourceIds: ['britannica-akasha-jainism', 'are-akashic-records'],
  },
  {
    id: 'memory-of-nature',
    concept: 'Memory of nature',
    tradition: 'Esoteric and occult philosophy',
    relationshipToAkashicResearch: 'analogue',
    summary:
      'A broad occult motif that treats nature or subtle reality as retaining traces of events or consciousness.',
    boundaryNote:
      'Use as a motif-level analogue unless tied to a named primary source.',
    confidenceLevel: 'low',
    sourceIds: ['theosophy-wiki-akashic-records'],
  },
  {
    id: 'morphic-resonance',
    concept: 'Morphic resonance',
    tradition: 'Modern speculative theory',
    relationshipToAkashicResearch: 'speculative comparison',
    summary:
      'A modern hypothesis sometimes compared with field-memory ideas because it uses memory-like language at biological or collective scales.',
    boundaryNote:
      'Mark comparisons as speculative; do not cite morphic resonance as proof of Akashic Records.',
    confidenceLevel: 'low',
    sourceIds: ['akashic-records-wikipedia'],
  },
  {
    id: 'noosphere',
    concept: 'Noosphere',
    tradition: 'Philosophy, theology, and systems thought',
    relationshipToAkashicResearch: 'analogue',
    summary:
      'A concept of a sphere of human thought that can be compared cautiously with collective-information imagery.',
    boundaryNote:
      'Noosphere is not an Akashic Records doctrine; keep comparisons conceptual and historically bounded.',
    confidenceLevel: 'low',
    sourceIds: ['akashic-records-wikipedia'],
  },
  {
    id: 'collective-memory',
    concept: 'Collective memory',
    tradition: 'Sociology and cultural history',
    relationshipToAkashicResearch: 'contrast',
    summary:
      'A social and cultural model for how groups remember, transmit, and reshape the past.',
    boundaryNote:
      'Collective memory is sociological, not metaphysical; use it to clarify cultural transmission rather than hidden records.',
    confidenceLevel: 'medium',
    sourceIds: ['jung-collective-unconscious'],
  },
  {
    id: 'collective-unconscious-comparison',
    concept: 'Collective unconscious',
    tradition: 'Analytical psychology',
    relationshipToAkashicResearch: 'analogue',
    summary:
      'A psychological framework sometimes used as an analogue for transpersonal symbolic patterns.',
    boundaryNote:
      'Jungian theory is not equivalent to Akashic Records doctrine and should not be cited as validation.',
    confidenceLevel: 'medium',
    sourceIds: ['jung-collective-unconscious'],
  },
  {
    id: 'book-of-life-comparison',
    concept: 'Book of Life',
    tradition: 'Biblical and modern spiritual interpretation',
    relationshipToAkashicResearch: 'analogue',
    summary:
      'A religious record motif used in Cayce-related explanations and broader comparisons with soul-history ideas.',
    boundaryNote:
      'Mark as comparative unless a source explicitly frames it as Akashic Records language.',
    confidenceLevel: 'medium',
    sourceIds: ['are-akashic-records'],
  },
  {
    id: 'information-field',
    concept: 'Information field',
    tradition: 'Modern metaphysical and speculative vocabulary',
    relationshipToAkashicResearch: 'speculative comparison',
    summary:
      'A contemporary metaphor that reframes Akashic Records as a field or database-like persistence of information.',
    boundaryNote:
      'Treat as speculative metaphor, not physics or empirical evidence.',
    confidenceLevel: 'medium',
    sourceIds: ['akashic-records-wikipedia', 'cayce-personal-growth'],
  },
];

const timeline: TimelineEvent[] = [
  {
    id: 'event-1881-olcott',
    date: '1881',
    title: 'Olcott publishes The Buddhist Catechism',
    summary: 'Theosophical-era comparative religious publishing helps shape the environment around later esoteric vocabulary.',
    entityIds: ['henry-olcott', 'theosophy'],
    sourceIds: ['olcott-buddhist-catechism'],
    confidenceLevel: 'high',
  },
  {
    id: 'event-1883-sinnett',
    date: '1883',
    title: 'Sinnett publishes Esoteric Buddhism',
    summary: 'A major English-language Theosophical text popularizes esoteric cosmology and related terminology.',
    entityIds: ['ap-sinnett', 'theosophy'],
    sourceIds: ['sinnett-esoteric-buddhism'],
    confidenceLevel: 'high',
  },
  {
    id: 'event-1888-secret-doctrine',
    date: '1888',
    title: 'Blavatsky publishes The Secret Doctrine',
    summary: 'Akasha becomes part of a broad Western esoteric cosmological synthesis.',
    entityIds: ['hp-blavatsky', 'theosophy'],
    sourceIds: ['blavatsky-secret-doctrine'],
    confidenceLevel: 'high',
  },
  {
    id: 'event-1904-1908-steiner',
    date: '1904-1908',
    title: 'Steiner publishes Akashic Chronicle writings',
    summary: 'Steiner presents spiritual-historical accounts through Akashic-record language.',
    entityIds: ['rudolf-steiner', 'anthroposophy'],
    sourceIds: ['steiner-akashic-record'],
    confidenceLevel: 'high',
  },
  {
    id: 'event-1908-aquarian',
    date: '1908',
    title: 'The Aquarian Gospel appears',
    summary: 'A New Thought era text is framed as material received from Akashic Records.',
    entityIds: ['levi-dowling', 'new-thought'],
    sourceIds: ['aquarian-gospel'],
    confidenceLevel: 'high',
  },
  {
    id: 'event-1913-besant-leadbeater',
    date: '1913',
    title: 'Besant and Leadbeater publish clairvoyant prehistory',
    summary: 'Theosophical clairvoyant investigation is applied to human origins and hidden history.',
    entityIds: ['annie-besant', 'cw-leadbeater', 'theosophy'],
    sourceIds: ['besant-leadbeater-man'],
    confidenceLevel: 'high',
  },
  {
    id: 'event-cayce-20th',
    date: '20th century',
    title: 'Cayce readings popularize Book of Life / Akashic framing',
    summary: 'Cayce-related materials connect readings, soul history, and Akashic Records language.',
    entityIds: ['edgar-cayce', 'cayce-movement'],
    sourceIds: ['cayce-readings', 'are-akashic-records'],
    confidenceLevel: 'medium',
  },
  {
    id: 'event-modern-commercialization',
    date: 'Late 20th-21st century',
    title: 'Akashic Records become a modern spiritual service category',
    summary: 'Coaching, readings, and self-development contexts expand the term beyond historical esoteric literature.',
    entityIds: ['cayce-movement', 'new-thought'],
    sourceIds: ['cayce-personal-growth'],
    confidenceLevel: 'medium',
  },
];

const bibliography: BibliographicRecord[] = sources.map((source) => ({
  id: `bib-${source.id}`,
  sourceId: source.id,
  title: source.title,
  author: source.author,
  publicationDate: source.date,
  editionNotes: inferEditionNotes(source),
  publisher: inferPublisher(source.url, source.author),
  archiveUrl: source.url,
  rightsStatus: source.url.includes('archive.org') || Number.parseInt(source.date, 10) < 1929 ? 'public domain' : 'unknown',
  sourceClassification: source.sourceType,
  citationStatus: inferCitationStatus(source),
  accessType: inferAccessType(source.url),
  reviewStatus: inferReviewStatus(source),
  stableCitation: `${source.author}. ${source.title}. ${source.date}. ${source.url}`,
  pageReference: inferPageReference(source),
  auditNote: inferAuditNote(source),
}));

function inferEditionNotes(source: Source): string {
  if (source.date === 'reference article' || source.date === 'reference entry' || source.date === 'modern archive page') {
    return 'Online reference entry; archive date and revision history should be captured during citation review';
  }

  if (source.url.includes('archive.org')) {
    return 'Digitized scan available; edition, imprint, and page images should be verified against the scan';
  }

  if (source.url.includes('rsarchive.org')) {
    return 'Online archive transcription; verify against the cited GA edition when page-level citation is required';
  }

  return 'Edition details require review';
}

function inferPublisher(url: string, author: string): string {
  if (url.includes('archive.org')) {
    return 'Internet Archive scan';
  }

  if (url.includes('britannica.com')) {
    return 'Encyclopaedia Britannica';
  }

  if (url.includes('encyclopedia.com')) {
    return 'Encyclopedia.com';
  }

  if (url.includes('rsarchive.org')) {
    return 'Rudolf Steiner Archive';
  }

  if (url.includes('edgarcayce.org')) {
    return 'Edgar Cayce A.R.E.';
  }

  if (url.includes('wikipedia.org')) {
    return 'Wikipedia';
  }

  return author;
}

function inferAccessType(url: string): BibliographicRecord['accessType'] {
  if (url.includes('archive.org') || url.endsWith('.pdf') || url.includes('/Books/')) {
    return 'full text';
  }

  if (url.includes('edgarcayce.org') || url.includes('theosophy.wiki')) {
    return 'movement page';
  }

  return 'catalog/reference';
}

function inferCitationStatus(source: Source): BibliographicRecord['citationStatus'] {
  if (source.url.includes('archive.org') && Number.parseInt(source.date, 10) < 1929) {
    return 'partial';
  }

  if (source.date === 'reference entry' || source.date === 'reference article' || source.date === 'modern archive page') {
    return 'needs review';
  }

  return 'partial';
}

function inferReviewStatus(source: Source): BibliographicRecord['reviewStatus'] {
  if (source.confidenceLevel === 'low') {
    return 'lead only';
  }

  if (source.url.includes('archive.org') || Number.parseInt(source.date, 10) < 1929) {
    return 'needs page review';
  }

  return 'reviewed';
}

function inferPageReference(source: Source): string {
  if (source.url.includes('rsarchive.org')) {
    return 'chapter/section reference pending against GA source';
  }

  if (source.url.includes('archive.org') || source.url.endsWith('.pdf')) {
    return 'page image reference pending review';
  }

  return 'page/chapter reference pending review';
}

function inferAuditNote(source: Source): string {
  if (source.confidenceLevel === 'low') {
    return 'Lead source only; replace with stronger primary, academic, or archive citation before treating as authority.';
  }

  if (source.sourceType === 'primary esoteric' || source.sourceType === 'modern spiritual') {
    return 'Primary for documenting the claim made by the movement or author; not proof of metaphysical truth.';
  }

  if (source.sourceType === 'religious/comparative') {
    return 'Use for term-history and comparison; do not collapse South Asian akasha into Western occult record claims.';
  }

  return 'Secondary context source; verify specific historical claims against primary records where possible.';
}

export const researchDataset = {
  sources,
  claims,
  genealogy: { nodes, edges },
  index: { people, movements, terms, comparativeConcepts, timeline, bibliography },
  additionFrameworks,
};
