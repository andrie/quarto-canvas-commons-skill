// Vite's ?raw suffix imports a file's text, which the SVG scene uses to recolour a logo path by path
declare module '*.svg?raw' {
  const text: string;
  export default text;
}
