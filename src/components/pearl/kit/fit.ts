// The Poster fitted display lines whose words arrive in the browser edge to
// edge (components/poster/fit.ts). Pearl's display type wraps like any text,
// so there is nothing to fit: these keep those pages' scripts working.
type FitOptions = { maxEm?: number; phoneMaxEm?: number; maxLines?: number; phoneMaxLines?: number };
export function fitTitle(_el: HTMLElement, _options: FitOptions = {}): void {}
export function keepFitted(_el: HTMLElement | null | undefined, _options?: FitOptions): void {}
