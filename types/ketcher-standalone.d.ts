// Ketcher 2.25 ships declarations, but its package exports map prevents
// TypeScript's bundler resolution from finding them. This declaration keeps
// the runtime import working while avoiding a false TS7016 error.
declare module "ketcher-standalone" {
  export const StandaloneStructServiceProvider: any;
}
