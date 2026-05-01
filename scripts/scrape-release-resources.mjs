import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = dirname(__dirname);
const outputPath = join(projectRoot, 'src', 'shared', 'releaseResourceCatalog.ts');
const targetResourceCount = 360;
const discoveredAt = '2026-05-01T00:00:00.000Z';

const releaseQueries = [
  {
    id: 'theosophy-core',
    name: 'Theosophy core texts',
    query: 'theosophy AND mediatype:texts',
    sourceType: 'primary esoteric',
    tags: ['theosophy', 'primary esoteric', 'occult history'],
    limit: 48,
  },
  {
    id: 'blavatsky',
    name: 'H. P. Blavatsky and Theosophical reception',
    query: 'blavatsky AND mediatype:texts',
    sourceType: 'primary esoteric',
    tags: ['blavatsky', 'theosophy', 'term lineage'],
    limit: 34,
  },
  {
    id: 'leadbeater-besant',
    name: 'Leadbeater, Besant, and clairvoyant histories',
    query: '(leadbeater OR besant) AND theosophy AND mediatype:texts',
    sourceType: 'primary esoteric',
    tags: ['leadbeater', 'besant', 'clairvoyance'],
    limit: 36,
  },
  {
    id: 'sinnett-esoteric-buddhism',
    name: 'A. P. Sinnett and early Theosophical cosmology',
    query: 'sinnett AND "esoteric buddhism" AND mediatype:texts',
    sourceType: 'primary esoteric',
    tags: ['sinnett', 'esoteric buddhism', 'theosophy'],
    limit: 24,
  },
  {
    id: 'anthroposophy',
    name: 'Anthroposophy and Steiner archives',
    query: 'anthroposophy AND mediatype:texts',
    sourceType: 'primary esoteric',
    tags: ['anthroposophy', 'steiner', 'akashic chronicle'],
    limit: 42,
  },
  {
    id: 'rudolf-steiner',
    name: 'Rudolf Steiner texts and lectures',
    query: '"Rudolf Steiner" AND mediatype:texts',
    sourceType: 'primary esoteric',
    tags: ['rudolf steiner', 'anthroposophy', 'spiritual science'],
    limit: 42,
  },
  {
    id: 'akashic-akasha',
    name: 'Akashic and akasha terminology',
    query: '(akashic OR akasha) AND mediatype:texts',
    sourceType: 'religious/comparative',
    tags: ['akasha', 'akashic records', 'terminology'],
    limit: 34,
  },
  {
    id: 'new-thought-metaphysical',
    name: 'New Thought and metaphysical publishing',
    query: '"New Thought" AND metaphysical AND mediatype:texts',
    sourceType: 'modern spiritual',
    tags: ['new thought', 'modern spiritual', 'metaphysical publishing'],
    limit: 34,
  },
  {
    id: 'edgar-cayce',
    name: 'Edgar Cayce and modern spiritual testimony',
    query: '"Edgar Cayce" AND mediatype:texts',
    sourceType: 'modern spiritual',
    tags: ['edgar cayce', 'book of life', 'modern spiritual'],
    limit: 30,
  },
  {
    id: 'spiritualism-psychical',
    name: 'Spiritualism and psychical research context',
    query: '(spiritualism OR "psychical research") AND mediatype:texts',
    sourceType: 'historical',
    tags: ['spiritualism', 'psychical research', 'historical context'],
    limit: 42,
  },
  {
    id: 'western-esotericism',
    name: 'Western esotericism and occult history',
    query: '("western esotericism" OR occultism) AND mediatype:texts',
    sourceType: 'historical',
    tags: ['western esotericism', 'occultism', 'historical context'],
    limit: 46,
  },
  {
    id: 'comparative-religion',
    name: 'Comparative religion and South Asian term context',
    query: '("comparative religion" OR "hindu philosophy" OR jainism) AND mediatype:texts',
    sourceType: 'religious/comparative',
    tags: ['comparative religion', 'hindu philosophy', 'jainism'],
    limit: 42,
  },
  {
    id: 'collective-unconscious',
    name: 'Comparative psychology analogues',
    query: '("collective unconscious" OR archetypes) AND mediatype:texts',
    sourceType: 'academic',
    tags: ['collective unconscious', 'psychology', 'analogue'],
    limit: 20,
  },
  {
    id: 'mysticism-history',
    name: 'Mysticism and religious experience scholarship',
    query: '(mysticism OR "religious experience") AND mediatype:texts',
    sourceType: 'academic',
    tags: ['mysticism', 'religious experience', 'academic context'],
    limit: 36,
  },
];

