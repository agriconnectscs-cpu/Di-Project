const apiBaseUrl = import.meta.env.VITE_API_URL?.trim();

const normalizeBaseUrl = (value) => {
  if (!value) return "";
  return value.endsWith("/") ? value.slice(0, -1) : value;
};

const baseUrl = normalizeBaseUrl(apiBaseUrl || "");

const isApiRequest = (url) => {
  if (typeof url !== "string") return false;
  return url.startsWith("/api");
};

const getRewrittenUrl = (url) => {
  if (!isApiRequest(url)) return url;
  if (!baseUrl) return url;
  return `${baseUrl}${url}`;
};

const originalFetch = window.fetch.bind(window);

window.fetch = (input, init) => {
  if (typeof input === "string") {
    return originalFetch(getRewrittenUrl(input), init);
  }

  if (input instanceof Request) {
    const requestUrl = input.url;

    if (!isApiRequest(requestUrl) || !baseUrl) {
      return originalFetch(input, init);
    }

    const url = new URL(requestUrl);
    const rewrittenUrl = `${baseUrl}${url.pathname}${url.search}${url.hash}`;
    const rewrittenRequest = new Request(rewrittenUrl, {
      method: input.method,
      headers: input.headers,
      body: input.body,
      mode: input.mode,
      credentials: input.credentials,
      cache: input.cache,
      redirect: input.redirect,
      referrer: input.referrer,
      referrerPolicy: input.referrerPolicy,
      integrity: input.integrity,
      keepalive: input.keepalive,
      signal: input.signal,
    });

    return originalFetch(rewrittenRequest, init);
  }

  return originalFetch(input, init);
};
