import { Injectable, inject } from '@angular/core';
import { Title, Meta } from '@angular/platform-browser';
import { DOCUMENT } from '@angular/common';
import { Router, NavigationEnd, ActivatedRoute } from '@angular/router';
import { filter, map } from 'rxjs/operators';

export interface SeoMetadata {
  title?: string;
  description?: string;
  keywords?: string;
  ogImage?: string;
  canonical?: string;
}

const DEFAULT_TITLE = 'ToolCNC - Hệ thống Dao cụ Cắt gọt CNC Kỹ thuật cao';
const DEFAULT_DESCRIPTION = 'Chuyên cung cấp dao phay, chip tiện, mũi khoan CNC chính hãng. Tư vấn giải pháp gia công kim loại với độ chính xác tuyệt đối.';

@Injectable({ providedIn: 'root' })
export class SeoService {
  private titleService = inject(Title);
  private meta = inject(Meta);
  private document = inject(DOCUMENT);
  private router = inject(Router);
  private activatedRoute = inject(ActivatedRoute);

  init(): void {
    // Initial update for the current route (especially if NavigationEnd already fired)
    this.updateMetadataFromRoute();

    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe(() => {
      this.updateMetadataFromRoute();
    });
  }

  private updateMetadataFromRoute(): void {
    let route = this.activatedRoute;
    while (route.firstChild) route = route.firstChild;
    const seoData = route.snapshot.data?.['seo'] as SeoMetadata | undefined;
    this.updateMeta(seoData || {});
    this.updateCanonical();
  }

  updateMeta(data: SeoMetadata): void {
    const title = data.title ? `${data.title} | ToolCNC` : DEFAULT_TITLE;
    this.titleService.setTitle(title);

    this.meta.updateTag({ name: 'description', content: data.description || DEFAULT_DESCRIPTION });

    if (data.keywords) {
      this.meta.updateTag({ name: 'keywords', content: data.keywords });
    }

    // Open Graph
    this.meta.updateTag({ property: 'og:title', content: title });
    this.meta.updateTag({ property: 'og:description', content: data.description || DEFAULT_DESCRIPTION });
    this.meta.updateTag({ property: 'og:type', content: 'website' });
    this.meta.updateTag({ property: 'og:url', content: this.document.location.href });

    if (data.ogImage) {
      this.meta.updateTag({ property: 'og:image', content: data.ogImage });
    }
  }

  setProductMeta(product: any): void {
    const title = product.name;
    const price = product.minPrice || product.price || 0;
    const description = product.description
      ? product.description.substring(0, 155) + '...'
      : `${product.name} - Chính hãng, giá tốt tại ToolCNC`;

    this.updateMeta({
      title,
      description,
      keywords: `${product.name}, ${product.brand?.name || ''}, dao cụ CNC, dụng cụ cắt gọt`,
      ogImage: product.imageUrl,
    });

    this.updateCanonical();
    this.injectProductSchema(product, price);
  }

  setCatalogMeta(keyword?: string, category?: string): void {
    const titleParts = ['Sản phẩm'];
    if (category) titleParts.push(category);
    if (keyword) titleParts.push(`"${keyword}"`);

    this.updateMeta({
      title: titleParts.join(' - '),
      description: `Tìm kiếm ${keyword || 'dao cụ CNC'} tại ToolCNC. Hàng chính hãng, giá xưởng, giao hàng nhanh 24h.`,
      keywords: `${keyword || 'dao phay'}, ${category || 'dụng cụ cắt gọt'}, CNC, ToolCNC`
    });
    this.updateCanonical();
  }

  private updateCanonical(): void {
    const url = this.document.location.origin + this.document.location.pathname;
    let link: HTMLLinkElement | null = this.document.querySelector('link[rel="canonical"]');
    if (!link) {
      link = this.document.createElement('link');
      link.setAttribute('rel', 'canonical');
      this.document.head.appendChild(link);
    }
    link.setAttribute('href', url);
  }

  private injectProductSchema(product: any, price: number): void {
    const existingScript = this.document.getElementById('product-schema');
    if (existingScript) existingScript.remove();

    const availability = (product.stock ?? product.totalStock ?? 1) > 0
      ? 'https://schema.org/InStock'
      : 'https://schema.org/OutOfStock';

    const schema = {
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: product.name,
      image: product.imageUrl,
      description: product.description || product.name,
      sku: product.sku || String(product.id),
      brand: { '@type': 'Brand', name: product.brand?.name || 'ToolCNC' },
      offers: {
        '@type': 'Offer',
        priceCurrency: 'VND',
        price: price,
        availability,
        url: this.document.location.href,
        seller: { '@type': 'Organization', name: 'ToolCNC' }
      }
    };

    const script = this.document.createElement('script');
    script.id = 'product-schema';
    script.type = 'application/ld+json';
    script.textContent = JSON.stringify(schema);
    this.document.head.appendChild(script);
  }
}
