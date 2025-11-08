const axios = require('axios');
const cheerio = require('cheerio');

class ScraperService {
  constructor() {
    this.timeout = 10000; // 10 seconds
    this.userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
  }

  /**
   * Scrape URL and extract content
   * @param {string} url - URL to scrape
   * @returns {Promise<Object>} Scraped content data
   */
  async scrapeURL(url) {
    console.log(`[ScraperService] Scraping URL: ${url}`);

    try {
      // Fetch the page
      const response = await axios.get(url, {
        headers: {
          'User-Agent': this.userAgent,
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5'
        },
        timeout: this.timeout,
        maxRedirects: 5
      });

      const html = response.data;
      const $ = cheerio.load(html);

      // Remove unwanted elements
      $('script, style, nav, footer, iframe, noscript').remove();

      // Detect content type
      const contentType = this._detectContentType(url, $);
      console.log(`[ScraperService] Detected content type: ${contentType}`);

      // Extract content based on type
      let result;
      switch (contentType) {
        case 'product':
          result = this._scrapeProduct(url, $);
          break;
        case 'video':
          result = this._scrapeVideo(url, $);
          break;
        case 'article':
          result = this._scrapeArticle(url, $);
          break;
        default:
          result = this._scrapeGeneric(url, $);
      }

      console.log(`[ScraperService] Successfully scraped: ${result.title}`);
      return result;

    } catch (error) {
      console.error('[ScraperService] Error scraping URL:', error.message);

      // Return fallback data
      return {
        url,
        contentType: 'bookmark',
        title: this._getDomainName(url),
        content: '',
        description: 'Failed to scrape content',
        error: error.message
      };
    }
  }

  /**
   * Detect content type from URL and page structure
   */
  _detectContentType(url, $) {
    const hostname = new URL(url).hostname.toLowerCase();
    const path = new URL(url).pathname.toLowerCase();

    // Video platforms
    if (hostname.includes('youtube.com') || hostname.includes('youtu.be')) {
      return 'video';
    }
    if (hostname.includes('vimeo.com') || hostname.includes('dailymotion.com')) {
      return 'video';
    }

    // E-commerce sites
    const ecommerceSites = ['amazon', 'ebay', 'flipkart', 'shopify', 'etsy', 'alibaba'];
    if (ecommerceSites.some(site => hostname.includes(site))) {
      return 'product';
    }

    // Check for product indicators
    const hasPrice = $('.price, [itemprop="price"], .product-price, #priceblock').length > 0;
    const hasAddToCart = $('[data-action="add-to-cart"], .add-to-cart, #add-to-cart-button').length > 0;
    if (hasPrice || hasAddToCart) {
      return 'product';
    }

    // Check for article indicators
    const hasArticle = $('article, .post, .entry, .article').length > 0;
    if (hasArticle) {
      return 'article';
    }

    // Default to article for most content pages
    return 'article';
  }

  /**
   * Scrape product page
   */
  _scrapeProduct(url, $) {
    return {
      url,
      contentType: 'product',
      title: this._extractProductTitle($),
      content: this._extractProductDescription($),
      description: this._extractMetaDescription($),
      rawData: {
        price: this._extractPrice($),
        images: this._extractImages($),
        specifications: this._extractSpecs($)
      }
    };
  }

  /**
   * Scrape video page
   */
  _scrapeVideo(url, $) {
    const videoId = this._extractVideoId(url);

    return {
      url,
      contentType: 'video',
      title: this._extractTitle($),
      content: this._extractMetaDescription($) || this._extractDescription($),
      description: this._extractMetaDescription($),
      rawData: {
        videoId,
        thumbnail: this._extractOgImage($),
        platform: this._getVideoPlatform(url),
        embedUrl: this._getEmbedUrl(url, videoId)
      }
    };
  }

  /**
   * Scrape article page
   */
  _scrapeArticle(url, $) {
    return {
      url,
      contentType: 'article',
      title: this._extractTitle($),
      content: this._extractArticleContent($),
      description: this._extractMetaDescription($),
      rawData: {
        author: this._extractAuthor($),
        publishDate: this._extractPublishDate($),
        images: this._extractImages($).slice(0, 3),
        thumbnail: this._extractOgImage($)
      }
    };
  }

  /**
   * Scrape generic page
   */
  _scrapeGeneric(url, $) {
    return {
      url,
      contentType: 'bookmark',
      title: this._extractTitle($),
      content: this._extractBodyText($),
      description: this._extractMetaDescription($),
      rawData: {
        images: this._extractImages($).slice(0, 3),
        thumbnail: this._extractOgImage($)
      }
    };
  }

  /**
   * Extraction helpers
   */

  _extractTitle($) {
    return (
      $('h1').first().text().trim() ||
      $('meta[property="og:title"]').attr('content') ||
      $('meta[name="twitter:title"]').attr('content') ||
      $('title').text().trim() ||
      'Untitled'
    );
  }