const blockedIdentifiers = new Set([
  'aquariangospelo00dowlgoog',
  'esotericbuddhism00sinn',
  'manwhencehowandw031919mbp',
]);

async function main() {
  const resources = [];
  const seenIdentifiers = new Set(blockedIdentifiers);

  for (const querySpec of releaseQueries) {
    if (resources.length >= targetResourceCount) {
      break;
    }

    const docs = await fetchInternetArchiveDocs(querySpec);
    for (const doc of docs) {
      if (resources.length >= targetResourceCount) {
        break;
      }

      const identifier = normalizeScalar(doc.identifier);
      if (!identifier || seenIdentifiers.has(identifier)) {
        continue;
      }

      const item = toReviewQueueItem(doc, querySpec, resources.length + 1);
      if (!item) {
        continue;
      }

      seenIdentifiers.add(identifier);
      resources.push(item);
    }
  }

  if (resources.length < 300) {
    throw new Error(`Release scrape produced ${resources.length} resources; expected at least 300.`);
  }

  const file = buildOutput(resources);
  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(outputPath, file, 'utf8');
  console.log(`Wrote ${resources.length} release resources to ${outputPath}`);
}

async function fetchInternetArchiveDocs(querySpec) {
  const params = new URLSearchParams();
  params.set('q', querySpec.query);
  params.set('rows', String(Math.max(querySpec.limit * 2, 60)));
  params.set('page', '1');
  params.set('output', 'json');
  for (const field of ['identifier', 'title', 'creator', 'date', 'publisher', 'description', 'subject', 'mediatype']) {
    params.append('fl[]', field);
  }
  params.append('sort[]', 'downloads desc');

  const url = `https://archive.org/advancedsearch.php?${params.toString()}`;
  const response = await fetch(url, {
    headers: {
      Accept: 'application/json',
      'User-Agent': 'AkashicResearchEngine/1.0 release-resource-scraper',
    },
  });

  if (!response.ok) {
    throw new Error(`Internet Archive returned HTTP ${response.status} for ${querySpec.id}.`);
  }

  const payload = await response.json();
  const docs = Array.isArray(payload.response?.docs) ? payload.response.docs : [];
  return docs.slice(0, querySpec.limit * 2);
}

function toReviewQueueItem(doc, querySpec, index) {
  const identifier = normalizeScalar(doc.identifier);
  const title = cleanText(normalizeScalar(doc.title));
  if (!identifier || !title || title.length < 4) {
    return null;
  }

  const url = `https://archive.org/details/${identifier}`;
  const author = cleanText(normalizeList(doc.creator).join('; ')) || undefined;
  const publicationDate = extractPublicationDate(normalizeScalar(doc.date));
  const publisher = cleanText(normalizeList(doc.publisher).join('; ')) || 'Internet Archive';
  const description = cleanText(normalizeList(doc.description).join(' '));
  const subjectTags = normalizeList(doc.subject).map((value) => cleanText(value).toLocaleLowerCase()).filter(Boolean);
  const citationStatus = getCitationStatus({ title, author, publicationDate, publisher });
  const catalogTags = unique([...querySpec.tags, ...subjectTags.slice(0, 4)]).slice(0, 8);
  const stableCitation = buildStableCitation({ author, title, publicationDate, publisher, url });
  const summary = description
    ? truncate(description, 420)
    : `Internet Archive text catalogue lead for ${querySpec.name}. Review the scan or metadata before using this source for claim extraction.`;

  return {
    id: `release-${String(index).padStart(3, '0')}-${slugify(identifier)}`,
    title,
    author,
    publicationDate,
    publisher,
    url,
    domain: 'archive.org',
    proposedSourceType: querySpec.sourceType,
    summary,
    provenance: 'curated seed',
    status: 'pending',
    confidenceLevel: querySpec.sourceType === 'academic' || querySpec.sourceType === 'historical' ? 'medium' : 'medium',
    reviewPriority: getReviewPriority(querySpec.sourceType, citationStatus),
    citationStatus,
    accessType: 'full text',
    stableCitation,
    citationNotes: `${stableCitation} Metadata scraped from Internet Archive for release review; verify edition, page images, and citation boundaries before promotion.`,
    sourceCollection: querySpec.name,
    catalogTags,
    qualityFlags: unique([
      'internet archive catalogue record',
      'citation metadata scraped from public catalogue',
      citationStatus === 'complete' ? 'complete core citation metadata' : 'citation metadata needs reviewer verification',
      'page-level citations required before claim extraction',
    ]),
    requiredActions: [
      'Verify author, title, publisher, date, and edition against the item page or scan',
      'Capture page, chapter, or section references before promoting extracted claims',
      'Classify metaphysical or experiential claims as testimony, not empirical proof',
    ],
    reviewerNotes: `Release scrape query: ${querySpec.query}. Source collection: ${querySpec.name}. Stable catalogue URL: ${url}.`,
    discoveredAt,
  };
}

