import type { AdditionFramework, Claim, GenealogyEdge, GenealogyNode, Source } from './types.js';

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
];

const edges: GenealogyEdge[] = [
  { from: 'akasha', to: 'theosophy', label: 'term adapted into Western esoteric synthesis', confidence: 'medium' },
  { from: 'theosophy', to: 'anthroposophy', label: 'conceptual inheritance and reinterpretation', confidence: 'high' },
  { from: 'anthroposophy', to: 'cayce', label: 'parallel modern spiritual record-access motif', confidence: 'low' },
  { from: 'jung', to: 'information-field', label: 'psychological analogy used in later theory building', confidence: 'medium' },
  { from: 'cayce', to: 'information-field', label: 'modern spiritual testimony recast as information metaphor', confidence: 'medium' },
];

const additionFrameworks: AdditionFramework[] = [
  {
    id: 'symbolic-memory',
    name: 'Symbolic universal memory',
    description: 'Treats the Akashic Records as a symbol for cultural memory and accumulated moral imagination.',
    requiredBoundaries: ['Mark as interpretive', 'Avoid empirical claims', 'Cite source traditions being compared'],
  },
  {
    id: 'consciousness-archive',
    name: 'Consciousness archive metaphor',
    description: 'Frames record language as a metaphor for how minds organize memory, meaning, and identity.',
    requiredBoundaries: ['Mark as metaphor', 'Separate psychology from metaphysics', 'Avoid claims of literal access'],
  },
  {
    id: 'information-persistence',
    name: 'Information persistence framework',
    description: 'Speculates about persistence of information as a mythic or philosophical lens, not a proven field.',
    requiredBoundaries: ['Mark as speculative', 'Do not cite physics as proof', 'Require explicit uncertainty language'],
  },
];

export const researchDataset = {
  sources,
  claims,
  genealogy: { nodes, edges },
  additionFrameworks,
};
