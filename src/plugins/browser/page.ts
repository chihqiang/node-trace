import { isBrowser } from "../../utils";

export function getPageInfo(): {
  current_url: string;
  pathname: string;
  hostname: string;
  protocol: string;
  port: string;
  search: string;
  hash: string;
  document_url: string;
  referrer_url: string;
  content_type: string;
  document_title: string;
  document_charset: string;
  document_ready_state: string;
} {
  if (
    !isBrowser() ||
    typeof window === "undefined" ||
    typeof document === "undefined"
  ) {
    return {
      current_url: "",
      pathname: "",
      hostname: "",
      protocol: "",
      port: "",
      search: "",
      hash: "",
      document_url: "",
      referrer_url: "",
      content_type: "",
      document_title: "",
      document_charset: "",
      document_ready_state: "loading",
    };
  }

  return {
    current_url: window.location.href,
    pathname: window.location.pathname,
    hostname: window.location.hostname,
    protocol: window.location.protocol,
    port: window.location.port,
    search: window.location.search,
    hash: window.location.hash,
    document_url: document.URL,
    referrer_url: document.referrer,
    content_type: document.contentType || "",
    document_title: document.title,
    document_charset: document.characterSet || document.charset || "",
    document_ready_state: document.readyState,
  };
}

export function getScrollInfo(): {
  scroll_x: number;
  scroll_y: number;
} {
  if (
    !isBrowser() ||
    typeof window === "undefined" ||
    typeof document === "undefined"
  ) {
    return {
      scroll_x: 0,
      scroll_y: 0,
    };
  }

  return {
    scroll_x: window.pageXOffset || document.documentElement.scrollLeft || 0,
    scroll_y: window.pageYOffset || document.documentElement.scrollTop || 0,
  };
}
