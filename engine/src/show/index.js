// Show registry: name -> lazy import of a show definition module.
// A show module's default export is (T) => [ { id, t0, t1, load, transition? }, ... ] (T = timing helpers).
export const SHOWS = {
  main: () => import('./main.js'),
  dev: () => import('./dev.js'),
};
