/**
 * «Ahora» de la Home móvil (maqueta Home.dc.html): UNA sola novedad, con
 * fecha. Se cambia a mano en cada lanzamiento (el push a main despliega).
 * Cuando ZEROmovies S2 se despause: título «ZEROmovies · Season 2»,
 * cuerpo «24 new movies. The video club is open.», to «/zeromovies».
 */
export interface NowItem {
  /** Etiqueta corta de cuándo (p.ej. «Now», «This week», «Sep 13») */
  when: string;
  title: string;
  body: string;
  to: string;
}

export const NOW: NowItem = {
  when: 'Now',
  title: 'T-Shit Studio',
  body: 'Draw your own tee pixel by pixel, mint it, wear it on your ZERO.',
  to: '/tshit',
};
