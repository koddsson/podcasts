interface Subscription {
  url: string;
}

interface Post {
  title: string;
  description: string;
  date: Date;
  link: string;
  image: string;
}

export class RssReader {
  subscriptions: Subscription[];

  constructor({ subscriptions }: { subscriptions?: Subscription[] } = {}) {
    this.subscriptions = subscriptions || [];
  }

  async getItems() {
    const parser = new DOMParser();

    const subscriptionsXML = await this.#getSubscriptions();

    const posts = [];

    for (const { text } of subscriptionsXML) {
      const document_ = parser.parseFromString(text, "application/xml");
      for (const item of document_.querySelectorAll("item, entry")) {
        const post = this.#getPost(item);
        posts.push(post);
      }
    }

    posts.sort((a, b) => b.date - a.date);

    return posts;
  }

  #getPost(item: Element): Post {
    const title = item.querySelector("title")?.textContent || "";
    const description =
      item.querySelector("description, content")?.textContent || "";
    const date = new Date(
      item.querySelector("pubDate, updated")?.textContent || "",
    );
    const link =
      item.querySelector("link")?.textContent ||
      item.querySelector("enclosure")?.getAttribute("url") ||
      "";

    const image =
      item.querySelector("itunes:image")?.getAttribute("href") || "";

    return { title, description, date, link, image };
  }

  async #getSubscriptions() {
    const cache = JSON.parse(localStorage.getItem("cache") || "{}");
    const results = [];

    for (const sub of this.subscriptions) {
      if (cache[sub.url]) {
        const then = new Date(cache[sub.url].date).getTime();
        const now = Date.now();
        const oneHour = 60 * 60 * 1000;
        const moreThanOneHourAgo = now - then > oneHour;

        if (moreThanOneHourAgo) {
          try {
            const response = await fetch(sub.url);
            const text = await response.text();
            cache[sub.url] = { text, date: new Date() };
          } catch (error) {
            console.error(`Failed to fetch`, error);
            continue;
          }
        }
      } else {
        try {
          const response = await fetch(sub.url);
          const text = await response.text();
          cache[sub.url] = { text, date: new Date() };
        } catch (error) {
          console.error(`Failed to fetch ${sub.url}`, error);
          continue;
        }
      }

      results.push(cache[sub.url]);
    }

    localStorage.setItem("cache", JSON.stringify(cache));

    return results;
  }
}
