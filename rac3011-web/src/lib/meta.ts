import { useEffect } from 'react';

interface Meta {
  title: string;
  description?: string;
  ogImage?: string;
}

const SITE = 'Rotaract District 3011';

function setMeta(attr: 'name' | 'property', key: string, value: string | undefined): void {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);
  if (!value) {
    el?.remove();
    return;
  }
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute('content', value);
}

export function useDocumentMeta({ title, description, ogImage }: Meta): void {
  useEffect(() => {
    const full = title === SITE ? title : `${title} · ${SITE}`;
    document.title = full;
    setMeta('name', 'description', description);
    setMeta('property', 'og:title', full);
    setMeta('property', 'og:description', description);
    setMeta('property', 'og:image', ogImage);
  }, [title, description, ogImage]);
}
