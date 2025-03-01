// Type declarations for next modules

declare module 'next/link' {
  import { ComponentProps, ComponentType } from 'react';
  
  export interface LinkProps extends ComponentProps<'a'> {
    href: string;
    as?: string;
    prefetch?: boolean;
    scroll?: boolean;
    shallow?: boolean;
    passHref?: boolean;
  }
  
  const Link: ComponentType<LinkProps>;
  export default Link;
}

declare module 'next/navigation' {
  export const useRouter: () => {
    push: (url: string) => void;
    replace: (url: string) => void;
    back: () => void;
    forward: () => void;
    prefetch: (url: string) => void;
    beforePopState: (cb: (state: any) => boolean) => void;
    pathname: string;
    query: Record<string, string | string[]>;
    asPath: string;
    basePath: string;
  };
  
  export const usePathname: () => string;
  export const useSearchParams: () => URLSearchParams;
}

declare module 'next/font/google' {
  export function Inter(options: any): any;
  export function Roboto(options: any): any;
} 