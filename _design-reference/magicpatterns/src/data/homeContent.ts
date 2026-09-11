export const ASSETS = {
  heroImage: 'assets/images/home/hero-guvenli-okul.png',
  polvakLogo: 'assets/logos/polvak-logo.png',
  policeLogo: 'assets/logos/polis-logo.png',
  reportQr: 'assets/qr/guvenli-okul-ihbar-qr.png'
};

export type TopicAccent = 'navy' | 'green' | 'purple' | 'red' | 'blue';

export interface Topic {
  id: string;
  title: string;
  accent: TopicAccent;
  items: string[];
}

export const TOPICS: Topic[] = [
{
  id: 'suc',
  title: 'Suç ve suçludan korunma',
  accent: 'navy',
  items: [
  'Suçtan korunma yolları',
  'Hak ve sorumluluklarımız',
  'Siber suçlar',
  'Zorbalık (akran zorbalığı)',
  'Şiddetle mücadele',
  'Tütün ürünleri satışlarının kontrolü',
  'Kişisel güvenlik']

},
{
  id: 'trafik',
  title: 'Trafik güvenliği',
  accent: 'green',
  items: [
  'Yaya ve okul geçitlerinde güvenlik',
  'Servis araçlarında güvenlik',
  'Okul önlerine park yapma kuralları',
  'Trafik kurallarına uyma',
  'Güvenli bisiklet kullanımı']

},
{
  id: 'bagimlilik',
  title: 'Bağımlılıkla mücadele',
  accent: 'purple',
  items: [
  'Uyuşturucu maddeler ve zararları',
  'Bağımlılıkla mücadele',
  'Madde kullanımına yönlendiren riskler',
  'Doğru arkadaş seçimi',
  'Yasa dışı madde kullanımına basamak teşkil edecek maddeleri okul ve okul çevrelerinden uzaklaştırma',
  'Yardım alabileceğiniz yerler']

},
{
  id: 'itfaiye',
  title: 'İtfaiye güvenliği',
  accent: 'red',
  items: [
  'Yangın güvenliği',
  'Tahliye kuralları',
  'Yangın söndürücü kullanımı',
  'Acil durumlarda doğru davranışlar']

},
{
  id: 'scooter',
  title: 'Scooter kullanımı',
  accent: 'blue',
  items: [
  "KKTC'de 18 yaşından küçüklerin scooter (kickscooter) kullanması yasaktır.",
  'Okul alanlarında scooter kullanımı uygun değildir.',
  'Trafik kurallarına uyun, kendinizin ve başkalarının güvenliğini tehlikeye atmayın.']

}];


export const AWARENESS_ITEMS: string[] = [
'Şüpheli kişi ve durumları bildiriniz.',
'Güvenlik zaafiyetlerini paylaşınız.',
'Trafik kurallarına aykırı davranışları bildiriniz.',
'Suç ihtiva eden durumları paylaşınız.',
'Okul içinde ve okul dışında çocuklardan öğrenilip polisin bilmesi gereken hususları iletiniz.',
'Sosyal medya kullanımındaki usulsüzlükleri bildiriniz.'];


export const REMINDERS: string[] = [
'Bir ihbar, bir hayat kurtarır.',
'Güvenli okul, mutlu öğrenci demektir.',
'Mutlu öğrenci, mutlu bir gelecek demektir.'];