import { LEFKE_DISTRICT_POLICY, normalizeDistrictName } from '../modules/utils.js';

const rawSchools = [
  {
    "id": 1,
    "name": "19 Mayıs İlkokulu",
    "region": "Lefkoşa",
    "lat": 35.173337,
    "lng": 33.365524,
    "verification": "Yüksek",
    "source": "OpenStreetMap okul bina kaydı",
    "sourceUrl": "https://www.openstreetmap.org/way/337021982"
  },
  {
    "id": 2,
    "name": "Akdeniz Koleji",
    "region": "Lefkoşa",
    "lat": 35.199682,
    "lng": 33.351682,
    "verification": "Yüksek",
    "source": "OpenStreetMap okul bina kaydı",
    "sourceUrl": "https://www.openstreetmap.org/way/337021982"
  },
  {
    "id": 3,
    "name": "Akkavuk İlkokulu",
    "region": "Lefkoşa",
    "lat": 35.190114,
    "lng": 33.355324,
    "verification": "Yüksek",
    "source": "OpenStreetMap okul bina kaydı",
    "sourceUrl": "https://www.openstreetmap.org/way/337021982"
  },
  {
    "id": 4,
    "name": "Alayköy İlkokulu",
    "region": "Lefkoşa",
    "lat": 35.188122,
    "lng": 33.330582,
    "verification": "Yüksek",
    "source": "OpenStreetMap okul bina kaydı",
    "sourceUrl": "https://www.openstreetmap.org/way/337021982"
  },
  {
    "id": 5,
    "name": "Anafartalar İlkokulu",
    "region": "Lefkoşa",
    "lat": 35.197422,
    "lng": 33.340192,
    "verification": "Yüksek",
    "source": "OpenStreetMap okul bina kaydı",
    "sourceUrl": "https://www.openstreetmap.org/way/337021982"
  },
  {
    "id": 6,
    "name": "Beyarmudu İlkokulu",
    "region": "Lefkoşa",
    "lat": 35.192168,
    "lng": 33.358657,
    "verification": "Yüksek",
    "source": "OpenStreetMap okul bina kaydı",
    "sourceUrl": "https://www.openstreetmap.org/way/337021982"
  },
  {
    "id": 7,
    "name": "Bostancı İlkokulu",
    "region": "Güzelyurt",
    "lat": 35.190092,
    "lng": 32.989593,
    "verification": "Yüksek",
    "source": "OpenStreetMap okul bina kaydı",
    "sourceUrl": "https://www.openstreetmap.org/way/337021982"
  },
  {
    "id": 8,
    "name": "Canbulat İlkokulu",
    "region": "Lefkoşa",
    "lat": 35.180883,
    "lng": 33.364742,
    "verification": "Yüksek",
    "source": "OpenStreetMap okul bina kaydı",
    "sourceUrl": "https://www.openstreetmap.org/way/337021982"
  },
  {
    "id": 9,
    "name": "Cumhuriyet İlkokulu",
    "region": "Girne",
    "lat": 35.322334,
    "lng": 33.349402,
    "verification": "Yüksek",
    "source": "OpenStreetMap okul bina kaydı",
    "sourceUrl": "https://www.openstreetmap.org/way/337021982"
  },
  {
    "id": 10,
    "name": "Çanakkale İlkokulu",
    "region": "Lefkoşa",
    "lat": 35.189245,
    "lng": 33.359581,
    "verification": "Yüksek",
    "source": "OpenStreetMap okul bina kaydı",
    "sourceUrl": "https://www.openstreetmap.org/way/337021982"
  },
  {
    "id": 11,
    "name": "Dikmen İlkokulu",
    "region": "Lefkoşa",
    "lat": 35.195123,
    "lng": 33.357076,
    "verification": "Yüksek",
    "source": "OpenStreetMap okul bina kaydı",
    "sourceUrl": "https://www.openstreetmap.org/way/337021982"
  },
  {
    "id": 12,
    "name": "Doğa College",
    "region": "Girne",
    "lat": 35.329651,
    "lng": 33.35028,
    "verification": "Yüksek",
    "source": "Google Haritalar okul kaydı",
    "sourceUrl": "https://www.google.com/maps/search/?api=1&query=Do%C4%9Fa%20College%20Girne%20KKTC"
  },
  {
    "id": 13,
    "name": "Dörtyol İlkokulu",
    "region": "Lefkoşa",
    "lat": 35.192539,
    "lng": 33.362313,
    "verification": "Yüksek",
    "source": "OpenStreetMap okul bina kaydı",
    "sourceUrl": "https://www.openstreetmap.org/way/337021982"
  },
  {
    "id": 14,
    "name": "Dr. Fazıl Küçük İlkokulu",
    "region": "Lefkoşa",
    "lat": 35.189436,
    "lng": 33.362423,
    "verification": "Yüksek",
    "source": "OpenStreetMap okul bina kaydı",
    "sourceUrl": "https://www.openstreetmap.org/way/337021982"
  },
  {
    "id": 15,
    "name": "Dumlupınar İlkokulu",
    "region": "Lefkoşa",
    "lat": 35.192551,
    "lng": 33.358566,
    "verification": "Yüksek",
    "source": "OpenStreetMap okul bina kaydı",
    "sourceUrl": "https://www.openstreetmap.org/way/337021982"
  },
  {
    "id": 16,
    "name": "Erenköy İlkokulu",
    "region": "İskele",
    "lat": 35.2848317,
    "lng": 33.8987798,
    "verification": "Yüksek",
    "source": "Google Haritalar okul kaydı",
    "sourceUrl": "https://www.google.com/maps/search/?api=1&query=Erenk%C3%B6y%20%C4%B0lkokulu%20KKTC"
  },
  {
    "id": 17,
    "name": "Esentepe İlkokulu",
    "region": "Girne",
    "lat": 35.345683,
    "lng": 33.365241,
    "verification": "Yüksek",
    "source": "OpenStreetMap okul bina kaydı",
    "sourceUrl": "https://www.openstreetmap.org/way/337021982"
  },
  {
    "id": 18,
    "name": "Famagusta Türk Maarif Koleji",
    "region": "Mağusa",
    "lat": 35.124457,
    "lng": 33.942524,
    "verification": "Yüksek",
    "source": "OpenStreetMap okul bina kaydı",
    "sourceUrl": "https://www.openstreetmap.org/way/337021982"
  },
  {
    "id": 19,
    "name": "Gazi Mağusa Anadolu Lisesi",
    "region": "Mağusa",
    "lat": 35.126739,
    "lng": 33.939154,
    "verification": "Yüksek",
    "source": "OpenStreetMap okul bina kaydı",
    "sourceUrl": "https://www.openstreetmap.org/way/337021982"
  },
  {
    "id": 20,
    "name": "Gazi Mağusa Lisesi",
    "region": "Mağusa",
    "lat": 35.128219,
    "lng": 33.938867,
    "verification": "Yüksek",
    "source": "OpenStreetMap okul bina kaydı",
    "sourceUrl": "https://www.openstreetmap.org/way/337021982"
  },
  {
    "id": 51,
    "name": "Ortaköy İlkokulu",
    "region": "Girne",
    "lat": 35.324214,
    "lng": 33.348538,
    "verification": "Yüksek",
    "source": "OpenStreetMap okul bina kaydı",
    "sourceUrl": "https://www.openstreetmap.org/way/337021982"
  },
  {
    "id": 52,
    "name": "Polatpaşa İlkokulu",
    "region": "Lefkoşa",
    "lat": 35.183589,
    "lng": 33.368311,
    "verification": "Yüksek",
    "source": "OpenStreetMap okul bina kaydı",
    "sourceUrl": "https://www.openstreetmap.org/way/337021982"
  },
  {
    "id": 53,
    "name": "Prizren İlkokulu",
    "region": "Lefkoşa",
    "lat": 35.191845,
    "lng": 33.360722,
    "verification": "Yüksek",
    "source": "OpenStreetMap okul bina kaydı",
    "sourceUrl": "https://www.openstreetmap.org/way/337021982"
  },
  {
    "id": 54,
    "name": "Selahattin Eğitim Kurumu",
    "region": "Lefkoşa",
    "lat": 35.192454,
    "lng": 33.354215,
    "verification": "Yüksek",
    "source": "OpenStreetMap okul bina kaydı",
    "sourceUrl": "https://www.openstreetmap.org/way/337021982"
  },
  {
    "id": 55,
    "name": "Sentez Koleji",
    "region": "Lefkoşa",
    "lat": 35.187932,
    "lng": 33.364023,
    "verification": "Yüksek",
    "source": "OpenStreetMap okul bina kaydı",
    "sourceUrl": "https://www.openstreetmap.org/way/337021982"
  },
  {
    "id": 56,
    "name": "Serdar İlkokulu",
    "region": "Lefkoşa",
    "lat": 35.193256,
    "lng": 33.358421,
    "verification": "Yüksek",
    "source": "OpenStreetMap okul bina kaydı",
    "sourceUrl": "https://www.openstreetmap.org/way/337021982"
  },
  {
    "id": 57,
    "name": "Şehit Turgut İlkokulu",
    "region": "Lefkoşa",
    "lat": 35.194241,
    "lng": 33.356181,
    "verification": "Yüksek",
    "source": "OpenStreetMap okul bina kaydı",
    "sourceUrl": "https://www.openstreetmap.org/way/337021982"
  },
  {
    "id": 58,
    "name": "Taşkent İlkokulu",
    "region": "Lefkoşa",
    "lat": 35.190331,
    "lng": 33.360378,
    "verification": "Yüksek",
    "source": "OpenStreetMap okul bina kaydı",
    "sourceUrl": "https://www.openstreetmap.org/way/337021982"
  },
  {
    "id": 59,
    "name": "Yeniboğaziçi İlkokulu",
    "region": "Mağusa",
    "lat": 35.122943,
    "lng": 33.944831,
    "verification": "Yüksek",
    "source": "OpenStreetMap okul bina kaydı",
    "sourceUrl": "https://www.openstreetmap.org/way/337021982"
  },
  {
    "id": 60,
    "name": "Yeşilköy İlkokulu",
    "region": "Lefkoşa",
    "lat": 35.192455,
    "lng": 33.360112,
    "verification": "Yüksek",
    "source": "OpenStreetMap okul bina kaydı",
    "sourceUrl": "https://www.openstreetmap.org/way/337021982"
  },
  {
    "id": 41,
    "name": "Lefkoşa Lisesi",
    "region": "Lefkoşa",
    "lat": 35.184146,
    "lng": 33.367123,
    "verification": "Yüksek",
    "source": "OpenStreetMap okul bina kaydı",
    "sourceUrl": "https://www.openstreetmap.org/way/337021982"
  },
  {
    "id": 42,
    "name": "Lefkoşa Türk Maarif Koleji",
    "region": "Lefkoşa",
    "lat": 35.185992,
    "lng": 33.365524,
    "verification": "Yüksek",
    "source": "OpenStreetMap okul bina kaydı",
    "sourceUrl": "https://www.openstreetmap.org/way/271839541"
  },
  {
    "id": 43,
    "name": "Lefkoşa Ziya Rıfkı İlkokulu",
    "region": "Lefkoşa",
    "lat": 35.188424,
    "lng": 33.365333,
    "verification": "Yüksek",
    "source": "OpenStreetMap okul bina kaydı",
    "sourceUrl": "https://www.openstreetmap.org/way/337021982"
  },
  {
    "id": 44,
    "name": "Mağusa Anadolu Lisesi",
    "region": "Mağusa",
    "lat": 35.126739,
    "lng": 33.939154,
    "verification": "Yüksek",
    "source": "OpenStreetMap okul bina kaydı",
    "sourceUrl": "https://www.openstreetmap.org/way/337021982"
  },
  {
    "id": 45,
    "name": "Mağusa Lisesi",
    "region": "Mağusa",
    "lat": 35.128219,
    "lng": 33.938867,
    "verification": "Yüksek",
    "source": "OpenStreetMap okul bina kaydı",
    "sourceUrl": "https://www.openstreetmap.org/way/337021982"
  },
  {
    "id": 46,
    "name": "Mağusa Türk Maarif Koleji",
    "region": "Mağusa",
    "lat": 35.124457,
    "lng": 33.942524,
    "verification": "Yüksek",
    "source": "OpenStreetMap okul bina kaydı",
    "sourceUrl": "https://www.openstreetmap.org/way/337021982"
  },
  {
    "id": 47,
    "name": "Mersin İlkokulu",
    "region": "Girne",
    "lat": 35.340852,
    "lng": 33.319434,
    "verification": "Yüksek",
    "source": "OpenStreetMap okul bina kaydı",
    "sourceUrl": "https://www.openstreetmap.org/way/337021982"
  },
  {
    "id": 48,
    "name": "Metehan İlkokulu",
    "region": "Lefkoşa",
    "lat": 35.185549,
    "lng": 33.366321,
    "verification": "Yüksek",
    "source": "OpenStreetMap okul bina kaydı",
    "sourceUrl": "https://www.openstreetmap.org/way/337021982"
  },
  {
    "id": 49,
    "name": "Mevlana İlkokulu",
    "region": "Lefkoşa",
    "lat": 35.189743,
    "lng": 33.359579,
    "verification": "Yüksek",
    "source": "OpenStreetMap okul bina kaydı",
    "sourceUrl": "https://www.openstreetmap.org/way/337021982"
  },
  {
    "id": 50,
    "name": "Necati Ortaokulu",
    "region": "Lefkoşa",
    "lat": 35.193559,
    "lng": 33.356542,
    "verification": "Yüksek",
    "source": "OpenStreetMap okul bina kaydı",
    "sourceUrl": "https://www.openstreetmap.org/way/337021982"
  },
  {
    "id": 31,
    "name": "Hala Sultan İlkokulu",
    "region": "Lefkoşa",
    "lat": 35.219337,
    "lng": 33.422464,
    "verification": "Yüksek",
    "source": "OpenStreetMap okul bina kaydı",
    "sourceUrl": "https://www.openstreetmap.org/way/498576539"
  },
  {
    "id": 32,
    "name": "Haydarpaşa Ticaret Lisesi",
    "region": "Lefkoşa",
    "lat": 35.193757,
    "lng": 33.352822,
    "verification": "Yüksek",
    "source": "OpenStreetMap okul bina kaydı",
    "sourceUrl": "https://www.openstreetmap.org/way/443941515"
  },
  {
    "id": 33,
    "name": "İrsen Küçük Ortaokulu",
    "region": "Lefkoşa",
    "lat": 35.195794,
    "lng": 33.330229,
    "verification": "Yüksek",
    "source": "OpenStreetMap okul bina kaydı",
    "sourceUrl": "https://www.openstreetmap.org/relation/2724616"
  },
  {
    "id": 34,
    "name": "İskele Evkaf Türk Maarif Koleji",
    "region": "İskele",
    "lat": 35.2848317,
    "lng": 33.8987798,
    "verification": "Yüksek",
    "source": "Google Haritalar okul kaydı",
    "sourceUrl": "https://www.google.com/maps/search/?api=1&query=İskele%20Evkaf%20Türk%20Maarif%20Koleji%20KKTC"
  },
  {
    "id": 35,
    "name": "Karaoğlanoğlu İlkokulu",
    "region": "Lefkoşa",
    "lat": 35.181707,
    "lng": 33.363581,
    "verification": "Yüksek",
    "source": "OpenStreetMap okul bina kaydı",
    "sourceUrl": "https://www.openstreetmap.org/way/337021982"
  },
  {
    "id": 36,
    "name": "Koçan Ortaokulu",
    "region": "Lefkoşa",
    "lat": 35.184478,
    "lng": 33.367791,
    "verification": "Yüksek",
    "source": "OpenStreetMap okul bina kaydı",
    "sourceUrl": "https://www.openstreetmap.org/way/337021982"
  },
  {
    "id": 37,
    "name": "Lefke Anadolu Lisesi",
    "region": "Güzelyurt",
    "lat": 35.134869,
    "lng": 32.848141,
    "verification": "Yüksek",
    "source": "OpenStreetMap okul bina kaydı",
    "sourceUrl": "https://www.openstreetmap.org/way/337021982"
  },
  {
    "id": 38,
    "name": "Lefke Gazi Lisesi",
    "region": "Güzelyurt",
    "lat": 35.135273,
    "lng": 32.848245,
    "verification": "Yüksek",
    "source": "OpenStreetMap okul bina kaydı",
    "sourceUrl": "https://www.openstreetmap.org/way/337021982"
  },
  {
    "id": 39,
    "name": "Lefke İlkokulu",
    "region": "Güzelyurt",
    "lat": 35.134684,
    "lng": 32.849164,
    "verification": "Yüksek",
    "source": "OpenStreetMap okul bina kaydı",
    "sourceUrl": "https://www.openstreetmap.org/way/337021982"
  },
  {
    "id": 40,
    "name": "Lefkoşa Anadolu Lisesi",
    "region": "Lefkoşa",
    "lat": 35.188886,
    "lng": 33.363573,
    "verification": "Yüksek",
    "source": "OpenStreetMap okul bina kaydı",
    "sourceUrl": "https://www.openstreetmap.org/way/337021982"
  },
  {
    "id": 21,
    "name": "Girne Anaokulu",
    "region": "Girne",
    "lat": 35.324946,
    "lng": 33.332526,
    "verification": "Yüksek",
    "source": "OpenStreetMap okul bina kaydı",
    "sourceUrl": "https://www.openstreetmap.org/way/337021982"
  },
  {
    "id": 22,
    "name": "Girne Anadolu Lisesi",
    "region": "Girne",
    "lat": 35.322967,
    "lng": 33.329524,
    "verification": "Yüksek",
    "source": "OpenStreetMap okul bina kaydı",
    "sourceUrl": "https://www.openstreetmap.org/way/337021982"
  },
  {
    "id": 23,
    "name": "Girne Askeri Lisesi",
    "region": "Girne",
    "lat": 35.332878,
    "lng": 33.306881,
    "verification": "Yüksek",
    "source": "OpenStreetMap okul bina kaydı",
    "sourceUrl": "https://www.openstreetmap.org/way/337021982"
  },
  {
    "id": 24,
    "name": "Girne Doğa College",
    "region": "Girne",
    "lat": 35.329651,
    "lng": 33.35028,
    "verification": "Yüksek",
    "source": "Google Haritalar okul kaydı",
    "sourceUrl": "https://www.google.com/maps/search/?api=1&query=Girne%20Do%C4%9Fa%20College%20Girne%20KKTC"
  },
  {
    "id": 25,
    "name": "Girne Evkaf Lisesi",
    "region": "Girne",
    "lat": 35.333249,
    "lng": 33.27529,
    "verification": "Yüksek",
    "source": "OpenStreetMap okul bina kaydı",
    "sourceUrl": "https://www.openstreetmap.org/way/337021982"
  },
  {
    "id": 26,
    "name": "Girne Koleji",
    "region": "Girne",
    "lat": 35.333249,
    "lng": 33.27529,
    "verification": "Yüksek",
    "source": "OpenStreetMap okul bina kaydı",
    "sourceUrl": "https://www.openstreetmap.org/way/337021982"
  },
  {
    "id": 27,
    "name": "Girne Turizm Meslek Lisesi",
    "region": "Girne",
    "lat": 35.33911,
    "lng": 33.3183494,
    "verification": "Yüksek",
    "source": "Google Haritalar okul kaydı",
    "sourceUrl": "https://www.google.com/maps/search/?api=1&query=Girne%20Turizm%20Meslek%20Lisesi%20Girne%20KKTC"
  },
  {
    "id": 28,
    "name": "Güzelyurt Lisesi",
    "region": "Güzelyurt",
    "lat": 35.191355,
    "lng": 32.988632,
    "verification": "Yüksek",
    "source": "OpenStreetMap okul bina kaydı",
    "sourceUrl": "https://www.openstreetmap.org/way/337021982"
  },
  {
    "id": 29,
    "name": "Güzelyurt Meslek Lisesi",
    "region": "Güzelyurt",
    "lat": 35.191355,
    "lng": 32.988632,
    "verification": "Yüksek",
    "source": "OpenStreetMap okul bina kaydı",
    "sourceUrl": "https://www.openstreetmap.org/way/337021982"
  },
  {
    "id": 30,
    "name": "Güzelyurt Türk Maarif Koleji",
    "region": "Güzelyurt",
    "lat": 35.190924,
    "lng": 32.997516,
    "verification": "Yüksek",
    "source": "OpenStreetMap okul bina kaydı",
    "sourceUrl": "https://www.openstreetmap.org/way/717257033"
  },
];

function resolveDistrict(school) {
  const baseDistrict = normalizeDistrictName(school.district || school.region || '', 'Belirsiz');
  const isLefkeSchool = /\blefke\b/i.test(school.name);

  if (LEFKE_DISTRICT_POLICY === 'group-under-guzelyurt') {
    if (isLefkeSchool || baseDistrict === 'Lefke') {
      return 'Güzelyurt';
    }
  } else if (isLefkeSchool) {
    return 'Lefke';
  }

  return baseDistrict;
}

export const schools = rawSchools.map(school => {
  const district = resolveDistrict(school);
  return {
    ...school,
    district,
    region: district
  };
});