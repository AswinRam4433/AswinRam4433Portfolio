/* ── Home page: Projects (from data/projects.json) and Latest writing
   (from the Hugo posts feed). Everything is built with DOM APIs and
   textContent, so nothing in the JSON is ever parsed as HTML. ── */

// Wrapped in a function: classic scripts share one global scope, and main.js
// already declares `revealObserver`.
(() => {
const revealObserver = new IntersectionObserver(
  entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        revealObserver.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.08, rootMargin: '0px 0px -40px 0px' }
);

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

// "*word*" renders as <em>word</em>.
function withEmphasis(parent, text) {
  text.split('*').forEach((part, i) => {
    if (!part) return;
    parent.appendChild(i % 2 ? el('em', '', part) : document.createTextNode(part));
  });
}

function message(container, text) {
  container.appendChild(el('p', 'home-empty', text));
}

/* ── Projects ── */

// Where a card's arrow goes: live URL for active projects; for past ones the
// blog post if there is one, else the repo, else the paper.
function projectTarget(p) {
  if (p.status === 'active') {
    return p.live ? { href: p.live, label: 'Open live project', external: true } : null;
  }
  if (p.post) return { href: p.post, label: 'Read the blog post', external: false };
  if (p.repo) return { href: p.repo, label: 'View on GitHub', external: true };
  if (p.paper) return { href: p.paper, label: 'Read the paper', external: true };
  return null;
}

function renderProject(p) {
  const card = el('div', 'project-card reveal');

  const header = el('div', 'project-card-header');
  header.appendChild(el('h3', '', p.name));
  const target = projectTarget(p);
  if (target) {
    const a = el('a', 'project-link', '↗');
    a.href = target.href;
    a.setAttribute('aria-label', `${p.name}: ${target.label}`);
    a.title = target.label;
    if (target.external) {
      a.target = '_blank';
      a.rel = 'noopener';
    }
    header.appendChild(a);
  }
  card.appendChild(header);

  const body = el('p');
  withEmphasis(body, p.description);
  if (p.note) {
    body.appendChild(document.createElement('br'));
    body.appendChild(document.createElement('br'));
    body.appendChild(el('i', '', p.note));
  }
  card.appendChild(body);

  const tags = el('div', 'project-tags');
  (p.tags || []).forEach(t => tags.appendChild(el('span', '', t)));
  card.appendChild(tags);

  return card;
}

function renderProjects(projects) {
  const active = document.getElementById('projects-active');
  const past = document.getElementById('projects-past');
  if (!active || !past) return;

  // An "active" project with no URL has nowhere to send people, so list it as past.
  const isActive = p => p.status === 'active' && p.live;
  const activeProjects = projects.filter(isActive);
  const pastProjects = projects.filter(p => !isActive(p)).map(p => ({ ...p, status: 'past' }));

  activeProjects.forEach(p => active.appendChild(renderProject(p)));
  pastProjects.forEach(p => past.appendChild(renderProject(p)));
  if (!activeProjects.length) {
    document.getElementById('projects-active-intro').hidden = true;
    message(active, 'Nothing is hosted right now. The past projects below have the details.');
  }
  if (!pastProjects.length) document.getElementById('projects-past-block').hidden = true;

  document.querySelectorAll('#projects .project-card').forEach(c => revealObserver.observe(c));
}

/* ── Latest writing ── */

const formatDate = iso =>
  new Intl.DateTimeFormat('en-US', { month: 'short', year: 'numeric' }).format(new Date(iso));

function renderPost(post) {
  const article = el('article', 'blog-post-item reveal');
  article.appendChild(el('div', 'blog-post-date', formatDate(post.date)));

  const body = el('div', 'blog-post-body');
  const heading = el('h2');
  const link = el('a', '', post.title);
  link.href = post.permalink;
  heading.appendChild(link);
  body.appendChild(heading);
  body.appendChild(el('p', 'blog-post-excerpt', post.summary));

  const footer = el('div', 'blog-post-footer');
  (post.tags || []).forEach(t => footer.appendChild(el('span', 'blog-tag', t)));
  footer.appendChild(el('span', 'read-time', `${post.readingTime} min read`));
  body.appendChild(footer);

  article.appendChild(body);
  return article;
}

function renderPosts(posts) {
  const list = document.getElementById('home-posts');
  if (!list) return;
  if (!posts.length) return message(list, 'Nothing published yet — check back soon.');
  posts
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 3)
    .forEach(p => {
      const node = renderPost(p);
      list.appendChild(node);
      revealObserver.observe(node);
    });
}

/* ── Load ── */

const getJSON = url =>
  fetch(url).then(r => {
    if (!r.ok) throw new Error(`${url}: ${r.status}`);
    return r.json();
  });

getJSON('data/projects.json')
  .then(d => renderProjects(d.projects))
  .catch(() => {
    const active = document.getElementById('projects-active');
    if (active) message(active, 'Projects could not be loaded. Try refreshing the page.');
  });

getJSON('/blogs/posts/index.json')
  .then(renderPosts)
  .catch(() => {
    const list = document.getElementById('home-posts');
    if (list) message(list, 'Nothing published yet — check back soon.');
  });
})();
