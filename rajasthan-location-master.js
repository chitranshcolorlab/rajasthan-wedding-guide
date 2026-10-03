/* Rajasthan Wedding Guide — Rajasthan location master (development branch only)
   SAFETY STATUS: NOT WIRED TO LIVE REGISTRATION OR PUBLIC PAGES.

   District layer: 41-current-district model used by Rajasthan Government RAJ MASTERS.
   City/Town layer policy:
   - Only publish a city/town in a district after its current district relationship is validated.
   - Do not infer current district from older division-wise LSG pages after district reorganisation.
   - Keep slugs stable after publication.
   - No village master. Rural vendors use the nearest supported city/town; detailed address remains free text.

   Validation sources:
   1) Rajasthan Government RAJ MASTERS — District / Urban Local Body (City) mapping.
   2) Rajasthan Urban Development & Housing / Local Self Government official ULB pages as secondary evidence.

   NOTE: The official RAJ MASTERS UI reports 41 districts and 309 ULB(City) records, but its
   public list page does not expose the full mapping in static HTML. Therefore this file deliberately
   does NOT pretend that all 309 relationships have been machine-verified. Unverified relationships
   stay out until confirmed. This prevents a wrong district assignment from reaching production.
*/
(function () {
  'use strict';

  const districts = [
    'Ajmer','Alwar','Balotra','Banswara','Baran','Barmer','Beawar','Bharatpur','Bhilwara','Bikaner',
    'Bundi','Chittorgarh','Churu','Dausa','Deeg','Dholpur','Didwana-Kuchaman','Dungarpur','Hanumangarh',
    'Jaipur','Jaisalmer','Jalore','Jhalawar','Jhunjhunu','Jodhpur','Karauli','Khairthal-Tijara','Kota',
    'Kotputli-Behror','Nagaur','Pali','Phalodi','Pratapgarh','Rajsamand','Salumber','Sawai Madhopur',
    'Sikar','Sirohi','Sri Ganganagar','Tonk','Udaipur'
  ];

  const slug = value => String(value || '')
    .trim().toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

  const city = (name, type='Town') => Object.freeze({name, slug: slug(name), type});

  /* High-confidence seed relationships. This is intentionally conservative.
     More towns are added only after current-district validation. */
  const citiesByDistrict = Object.freeze({
    'Ajmer': Object.freeze([city('Ajmer','City'), city('Kishangarh','City')]),
    'Alwar': Object.freeze([city('Alwar','City')]),
    'Balotra': Object.freeze([city('Balotra','City')]),
    'Banswara': Object.freeze([city('Banswara','City'), city('Kushalgarh')]),
    'Baran': Object.freeze([city('Baran','City'), city('Anta'), city('Chhabra'), city('Mangrol')]),
    'Barmer': Object.freeze([city('Barmer','City')]),
    'Beawar': Object.freeze([city('Beawar','City')]),
    'Bharatpur': Object.freeze([city('Bharatpur','City'), city('Bayana'), city('Nadbai'), city('Weir'), city('Bhusawar')]),
    'Bhilwara': Object.freeze([city('Bhilwara','City'), city('Asind')]),
    'Bikaner': Object.freeze([city('Bikaner','City'), city('Nokha'), city('Deshnok')]),
    'Bundi': Object.freeze([city('Bundi','City'), city('Lakheri'), city('Nainwa'), city('Kapren'), city('Keshoraipatan')]),
    'Chittorgarh': Object.freeze([city('Chittorgarh','City'), city('Nimbahera'), city('Bari Sadri'), city('Kapasan'), city('Begun'), city('Rawatbhata')]),
    'Churu': Object.freeze([city('Churu','City'), city('Bidasar')]),
    'Dausa': Object.freeze([city('Dausa','City'), city('Bandikui'), city('Lalsot')]),
    'Deeg': Object.freeze([city('Deeg','City'), city('Kumher'), city('Nagar')]),
    'Dholpur': Object.freeze([city('Dholpur','City'), city('Bari'), city('Rajakhera')]),
    'Didwana-Kuchaman': Object.freeze([city('Didwana','City'), city('Kuchaman City','City'), city('Ladnun'), city('Makrana'), city('Nawa'), city('Parbatsar'), city('Degana')]),
    'Dungarpur': Object.freeze([city('Dungarpur','City'), city('Sagwara')]),
    'Hanumangarh': Object.freeze([city('Hanumangarh','City'), city('Bhadra')]),
    'Jaipur': Object.freeze([city('Jaipur','City'), city('Chomu'), city('Sambhar'), city('Chaksu'), city('Jobner'), city('Phulera'), city('Bagru')]),
    'Jaisalmer': Object.freeze([city('Jaisalmer','City'), city('Pokaran')]),
    'Jalore': Object.freeze([city('Jalore','City'), city('Bhinmal')]),
    'Jhalawar': Object.freeze([city('Jhalawar','City'), city('Bhawani Mandi'), city('Jhalrapatan'), city('Pirawa'), city('Aklera')]),
    'Jhunjhunu': Object.freeze([city('Jhunjhunu','City'), city('Bagar'), city('Khetri'), city('Surajgarh'), city('Pilani'), city('Udaipurwati'), city('Vidyavihar')]),
    'Jodhpur': Object.freeze([city('Jodhpur','City'), city('Pipar City'), city('Bilara')]),
    'Karauli': Object.freeze([city('Karauli','City'), city('Hindaun City','City'), city('Todabhim')]),
    'Khairthal-Tijara': Object.freeze([city('Khairthal','City'), city('Tijara'), city('Bhiwadi','City'), city('Kishangarh Bas')]),
    'Kota': Object.freeze([city('Kota','City'), city('Ramganj Mandi'), city('Kaithoon'), city('Sangod')]),
    'Kotputli-Behror': Object.freeze([city('Kotputli','City'), city('Behror','City')]),
    'Nagaur': Object.freeze([city('Nagaur','City'), city('Merta City','City')]),
    'Pali': Object.freeze([city('Pali','City'), city('Sumerpur'), city('Sojat City'), city('Jaitaran'), city('Bali'), city('Takhatgarh'), city('Sadri'), city('Falna')]),
    'Phalodi': Object.freeze([city('Phalodi','City')]),
    'Pratapgarh': Object.freeze([city('Pratapgarh','City'), city('Chhoti Sadri')]),
    'Rajsamand': Object.freeze([city('Rajsamand','City'), city('Amet'), city('Nathdwara'), city('Deogarh')]),
    'Salumber': Object.freeze([city('Salumber','City')]),
    'Sawai Madhopur': Object.freeze([city('Sawai Madhopur','City'), city('Gangapur City','City')]),
    'Sikar': Object.freeze([city('Sikar','City'), city('Fatehpur'), city('Laxmangarh'), city('Ramgarh Shekhawati'), city('Sri Madhopur'), city('Khandela'), city('Ringas'), city('Losal')]),
    'Sirohi': Object.freeze([city('Sirohi','City'), city('Mount Abu'), city('Abu Road'), city('Shivganj'), city('Pindwara')]),
    'Sri Ganganagar': Object.freeze([city('Sri Ganganagar','City')]),
    'Tonk': Object.freeze([city('Tonk','City'), city('Deoli'), city('Niwai'), city('Malpura'), city('Todaraisingh'), city('Uniara')]),
    'Udaipur': Object.freeze([city('Udaipur','City'), city('Fatehnagar'), city('Bhinder'), city('Kanore')])
  });

  function validateMaster() {
    const errors = [];
    const districtSet = new Set(districts);
    if (districtSet.size !== 41) errors.push('District master must contain exactly 41 unique districts.');

    Object.keys(citiesByDistrict).forEach(d => {
      if (!districtSet.has(d)) errors.push('Unknown district key: ' + d);
      const names = new Set();
      const slugs = new Set();
      citiesByDistrict[d].forEach(c => {
        if (!c.name || !c.slug) errors.push('Invalid city record in ' + d);
        if (names.has(c.name.toLowerCase())) errors.push('Duplicate city name in ' + d + ': ' + c.name);
        if (slugs.has(c.slug)) errors.push('Duplicate city slug in ' + d + ': ' + c.slug);
        names.add(c.name.toLowerCase());
        slugs.add(c.slug);
      });
    });

    districts.forEach(d => {
      if (!Object.prototype.hasOwnProperty.call(citiesByDistrict,d)) errors.push('Missing city array for district: ' + d);
    });

    return Object.freeze({ok: errors.length === 0, errors: Object.freeze(errors)});
  }

  const validation = validateMaster();
  if (!validation.ok) console.error('RWG location master validation failed', validation.errors);

  window.RWG_LOCATION_MASTER = Object.freeze({
    state: 'Rajasthan',
    districtCount: 41,
    districts: Object.freeze(districts.map(name => Object.freeze({name,slug:slug(name)}))),
    citiesByDistrict,
    validation,
    policy: Object.freeze({villageMaster:false, liveIntegration:false, sourceMode:'official-government-validated-conservative'})
  });
})();
