// Public product details only. Never persist expiring image URLs in a workspace.
export function createProductResolver(load, { concurrency = 4, ttl = 60_000, maxEntries = 100, now = Date.now } = {}) {
  const cache = new Map();
  const pending = new Map();
  const queue = [];
  let active = 0;
  function pump() {
    while (active < concurrency && queue.length) {
      const job = queue.shift();
      active++;
      Promise.resolve().then(() => load(job.product.slug)).then((data) => {
        const value = data?.id === job.product.id ? data : null;
        cache.set(job.key, { value, expires: now() + ttl });
        while (cache.size > maxEntries) cache.delete(cache.keys().next().value);
        job.resolve(value);
      }, job.reject).finally(() => { active--; pending.delete(job.key); pump(); });
    }
  }
  return function resolve(product) {
    const key = JSON.stringify([product.id, product.slug]);
    const cached = cache.get(key);
    if (cached?.expires > now()) return Promise.resolve(cached.value);
    if (pending.has(key)) return pending.get(key);
    const result = new Promise((resolve, reject) => queue.push({ product, key, resolve, reject }));
    pending.set(key, result);
    pump();
    return result;
  };
}
