import "@testing-library/jest-dom/vitest";

// matchMedia polyfill for jsdom
if (!window.matchMedia) {
  window.matchMedia = (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  });
}

// ResizeObserver polyfill for Radix primitives
if (!("ResizeObserver" in window)) {
  class RO {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  // @ts-expect-error jsdom polyfill
  window.ResizeObserver = RO;
}