function getCitationStatus(input) {
  if (input.title && input.author && input.publicationDate && input.publisher) {
    return 'complete';
  }

  if (input.title && (input.author || input.publicationDate || input.publisher)) {
    return 'partial';
  }

  return 'needs review';
}

function getReviewPriority(sourceType, citationStatus) {
  if (citationStatus !== 'complete') {
    return 'high';
  }

  if (sourceType === 'primary esoteric' || sourceType === 'modern spiritual') {
    return 'medium';
  }

  return 'low';
}

function buildStableCitation(input) {
  return [
    input.author || 'Unknown author',
    input.title,
    input.publicationDate || 'publication date pending',
    input.publisher || 'publisher pending',
    `Internet Archive, ${input.url}`,
  ]
    .filter(Boolean)
    .join('. ')
    .replace(/\.+/g, '.')
    .replace(/\. Internet Archive/, '. Internet Archive');
}

function normalizeScalar(value) {
  if (Array.isArray(value)) {
    return normalizeScalar(value[0]);
  }

  if (value === undefined || value === null) {
    return '';
  }

  return String(value);
}

function normalizeList(value) {
  if (Array.isArray(value)) {
    return value.map((entry) => normalizeScalar(entry)).filter(Boolean);
  }

  const scalar = normalizeScalar(value);
  return scalar ? [scalar] : [];
}

function extractPublicationDate(value) {
  const year = /\b(1[5-9][0-9]{2}|20[0-9]{2})\b/.exec(value)?.[0];
  return year || cleanText(value) || undefined;
}

function cleanText(value) {
  return ascii(value)
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function ascii(value) {
  return String(value)
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\x20-\x7E]/g, ' ');
}

function truncate(value, length) {
  if (value.length <= length) {
    return value;
  }

  return `${value.slice(0, length - 3).replace(/\s+\S*$/, '')}...`;
}

function unique(values) {
  const seen = new Set();
  const output = [];
  for (const value of values) {
    const normalized = cleanText(value).toLocaleLowerCase();
    if (!normalized || seen.has(normalized)) {
      continue;
    }

    seen.add(normalized);
    output.push(cleanText(value));
  }

  return output;
}

function slugify(value) {
  return cleanText(value).toLocaleLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 90);
}

function buildOutput(resources) {
  return `${[
    "import type { ReviewQueueItem } from './types.js';",
    '',
    '// Generated by scripts/scrape-release-resources.mjs from public Internet Archive catalogue metadata.',
    `export const releaseResourceCatalogGeneratedAt = ${JSON.stringify(new Date().toISOString())};`,
    `export const releaseResourceMinimum = ${JSON.stringify(300)};`,
    `export const releaseResourceTarget = ${JSON.stringify(targetResourceCount)};`,
    `export const releaseResourceCount = ${JSON.stringify(resources.length)};`,
    `export const releaseResourceSeedQueries = ${JSON.stringify(
      releaseQueries.map(({ id, name, query, sourceType, tags }) => ({ id, name, query, sourceType, tags })),
      null,
      2,
    )} as const;`,
    '',
    `export const releaseReviewQueue = ${JSON.stringify(resources, null, 2)} satisfies ReviewQueueItem[];`,
    '',
  ].join('\n')}`;
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
