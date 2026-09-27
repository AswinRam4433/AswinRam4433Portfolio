/* ── Bookshelf: fetch entries from Hugo's ShelfIndex output ──
   Feed is generated at build time from blogs/content/bookshelf/*.md
   by blogs/layouts/bookshelf/list.shelfindex.json → /blogs/bookshelf/index.json
*/

const shelfGrid = document.getElementById('shelf-grid');
const shelfFilterbar = document.getElementById('shelf-filterbar');
const shelfFilters = document.getElementById('shelf-filters');
const shelfCount = document.getElementById('shelf-count');

const MEDIUM_LABELS = { book: 'Book', paper: 'Paper', article: 'Article' };
const MEDIUM_ORDER = ['book', 'paper', 'article'];
const STATUS_LABELS = { read: 'Read', reading: 'Reading', queued: 'Queued' };

let shelfEntries = [];
let activeMedium = 'all';

const shelfRevealObserver = new IntersectionObserver(
  entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        shelfRevealObserver.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.08, rootMargin: '0px 0px -40px 0px' }
);

/* Unknown/missing medium falls back to "book" so a typo in front matter
   drops the card into the default bucket instead of dropping it entirely. */
function normalizeMedium(medium) {
  return MEDIUM_LABELS[medium] ? medium : 'book';
}

function formatDate(isoDate) {
  return new Intl.DateTimeFormat('en-US', { month: 'short', year: 'numeric' }).format(
    new Date(isoDate)
  );
}

function buildCard(entry) {
  const medium = normalizeMedium(entry.medium);

  const card = document.createElement('article');
  card.className = 'shelf-card reveal';
  card.dataset.medium = medium;

  /* Head — medium · year on the left, rating dots on the right */
  const head = document.createElement('div');
  head.className = 'shelf-card-head';

  const kind = document.createElement('span');
  kind.className = 'shelf-medium';
  const label = MEDIUM_LABELS[medium];
  kind.textContent = entry.year ? `${label} · ${entry.year}` : label;
  head.appendChild(kind);

  if (entry.rating > 0) {
    const rating = document.createElement('span');
    rating.className = 'shelf-rating';
    rating.setAttribute('aria-label', `Rated ${entry.rating} out of 5`);
    for (let i = 1; i <= 5; i++) {
      const dot = document.createElement('span');
      if (i <= entry.rating) dot.className = 'on';
      rating.appendChild(dot);
    }
    head.appendChild(rating);
  }

  const title = document.createElement('h2');
  title.className = 'shelf-title';
  const link = document.createElement('a');
  link.href = entry.permalink;
  link.textContent = entry.title;
  title.appendChild(link);

  card.append(head, title);

  if (entry.author) {
    const author = document.createElement('p');
    author.className = 'shelf-author';
    author.textContent = entry.author;
    card.appendChild(author);
  }

  if (entry.summary) {
    const summary = document.createElement('p');
    summary.className = 'shelf-summary';
    summary.textContent = entry.summary;
    card.appendChild(summary);
  }

  /* Foot — status (only when unfinished), tags, reading time */
  const foot = document.createElement('div');
  foot.className = 'shelf-foot';

  const status = STATUS_LABELS[entry.status] ? entry.status : 'read';
  if (status !== 'read') {
    const pill = document.createElement('span');
    pill.className = `shelf-status shelf-status--${status}`;
    pill.textContent = STATUS_LABELS[status];
    foot.appendChild(pill);
  }

  (entry.tags || []).forEach(tag => {
    const tagEl = document.createElement('span');
    tagEl.className = 'blog-tag';
    tagEl.textContent = tag;
    foot.appendChild(tagEl);
  });

  const readTime = document.createElement('span');
  readTime.className = 'read-time';
  readTime.textContent = entry.readingTime
    ? `${entry.readingTime} min read · ${formatDate(entry.date)}`
    : formatDate(entry.date);
  foot.appendChild(readTime);

  card.appendChild(foot);

  return card;
}

function renderEmpty(message) {
  shelfGrid.innerHTML = '';
  const empty = document.createElement('p');
  empty.className = 'shelf-empty';
  empty.textContent = message;
  shelfGrid.appendChild(empty);
}

function renderShelf() {
  const visible =
    activeMedium === 'all'
      ? shelfEntries
      : shelfEntries.filter(e => normalizeMedium(e.medium) === activeMedium);

  if (!visible.length) {
    renderEmpty('Nothing on this shelf yet.');
    return;
  }

  shelfGrid.innerHTML = '';
  visible.forEach(entry => {
    const card = buildCard(entry);
    shelfGrid.appendChild(card);
    shelfRevealObserver.observe(card);
  });

  if (shelfCount) {
    shelfCount.textContent =
      visible.length === shelfEntries.length
        ? `${visible.length} ${visible.length === 1 ? 'entry' : 'entries'}`
        : `${visible.length} of ${shelfEntries.length}`;
  }
}

/* Filters are built from the feed, so a medium with no entries never
   gets a chip, and a one-medium shelf skips the bar entirely. */
function buildFilters() {
  const present = MEDIUM_ORDER.filter(medium =>
    shelfEntries.some(e => normalizeMedium(e.medium) === medium)
  );

  if (present.length < 2) {
    shelfFilterbar.hidden = true;
    return;
  }

  shelfFilterbar.hidden = false;
  shelfFilters.innerHTML = '';

  const options = [{ key: 'all', label: 'All' }].concat(
    present.map(medium => ({ key: medium, label: `${MEDIUM_LABELS[medium]}s` }))
  );

  options.forEach(option => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'shelf-filter' + (option.key === activeMedium ? ' is-active' : '');
    button.dataset.filter = option.key;
    button.textContent = option.label;
    button.addEventListener('click', () => {
      activeMedium = option.key;
      shelfFilters.querySelectorAll('.shelf-filter').forEach(other => {
        other.classList.toggle('is-active', other.dataset.filter === activeMedium);
      });
      renderShelf();
    });
    shelfFilters.appendChild(button);
  });
}

if (shelfGrid) {
  fetch('/blogs/bookshelf/index.json')
    .then(response => {
      if (!response.ok) throw new Error(`Shelf feed: ${response.status}`);
      return response.json();
    })
    .then(entries => {
      shelfEntries = entries.sort((a, b) => new Date(b.date) - new Date(a.date));

      if (!shelfEntries.length) {
        renderEmpty('The shelf is empty for now — notes coming soon.');
        return;
      }

      buildFilters();
      renderShelf();
    })
    .catch(() => renderEmpty('The shelf is empty for now — notes coming soon.'));
}
