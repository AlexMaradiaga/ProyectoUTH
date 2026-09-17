export interface Jornada {
  id: string;
  name: string;
  day: string;
  session: string;
  url: string;
}

export const JORNADAS: Jornada[] = [
  {
    id: 'Celebración Docente UTH',
    name: 'Docentes de UTH',
    day: 'Jueves',
    session: 'Nocturna',
    url: 'https://docs.google.com/spreadsheets/d/1Sv2RtmMTPwbJwB_j29lA04N2Kt4z_kbqkhTF6NIzRxU/edit?usp=sharing',
  },
];