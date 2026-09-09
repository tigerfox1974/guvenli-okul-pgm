import { LEFKE_DISTRICT_POLICY, normalizeDistrictName } from '../modules/utils.js';

const rawSchools = [
    {
        "id":  1,
        "name":  "19 Mayıs TMK",
        "region":  "Girne",
        "lat":  35.3277707,
        "lng":  33.3217066,
        "verification":  "Yüksek",
        "source":  "Google Haritalar okul kaydı",
        "sourceUrl":  "https://www.google.com/maps/search/?api=1\u0026query=19%20May%C4%B1s%20TMK%20Girne%20KKTC"
    },
    {
        "id":  2,
        "name":  "20 Temmuz Fen Lisesi",
        "region":  "Lefkoşa",
        "lat":  35.18412,
        "lng":  33.359972,
        "verification":  "Yüksek",
        "source":  "OpenStreetMap okul bina kaydı",
        "sourceUrl":  "https://www.openstreetmap.org/way/1273604200"
    },
    {
        "id":  3,
        "name":  "Anadolu Güzel Sanatlar Lisesi",
        "region":  "Lefkoşa",
        "lat":  35.1835021,
        "lng":  33.3607101,
        "verification":  "Yüksek",
        "source":  "Google Haritalar okul kaydı",
        "sourceUrl":  "https://www.google.com/maps/search/?api=1\u0026query=Anadolu%20G%C3%BCzel%20Sanatlar%20Lisesi%20Lefko%C5%9Fa%20KKTC"
    },
    {
        "id":  4,
        "name":  "Anafartalar Lisesi",
        "region":  "Girne",
        "lat":  35.3368523,
        "lng":  33.3183041,
        "verification":  "Yüksek",
        "source":  "Google Haritalar okul kaydı",
        "sourceUrl":  "https://www.google.com/maps/search/?api=1\u0026query=Anafartalar%20Lisesi%20Girne%20KKTC"
    },
    {
        "id":  5,
        "name":  "Atatürk Meslek Lisesi",
        "region":  "Lefkoşa",
        "lat":  35.194639,
        "lng":  33.353866,
        "verification":  "Yüksek",
        "source":  "OpenStreetMap okul bina kaydı",
        "sourceUrl":  "https://www.openstreetmap.org/way/443941514"
    },
    {
        "id":  6,
        "name":  "Atleks Sanverler Ortaokulu",
        "region":  "Lefkoşa",
        "lat":  35.19424,
        "lng":  33.358563,
        "verification":  "Yüksek",
        "source":  "OpenStreetMap okul bina kaydı",
        "sourceUrl":  "https://www.openstreetmap.org/way/435835140"
    },
    {
        "id":  7,
        "name":  "Bayraktar Ortaokulu",
        "region":  "Lefkoşa",
        "lat":  35.210088,
        "lng":  33.333933,
        "verification":  "Yüksek",
        "source":  "OpenStreetMap okul bina kaydı",
        "sourceUrl":  "https://www.openstreetmap.org/way/498102636"
    },
    {
        "id":  8,
        "name":  "Bekirpaşa Lisesi",
        "region":  "İskele",
        "lat":  35.284527,
        "lng":  33.897453,
        "verification":  "Yüksek",
        "source":  "OpenStreetMap okul bina kaydı",
        "sourceUrl":  "https://www.openstreetmap.org/way/498649489"
    },
    {
        "id":  9,
        "name":  "Bülent Ecevit Anadolu Lisesi",
        "region":  "Lefkoşa",
        "lat":  35.204556,
        "lng":  33.339126,
        "verification":  "Yüksek",
        "source":  "OpenStreetMap okul bina kaydı",
        "sourceUrl":  "https://www.openstreetmap.org/way/435600045"
    },
    {
        "id":  10,
        "name":  "Çanakkale Ortaokulu",
        "region":  "Gazimağusa",
        "lat":  35.12217,
        "lng":  33.927383,
        "verification":  "Yüksek",
        "source":  "OpenStreetMap okul bina kaydı",
        "sourceUrl":  "https://www.openstreetmap.org/way/334156229"
    },
    {
        "id":  11,
        "name":  "Canbulat Özgürlük Ortaokulu",
        "region":  "Gazimağusa",
        "lat":  35.1116459,
        "lng":  33.9439912,
        "verification":  "Yüksek",
        "source":  "Google Haritalar okul kaydı",
        "sourceUrl":  "https://www.google.com/maps/search/?api=1\u0026query=Canbulat%20%C3%96zg%C3%BCrl%C3%BCk%20Ortaokulu%20Gazima%C4%9Fusa%20KKTC"
    },
    {
        "id":  12,
        "name":  "Cengiz Topel Endüstri Meslek Lisesi",
        "region":  "Lefke",
        "lat":  35.119213,
        "lng":  32.848761,
        "verification":  "Yüksek",
        "source":  "OpenStreetMap okul bina kaydı",
        "sourceUrl":  "https://www.openstreetmap.org/way/1251984734"
    },
    {
        "id":  13,
        "name":  "Cumhuriyet Lisesi",
        "region":  "Gazimağusa",
        "lat":  35.2558212,
        "lng":  33.7266311,
        "verification":  "Yüksek",
        "source":  "Google Haritalar okul kaydı",
        "sourceUrl":  "https://www.google.com/maps/search/?api=1\u0026query=Cumhuriyet%20Lisesi%20Gazima%C4%9Fusa%20KKTC"
    },
    {
        "id":  14,
        "name":  "Değirmenlik Lisesi",
        "region":  "Lefkoşa",
        "lat":  35.236059,
        "lng":  33.484327,
        "verification":  "Yüksek",
        "source":  "OpenStreetMap okul bina kaydı",
        "sourceUrl":  "https://www.openstreetmap.org/way/435535950"
    },
    {
        "id":  15,
        "name":  "Demokrasi Ortaokulu",
        "region":  "Lefkoşa",
        "lat":  35.184975,
        "lng":  33.359614,
        "verification":  "Yüksek",
        "source":  "OpenStreetMap okul bina kaydı",
        "sourceUrl":  "https://www.openstreetmap.org/way/1281281461"
    },
    {
        "id":  16,
        "name":  "Dipkarpaz Recep Tayyip Erdoğan Ortaokulu",
        "region":  "İskele",
        "lat":  35.600976,
        "lng":  34.38046,
        "verification":  "Yüksek",
        "source":  "OpenStreetMap okul bina kaydı",
        "sourceUrl":  "https://www.openstreetmap.org/way/327668176"
    },
    {
        "id":  17,
        "name":  "Doğu Akdeniz Doğa Koleji",
        "region":  "Gazimağusa",
        "lat":  35.1430766,
        "lng":  33.9052832,
        "verification":  "Yüksek",
        "source":  "Google Haritalar okul kaydı",
        "sourceUrl":  "https://www.google.com/maps/search/?api=1\u0026query=Do%C4%9Fu%20Akdeniz%20Do%C4%9Fa%20Koleji%20Gazima%C4%9Fusa%20KKTC"
    },
    {
        "id":  18,
        "name":  "Dr. Fazıl Küçük Endüstri Meslek Lisesi",
        "region":  "Gazimağusa",
        "lat":  35.112824,
        "lng":  33.9455594,
        "verification":  "Yüksek",
        "source":  "Google Haritalar okul kaydı",
        "sourceUrl":  "https://www.google.com/maps/search/?api=1\u0026query=Dr.%20Faz%C4%B1l%20K%C3%BC%C3%A7%C3%BCk%20End%C3%BCstri%20Meslek%20Lisesi%20Gazima%C4%9Fusa%20KKTC"
    },
    {
        "id":  19,
        "name":  "Dr. Suat Günsel Koleji",
        "region":  "Girne",
        "lat":  35.329989,
        "lng":  33.3424396,
        "verification":  "Yüksek",
        "source":  "Google Haritalar okul kaydı",
        "sourceUrl":  "https://www.google.com/maps/search/?api=1\u0026query=Dr.%20Suat%20G%C3%BCnsel%20Koleji%20Girne%20KKTC"
    },
    {
        "id":  20,
        "name":  "Erenköy Lisesi",
        "region":  "İskele",
        "lat":  35.5360925,
        "lng":  34.1944666,
        "verification":  "Yüksek",
        "source":  "Google Haritalar okul kaydı",
        "sourceUrl":  "https://www.google.com/maps/search/?api=1\u0026query=Erenk%C3%B6y%20Lisesi%20%C4%B0skele%20KKTC"
    },
    {
        "id":  21,
        "name":  "Esentepe Ortaokulu",
        "region":  "Girne",
        "lat":  35.332379,
        "lng":  33.585969,
        "verification":  "Yüksek",
        "source":  "OpenStreetMap okul bina kaydı",
        "sourceUrl":  "https://www.openstreetmap.org/way/545009499"
    },
    {
        "id":  22,
        "name":  "Esin Leman Lisesi",
        "region":  "Lefkoşa",
        "lat":  35.198627,
        "lng":  33.357723,
        "verification":  "Yüksek",
        "source":  "OpenStreetMap okul bina kaydı",
        "sourceUrl":  "https://www.openstreetmap.org/way/1487167899"
    },
    {
        "id":  23,
        "name":  "Gazimağusa Meslek Lisesi",
        "region":  "Gazimağusa",
        "lat":  35.113931,
        "lng":  33.942292,
        "verification":  "Yüksek",
        "source":  "OpenStreetMap okul bina kaydı",
        "sourceUrl":  "https://www.openstreetmap.org/way/347628609"
    },
    {
        "id":  24,
        "name":  "Gazimağusa Ticaret Lisesi",
        "region":  "Gazimağusa",
        "lat":  35.1108818,
        "lng":  33.9433746,
        "verification":  "Yüksek",
        "source":  "Google Haritalar okul kaydı",
        "sourceUrl":  "https://www.google.com/maps/search/?api=1\u0026query=Gazima%C4%9Fusa%20Ticaret%20Lisesi%20Gazima%C4%9Fusa%20KKTC"
    },
    {
        "id":  25,
        "name":  "Gazimağusa Türk Maarif Koleji",
        "region":  "Gazimağusa",
        "lat":  35.118878,
        "lng":  33.955188,
        "verification":  "Yüksek",
        "source":  "OpenStreetMap okul bina kaydı",
        "sourceUrl":  "https://www.openstreetmap.org/way/838950740"
    },
    {
        "id":  26,
        "name":  "Girne Amerikan Koleji",
        "region":  "Girne",
        "lat":  35.333249,
        "lng":  33.27529,
        "verification":  "Orta",
        "source":  "Google Haritalar + resmî okul adresi",
        "sourceUrl":  "https://www.gau-americancollege.k12.tr/108-contact-information"
    },
    {
        "id":  27,
        "name":  "Girne Doğa College",
        "region":  "Girne",
        "lat":  35.329651,
        "lng":  33.35028,
        "verification":  "Yüksek",
        "source":  "Google Haritalar okul kaydı",
        "sourceUrl":  "https://www.google.com/maps/search/?api=1\u0026query=Girne%20Do%C4%9Fa%20College%20Girne%20KKTC"
    },
    {
        "id":  28,
        "name":  "Girne Turizm Meslek Lisesi",
        "region":  "Girne",
        "lat":  35.33911,
        "lng":  33.3183494,
        "verification":  "Yüksek",
        "source":  "Google Haritalar okul kaydı",
        "sourceUrl":  "https://www.google.com/maps/search/?api=1\u0026query=Girne%20Turizm%20Meslek%20Lisesi%20Girne%20KKTC"
    },
    {
        "id":  29,
        "name":  "Güzelyurt Meslek Lisesi",
        "region":  "Güzelyurt",
        "lat":  35.191355,
        "lng":  32.988632,
        "verification":  "Yüksek",
        "source":  "OpenStreetMap okul bina kaydı",
        "sourceUrl":  "https://www.openstreetmap.org/way/698261640"
    },
    {
        "id":  30,
        "name":  "Güzelyurt Türk Maarif Koleji ",
        "region":  "Güzelyurt",
        "lat":  35.190924,
        "lng":  32.997516,
        "verification":  "Yüksek",
        "source":  "OpenStreetMap okul bina kaydı",
        "sourceUrl":  "https://www.openstreetmap.org/way/717257033"
    },
    {
        "id":  31,
        "name":  "Hala Sultan İlahiyat Koleji",
        "region":  "Lefkoşa",
        "lat":  35.219337,
        "lng":  33.422464,
        "verification":  "Yüksek",
        "source":  "OpenStreetMap okul bina kaydı",
        "sourceUrl":  "https://www.openstreetmap.org/way/498576539"
    },
    {
        "id":  32,
        "name":  "Haydarpaşa Ticaret Lisesi",
        "region":  "Lefkoşa",
        "lat":  35.193757,
        "lng":  33.352822,
        "verification":  "Yüksek",
        "source":  "OpenStreetMap okul bina kaydı",
        "sourceUrl":  "https://www.openstreetmap.org/way/443941515"
    },
    {
        "id":  33,
        "name":  "İrsen Küçük Ortaokulu",
        "region":  "Lefkoşa",
        "lat":  35.195794,
        "lng":  33.330229,
        "verification":  "Yüksek",
        "source":  "OpenStreetMap okul bina kaydı",
        "sourceUrl":  "https://www.openstreetmap.org/relation/2724616"
    },
    {
        "id":  34,
        "name":  "İskele Evkaf Türk Maarif Koleji",
        "region":  "İskele",
        "lat":  35.2848317,
        "lng":  33.8987798,
        "verification":  "Yüksek",
        "source":  "Google Haritalar okul kaydı",
        "sourceUrl":  "https://www.google.com/maps/search/?api=1\u0026query=%C4%B0skele%20Evkaf%20T%C3%BCrk%20Maarif%20Koleji%20%C4%B0skele%20KKTC"
    },
    {
        "id":  35,
        "name":  "İskele Ticaret Lisesi",
        "region":  "İskele",
        "lat":  35.286186,
        "lng":  33.897788,
        "verification":  "Yüksek",
        "source":  "OpenStreetMap okul bina kaydı",
        "sourceUrl":  "https://www.openstreetmap.org/way/1141515043"
    },
    {
        "id":  36,
        "name":  "Karpaz Meslek Lisesi",
        "region":  "İskele",
        "lat":  35.418631,
        "lng":  34.135107,
        "verification":  "Yüksek",
        "source":  "Google Haritalar okul kaydı",
        "sourceUrl":  "https://www.google.com/maps/search/?api=1\u0026query=Karpaz%20Meslek%20Lisesi%20%C4%B0skele%20KKTC"
    },
    {
        "id":  37,
        "name":  "Kurtuluş Lisesi",
        "region":  "Güzelyurt",
        "lat":  35.191339,
        "lng":  32.998077,
        "verification":  "Yüksek",
        "source":  "OpenStreetMap okul bina kaydı",
        "sourceUrl":  "https://www.openstreetmap.org/way/717257036"
    },
    {
        "id":  38,
        "name":  "Lapta Yavuzlar Lisesi",
        "region":  "Girne",
        "lat":  35.3408595,
        "lng":  33.1868434,
        "verification":  "Yüksek",
        "source":  "Google Haritalar okul kaydı",
        "sourceUrl":  "https://www.google.com/maps/search/?api=1\u0026query=Lapta%20Yavuzlar%20Lisesi%20Girne%20KKTC"
    },
    {
        "id":  39,
        "name":  "Lefke Gazi Lisesi",
        "region":  "Lefke",
        "lat":  35.106173,
        "lng":  32.856786,
        "verification":  "Yüksek",
        "source":  "OpenStreetMap okul bina kaydı",
        "sourceUrl":  "https://www.openstreetmap.org/way/701173120"
    },
    {
        "id":  40,
        "name":  "Lefkoşa Türk Lisesi",
        "region":  "Lefkoşa",
        "lat":  35.182878,
        "lng":  33.361743,
        "verification":  "Yüksek",
        "source":  "OpenStreetMap okul bina kaydı",
        "sourceUrl":  "https://www.openstreetmap.org/way/1273604201"
    },
    {
        "id":  41,
        "name":  "Levent Koleji",
        "region":  "Lefkoşa",
        "lat":  35.202908,
        "lng":  33.336266,
        "verification":  "Yüksek",
        "source":  "OpenStreetMap okul bina kaydı",
        "sourceUrl":  "https://www.openstreetmap.org/way/451330279"
    },
    {
        "id":  42,
        "name":  "Meral Vedat Ertüngü",
        "region":  "Lefkoşa",
        "lat":  35.200041,
        "lng":  33.308367,
        "verification":  "Yüksek",
        "source":  "OpenStreetMap okul bina kaydı",
        "sourceUrl":  "https://www.openstreetmap.org/way/967237431"
    },
    {
        "id":  43,
        "name":  "Muharrem Döveç Ortaokulu",
        "region":  "İskele",
        "lat":  35.2875416,
        "lng":  33.9141093,
        "verification":  "Yüksek",
        "source":  "Google Haritalar okul kaydı",
        "sourceUrl":  "https://www.google.com/maps/search/?api=1\u0026query=Muharrem%20D%C3%B6ve%C3%A7%20Ortaokulu%20%C4%B0skele%20KKTC"
    },
    {
        "id":  44,
        "name":  "Namık Kemal Lisesi",
        "region":  "Gazimağusa",
        "lat":  35.118669,
        "lng":  33.940712,
        "verification":  "Yüksek",
        "source":  "OpenStreetMap okul bina kaydı",
        "sourceUrl":  "https://www.openstreetmap.org/way/348035497"
    },
    {
        "id":  45,
        "name":  "Necat British College(Girne)",
        "region":  "Girne",
        "lat":  35.3371435,
        "lng":  33.2055603,
        "verification":  "Yüksek",
        "source":  "Google Haritalar okul kaydı",
        "sourceUrl":  "https://www.google.com/maps/search/?api=1\u0026query=Necat%20British%20College(Girne)%20Girne%20KKTC"
    },
    {
        "id":  46,
        "name":  "Necat British College(Lefkoşa)",
        "region":  "Lefkoşa",
        "lat":  35.221727,
        "lng":  33.360257,
        "verification":  "Yüksek",
        "source":  "OpenStreetMap okul bina kaydı",
        "sourceUrl":  "https://www.openstreetmap.org/way/872310299"
    },
    {
        "id":  47,
        "name":  "Oğuz Veli Ortaokulu",
        "region":  "Girne",
        "lat":  35.339947,
        "lng":  33.290164,
        "verification":  "Yüksek",
        "source":  "Google Haritalar okul kaydı",
        "sourceUrl":  "https://www.google.com/maps/search/?api=1\u0026query=O%C4%9Fuz%20Veli%20Ortaokulu%20Girne%20KKTC"
    },
    {
        "id":  48,
        "name":  "Osman Nejat Konuk Ortaokulu",
        "region":  "Girne",
        "lat":  35.3318375,
        "lng":  33.3497656,
        "verification":  "Yüksek",
        "source":  "Google Haritalar okul kaydı",
        "sourceUrl":  "https://www.google.com/maps/search/?api=1\u0026query=Osman%20Nejat%20Konuk%20Ortaokulu%20Girne%20KKTC"
    },
    {
        "id":  49,
        "name":  "Osman Örek Meslek Lisesi",
        "region":  "Lefkoşa",
        "lat":  35.210334,
        "lng":  33.335831,
        "verification":  "Yüksek",
        "source":  "OpenStreetMap okul bina kaydı",
        "sourceUrl":  "https://www.openstreetmap.org/way/1278805616"
    },
    {
        "id":  50,
        "name":  "Polatpaşa Lisesi",
        "region":  "Gazimağusa",
        "lat":  35.105965,
        "lng":  33.687441,
        "verification":  "Yüksek",
        "source":  "OpenStreetMap okul bina kaydı",
        "sourceUrl":  "https://www.openstreetmap.org/way/714739771"
    },
    {
        "id":  51,
        "name":  "Rauf Raif Denktaş Meslek Lisesi",
        "region":  "Lefkoşa",
        "lat":  35.1889155,
        "lng":  33.3204994,
        "verification":  "Yüksek",
        "source":  "Google Haritalar okul kaydı",
        "sourceUrl":  "https://www.google.com/maps/search/?api=1\u0026query=Rauf%20Raif%20Denkta%C5%9F%20Meslek%20Lisesi%20Lefko%C5%9Fa%20KKTC"
    },
    {
        "id":  52,
        "name":  "Sedat Simavi Endüstri Meslek Lisesi",
        "region":  "Lefkoşa",
        "lat":  35.183886,
        "lng":  33.36327,
        "verification":  "Yüksek",
        "source":  "OpenStreetMap okul bina kaydı",
        "sourceUrl":  "https://www.openstreetmap.org/way/1273604202"
    },
    {
        "id":  53,
        "name":  "Şht. Hüseyin Ruso Ortaokulu",
        "region":  "Lefkoşa",
        "lat":  35.191772,
        "lng":  33.36295,
        "verification":  "Yüksek",
        "source":  "OpenStreetMap okul bina kaydı",
        "sourceUrl":  "https://www.openstreetmap.org/way/506903835"
    },
    {
        "id":  54,
        "name":  "Şht. Turgut Ortaokulu",
        "region":  "Güzelyurt",
        "lat":  35.191939,
        "lng":  32.996821,
        "verification":  "Yüksek",
        "source":  "OpenStreetMap okul bina kaydı",
        "sourceUrl":  "https://www.openstreetmap.org/way/717257037"
    },
    {
        "id":  55,
        "name":  "Şht. Zeka Çorba Ortaokulu",
        "region":  "Gazimağusa",
        "lat":  35.2625465,
        "lng":  33.6626853,
        "verification":  "Yüksek",
        "source":  "Google Haritalar okul kaydı",
        "sourceUrl":  "https://www.google.com/maps/search/?api=1\u0026query=%C5%9Eht.%20Zeka%20%C3%87orba%20Ortaokulu%20Gazima%C4%9Fusa%20KKTC"
    },
    {
        "id":  56,
        "name":  "TED Koleji",
        "region":  "Lefkoşa",
        "lat":  35.214167,
        "lng":  33.328002,
        "verification":  "Yüksek",
        "source":  "OpenStreetMap okul bina kaydı",
        "sourceUrl":  "https://www.openstreetmap.org/way/435600044"
    },
    {
        "id":  57,
        "name":  "The English School of Kyrenia",
        "region":  "Girne",
        "lat":  35.316863,
        "lng":  33.343078,
        "verification":  "Yüksek",
        "source":  "OpenStreetMap okul bina kaydı",
        "sourceUrl":  "https://www.openstreetmap.org/node/10020202117"
    },
    {
        "id":  58,
        "name":  "Türk Maarif Koleji",
        "region":  "Lefkoşa",
        "lat":  35.192565,
        "lng":  33.36332,
        "verification":  "Yüksek",
        "source":  "OpenStreetMap okul bina kaydı",
        "sourceUrl":  "https://www.openstreetmap.org/relation/19576522"
    },
    {
        "id":  59,
        "name":  "Yakın  Doğu Koleji Yeniboğaziçi",
        "region":  "Gazimağusa",
        "lat":  35.1851368,
        "lng":  33.8906425,
        "verification":  "Yüksek",
        "source":  "Google Haritalar okul kaydı",
        "sourceUrl":  "https://www.google.com/maps/search/?api=1\u0026query=Yak%C4%B1n%20%20Do%C4%9Fu%20Koleji%20Yenibo%C4%9Fazi%C3%A7i%20Gazima%C4%9Fusa%20KKTC"
    },
    {
        "id":  60,
        "name":  "Yakın Doğu Koleji",
        "region":  "Lefkoşa",
        "lat":  35.227215996500831,
        "lng":  33.321456516540039,
        "verification":  "Yüksek",
        "source":  "Okulun resmî iletişim haritası",
        "sourceUrl":  "https://nec.k12.tr/iletisim/"
    }
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