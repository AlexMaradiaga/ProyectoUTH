export interface Jornada {
  id: string;
  name: string;
  day: string;
  session: string;
  url: string;
}

export const JORNADAS: Jornada[] = [
  {
    id: 'jueves-manana',
    name: 'Jueves Mañana',
    day: 'Jueves',
    session: 'Mañana',
    url: 'https://docs.google.com/spreadsheets/d/1WSXedfn2b_72gbW5jpkq4gnf3neIqVnvL1GXBB_2Ops/edit?gid=1649911515#gid=1649911515',
  },
  {
    id: 'jueves-tarde',
    name: 'Jueves Tarde',
    day: 'Jueves',
    session: 'Tarde',
    url: 'https://docs.google.com/spreadsheets/d/1RFexMwM6S2iffc5pX3rp5C9q28foFWSbqfZ6AwHZCA/edit?usp=sharing',
  },
  {
    id: 'viernes-manana',
    name: 'Viernes Mañana',
    day: 'Viernes',
    session: 'Mañana',
    url: 'https://docs.google.com/spreadsheets/d/1cQ63tsF58Dn76dS9_NSsmuUBqekCScWEATG3WDvS0qw/edit?usp=sharing',
  },
  {
    id: 'viernes-tarde',
    name: 'Viernes Tarde',
    day: 'Viernes',
    session: 'Tarde',
    url: 'https://docs.google.com/spreadsheets/d/14Pt7QLp76wJIRz4GvHffqNOiN2NrwklWh8vT0GlxlRw/edit?usp=sharing',
  },
];