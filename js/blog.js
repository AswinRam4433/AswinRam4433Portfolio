/* ── Blog post list: fetch real posts from Hugo's PostIndex output ── */
const blogList = document.getElementById('blog-list');

const blogRevealObserver = new IntersectionObserver(
  entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        blogRevealObserver.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.08, rootMargin: '0px 0px -40px 0px' }
);

function formatDate(isoDate) {
  return new Intl.DateTimeFormat('en-US', { month: 'short', year: 'numeric' }).format(
    new Date(isoDate)
  );
}

function renderPost(post) {
  const article = document.createElement('article');
  article.className = 'blog-post-item reveal';

  const dateEl = document.createElement('div');
  dateEl.className = 'blog-post-date';
  dateEl.textContent = formatDate(post.date);

  const body = document.createElement('div');
  body.className = 'blog-post-body';

  const h2 = document.createElement('h2');
  const link = document.createElement('a');
  link.href = post.permalink;
  link.textContent = post.title;
  h2.appendChild(link);

  const excerpt = document.createElement('p');
  excerpt.className = 'blog-post-excerpt';
  excerpt.textContent = post.summary;

  const footer = document.createElement('div');
  footer.className = 'blog-post-footer';
  (post.tags || []).forEach(tag => {
    const tagEl = document.createElement('span');
    tagEl.className = 'blog-tag';
    tagEl.textContent = tag;
    footer.appendChild(tagEl);
  });
  const readTime = document.createElement('span');
  readTime.className = 'read-time';
  readTime.textContent = `${post.readingTime} min read`;
  footer.appendChild(readTime);

  body.append(h2, excerpt, footer);
  article.append(dateEl, body);
  blogList.appendChild(article);
  blogRevealObserver.observe(article);
}

function renderFallback(message) {
  const fallback = document.createElement('p');
  fallback.className = 'blog-post-excerpt';
  fallback.textContent = message;
  blogList.appendChild(fallback);
}

if (blogList) {
  fetch('/blogs/posts/index.json')
    .then(r => r.json())
    .then(posts => {
      if (!posts.length) {
        renderFallback('Nothing published yet — check back soon.');
        return;
      }
      posts
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .forEach(renderPost);
    })
    .catch(() => renderFallback('Nothing published yet — check back soon.'));
}
