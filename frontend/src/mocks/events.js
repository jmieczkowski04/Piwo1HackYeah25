// Prosty mock danych kalendarza, zgodny z naszymi typami
export function mockEventsForUser() {
  // daty w ISO, kilka eventów przeszłych i przyszłych
  const now = new Date()
  const day = 24 * 60 * 60 * 1000

  const iso = (d) => new Date(d).toISOString()

  return [
    {
      id: 'evt-krk-001',
      name: 'Bieg Charytatywny',
      description: 'Wydarzenie biegowe w Parku Jordana.',
      status: 'CONFIRMED',
      institution_id: 'inst-1',
      start_date: iso(now.getTime() + 3 * day),
      end_date: iso(now.getTime() + 3 * day + 3 * 60 * 60 * 1000),
      groups: [
        {
          id: 'grp-1',
          name: 'Strefa Startu',
          tasks: [
            {
              id: 'tsk-1',
              name: 'Rejestracja uczestników',
              start_date: iso(now.getTime() + 3 * day),
              end_date: iso(now.getTime() + 3 * day + 2 * 60 * 60 * 1000),
              users: [{ id: 'u-2' }, { id: 'u-3' }],
            },
            {
              id: 'tsk-2',
              name: 'Wydawanie numerów',
              start_date: iso(now.getTime() + 3 * day),
              end_date: iso(now.getTime() + 3 * day + 2 * 60 * 60 * 1000),
              users: [{ id: 'u-4' }],
            },
          ],
        },
        {
          id: 'grp-2',
          name: 'Trasa',
          tasks: [
            {
              id: 'tsk-3',
              name: 'Nawadnianie 5km',
              start_date: iso(now.getTime() + 3 * day + 60 * 60 * 1000),
              end_date: iso(now.getTime() + 3 * day + 3 * 60 * 60 * 1000),
              users: [{ id: 'u-5' }, { id: 'u-6' }],
            },
          ],
        },
      ],
    },
    {
      id: 'evt-krk-002',
      name: 'Zbiórka Żywności',
      description: 'Akcja w kilku sklepach na terenie miasta.',
      status: 'CONFIRMED',
      institution_id: 'inst-2',
      start_date: iso(now.getTime() + 7 * day),
      end_date: iso(now.getTime() + 7 * day + 8 * 60 * 60 * 1000),
      groups: [
        {
          id: 'grp-3',
          name: 'Sklep A',
          tasks: [
            {
              id: 'tsk-4',
              name: 'Zmiana poranna',
              start_date: iso(now.getTime() + 7 * day),
              end_date: iso(now.getTime() + 7 * day + 4 * 60 * 60 * 1000),
              users: [{ id: 'u-1' }], // nasz test user
            },
            {
              id: 'tsk-5',
              name: 'Zmiana popołudniowa',
              start_date: iso(now.getTime() + 7 * day + 4 * 60 * 60 * 1000),
              end_date: iso(now.getTime() + 7 * day + 8 * 60 * 60 * 1000),
              users: [{ id: 'u-7' }],
            },
          ],
        },
      ],
    },
    {
      id: 'evt-krk-000',
      name: 'Porządkowanie Parku',
      description: 'Akcja sprzątania po weekendzie.',
      status: 'FINISHED',
      institution_id: 'inst-3',
      start_date: iso(now.getTime() - 5 * day),
      end_date: iso(now.getTime() - 5 * day + 3 * 60 * 60 * 1000),
      groups: [
        {
          id: 'grp-4',
          name: 'Strefa wschodnia',
          tasks: [
            {
              id: 'tsk-6',
              name: 'Zbieranie odpadów',
              start_date: iso(now.getTime() - 5 * day),
              end_date: iso(now.getTime() - 5 * day + 3 * 60 * 60 * 1000),
              users: [{ id: 'u-1' }, { id: 'u-8' }],
            },
          ],
        },
      ],
    },
  ]
}