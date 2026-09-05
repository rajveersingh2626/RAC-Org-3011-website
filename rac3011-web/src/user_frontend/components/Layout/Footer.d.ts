import type { ComponentType } from 'react';

export interface FooterProps {
  onNavigatePage?: (page: string) => void;
  isFullScreen?: boolean;
}

declare const Footer: ComponentType<FooterProps>;
export default Footer;
