// Prosty mock miejscówek w okolicach Krakowa
// Pola używane przez filtry/mapę/listę
export function mockPins() {
  const now = Date.now()
  const day = 24 * 3600e3
  const iso = (t) => new Date(t).toISOString()
  return [
    {
      id: 'ad-100',
      title: 'Piknik Rodzinny – strefa animacji',
      eventId: 'evt-200',
      groupId: 'grp-anim',
      start_date: iso(now + 2 * day),
      end_date: iso(now + 2 * day + 6 * 3600e3),
      ageMin: 16,
      ageMax: 26,
      latitude: 50.06468,
      longitude: 19.94539,
      address: 'Planty, Kraków',
      coordinator: 'Marta K.',
    },
    {
      id: 'ad-101',
      title: 'Sadzenie drzew – park wschodni',
      eventId: 'evt-201',
      groupId: 'grp-green',
      start_date: iso(now + 5 * day),
      end_date: iso(now + 5 * day + 4 * 3600e3),
      ageMin: 14,
      ageMax: 65,
      latitude: 50.0702,
      longitude: 19.9605,
      address: 'Park Lotników, Kraków',
      coordinator: 'Jan N.',
    },
    {
      id: 'ad-102',
      title: 'Bieg charytatywny – biuro zawodów',
      eventId: 'evt-202',
      groupId: 'grp-reg',
      start_date: iso(now + 1 * day),
      end_date: iso(now + 1 * day + 10 * 3600e3),
      ageMin: 18,
      ageMax: 99,
      latitude: 50.0543,
      longitude: 19.9366,
      address: 'TAURON Arena (biuro), Kraków',
      coordinator: 'Ewa S.',
    },
    {
      id: 'ad-103',
      title: 'Zbiórka żywności – sklep A',
      eventId: 'evt-203',
      groupId: 'grp-food-a',
      start_date: iso(now - 1 * day), // trwa od wczoraj do jutra
      end_date: iso(now + 1 * day),
      ageMin: 15,
      ageMax: 60,
      latitude: 50.0877,
      longitude: 19.9141,
      address: 'Bronowice',
      coordinator: 'Michał P.',
    },
  ]
}