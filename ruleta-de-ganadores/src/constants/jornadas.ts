export interface Jornada {
  id: string;
  name: string;
  day: string;
  session: string;
  url: string;
}

export const JORNADAS: Jornada[] = [
  {
    id: 'viernes-manana',
    name: 'Viernes Mañana',
    day: 'Viernes',
    session: 'Mañana',
    url: 'https://docs.google.com/spreadsheets/d/1cQ63tsF58Dn76dS9_NSsmuUBqekCScWEATG3WDvS0qw/edit?gid=705517632#gid=705517632',
  },
  {
    id: 'viernes-tarde',
    name: 'Viernes Tarde',
    day: 'Viernes',
    session: 'Tarde',
    url: 'https://docs.google.com/spreadsheets/d/14Pt7QLp76wJIRz4GvHffqNOiN2NrwklWh8vT0GlxlRw/edit?gid=1946237727#gid=1946237727',
  },
];