  _extractProductTitle($) {
    return (
      $('#productTitle').text().trim() ||
      $('[itemprop="name"]').first().text().trim() ||
      $('.product-title').first().text().trim() ||
      this._extractTitle($)
    );
  }

  _extractMetaDescription($) {
    return (
      $('meta[property="og:description"]').attr('content') ||
      $('meta[name="description"]').attr('content') ||
      $('meta[name="twitter:description"]').attr('content') ||
      ''
    );
  }

  _extractArticleContent($) {
    const selectors = [
      'article',
      '.post-content',
      '.entry-content',
      '.article-content',
      '.content',
      'main',
      '[role="main"]'
    ];

    for (const selector of selectors) {
      const content = $(selector).text().trim();
      if (content && content.length > 100) {
        return content.substring(0, 5000); // Limit to 5000 chars
      }
    }

    return this._extractBodyText($);
  }

  _extractProductDescription($) {
    const selectors = [
      '#productDescription',
      '[itemprop="description"]',
      '.product-description',
      '#feature-bullets'
    ];

    for (const selector of selectors) {
      const desc = $(selector).text().trim();
      if (desc) {
        return desc.substring(0, 2000);
      }
    }

    return this._extractMetaDescription($);
  }

  _extractDescription($) {
    return (
      $('meta[name="description"]').attr('content') ||
      $('meta[property="og:description"]').attr('content') ||
      ''
    );
  }

  _extractBodyText($) {
    return $('body').text().trim().substring(0, 2000);
  }

  _extractAuthor($) {
    return (
      $('[rel="author"]').text().trim() ||
      $('meta[name="author"]').attr('content') ||
      $('.author').first().text().trim() ||
      $('[itemprop="author"]').text().trim() ||
      ''
    );
  }

  _extractPublishDate($) {
    return (
      $('time').attr('datetime') ||
      $('[itemprop="datePublished"]').attr('content') ||
      $('meta[property="article:published_time"]').attr('content') ||
      ''
    );
  }

  _extractPrice($) {
    const selectors = [
      '.price',
      '[itemprop="price"]',
      '.product-price',
      '#priceblock_ourprice',
      '#priceblock_dealprice',
      '.a-price-whole',
      '.price-current'
    ];

    for (const selector of selectors) {
      const priceText = $(selector).first().text().trim();
      if (priceText) {
        // Extract numeric value
        const match = priceText.match(/[\d,]+\.?\d*/);
        if (match) {
          return parseFloat(match[0].replace(/,/g, ''));
        }
      }
    }

    return null;
  }

  _extractImages($) {
    const images = [];
    const seenUrls = new Set();

    $('img').each((i, elem) => {
      const src = $(elem).attr('src') || $(elem).attr('data-src') || $(elem).attr('data-lazy-src');

      if (src && !src.includes('data:image') && !src.includes('logo') && !src.includes('icon')) {
        // Make absolute URL
        const absoluteUrl = this._makeAbsoluteUrl(src, $('base').attr('href') || '');

        if (absoluteUrl && !seenUrls.has(absoluteUrl)) {
          seenUrls.add(absoluteUrl);
          images.push(absoluteUrl);
        }
      }
    });

    return images.slice(0, 10); // Limit to 10 images
  }

  _extractOgImage($) {
    return (
      $('meta[property="og:image"]').attr('content') ||
      $('meta[name="twitter:image"]').attr('content') ||
      null
    );
  }

  _extractSpecs($) {
    const specs = [];

    // Look for feature lists
    $('#feature-bullets li, .product-features li').each((i, elem) => {
      const spec = $(elem).text().trim();
      if (spec && spec.length < 200) {
        specs.push(spec);
      }
    });

    return specs.slice(0, 10);
  }

  _extractVideoId(url) {
    // YouTube
    let match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/);
    if (match) return match[1];

    // Vimeo
    match = url.match(/vimeo\.com\/(\d+)/);
    if (match) return match[1];

    return null;
  }

  _getVideoPlatform(url) {
    const hostname = new URL(url).hostname.toLowerCase();

    if (hostname.includes('youtube')) return 'youtube';
    if (hostname.includes('vimeo')) return 'vimeo';
    if (hostname.includes('dailymotion')) return 'dailymotion';

    return 'unknown';
  }

  _getEmbedUrl(url, videoId) {
    const platform = this._getVideoPlatform(url);

    if (platform === 'youtube' && videoId) {
      return `https://www.youtube.com/embed/${videoId}`;
    }
    if (platform === 'vimeo' && videoId) {
      return `https://player.vimeo.com/video/${videoId}`;
    }

    return null;
  }

  _makeAbsoluteUrl(url, base) {
    try {
      if (url.startsWith('http')) {
        return url;
      }
      if (url.startsWith('//')) {
        return 'https:' + url;
      }
      if (base) {
        return new URL(url, base).href;
      }
      return url;
    } catch (e) {
      return null;
    }
  }

  _getDomainName(url) {
    try {
      const hostname = new URL(url).hostname;
      return hostname.replace('www.', '');
    } catch (e) {
      return 'Website';
    }
  }
}

module.exports = new ScraperService();
