# Invoice Luxe Blog Sistemi (Netlify) - Kurulum

## 1. Dosyaları siteye ekle (sitenin kök klasörüne)
- build.js
- netlify.toml        (senin zaten bir netlify.toml dosyan varsa içindekileri birleştir)
- netlify/functions/daily-build.mjs
- content/blog/       (makaleler buraya)
- .gitignore          (blog/ ve sitemap-blog.xml build sırasında üretilir)

ÖNEMLİ: Sitenin Netlify'a **GitHub (Git) üzerinden** bağlı olması gerekiyor.
Zip'i sürükle-bırak ile yüklüyorsan build ve zamanlayıcı çalışmaz.
Sitede şu an /blog/ klasörü yoksa çakışma olmaz (varsa adını değiştir).

## 2. Build Hook oluştur
Netlify > Site configuration > Build & deploy > Build hooks > Add build hook
(ad: daily, branch: main) > çıkan URL'yi kopyala.

## 3. Ortam değişkeni
Site configuration > Environment variables > Add variable
- Key: BUILD_HOOK_URL
- Value: kopyaladığın hook URL'si

## 4. Robots ve Search Console
robots.txt dosyasına ekle:
Sitemap: https://invoiceluxe.com/sitemap-blog.xml
Search Console > Sitemaps bölümünden de sitemap-blog.xml gönder.

## 5. Makale ekleme
content/blog/ içine her makale için bir .md dosyası koy:

    2026-10-06-vat-for-freelancers.md

Dosyanın başı:

    ---
    title: Başlık
    description: 140-160 karakterlik açıklama
    date: 2026-10-06
    tool: Araç adı (kutuda görünür)
    toolUrl: /calculator.html?lang=en
    ---

- date bugünden ilerideyse makale yayınlanmaz, o gün gelince yayınlanır.
- "## FAQ" başlığı altındaki "### Soru" + cevap kısımları otomatik FAQ schema olur.
- draft: true yazarsan hiç yayınlanmaz.
- Dosya adı _ ile başlarsa yok sayılır.

## 6. Her gün otomatik yayın
Zamanlayıcı her gün 05:00 UTC'de build'i tetikler (Netlify Scheduled Function).
Saati değiştirmek için daily-build.mjs içindeki '0 5 * * *' değerini düzenle.
Netlify > Functions bölümünde "daily-build" görünmeli.

## 7. Araçlar ve yönlendirme (tools.json)
7 araç tools.json içinde tanımlı (invoice, discount, vat, pdf, sign, tax, pdftext).
Makalenin başına `toolId: discount` yazman yeter; buton adı, linki ve metni otomatik gelir.
- Makale sonunda ve ilk bölümden sonra araca giden buton/link otomatik çıkar.
- Her araç sayfasına şu işareti koy, build makale listesini içine kendisi yazar:
      <!--IL-GUIDES--><!--/IL-GUIDES-->
  (Sadece İngilizce sayfalara koy. İşaret yoksa build uyarı verir, sayfaya dokunmaz.)

## 8. Video demo
Kendi video klasörünü şu yola koy: /video/create-invoice/index.html
- /demo ve /video-demo adresleri otomatik oraya yönlenir.
- Klasör varsa blog menüsüne "Video demo" linki ve sitemap kaydı otomatik eklenir.
- Video sayfasına <title>, <meta description>, <link rel="canonical"> ve araca giden bir link koy.

## 9. Ana sayfa ve Tools sayfası butonları
site-snippets/buttons.html içindeki bloğu İngilizce ana sayfaya ve Tools sayfasına yapıştır:
"Watch: create an invoice (video)" + "Read the guides" butonları gelir.

## 10. Görseller
- Kapak: front matter'a  image: /images/blog/dosya.jpg  ve  imageAlt: açıklama  yaz (1200x630).
- Makale içi: gövdeye  ![Açıklama](/images/blog/ekran.jpg)  yaz (ayrı satırda).
- Kapak, blog listesinde küçük resim ve sosyal paylaşım (og:image) olarak da kullanılır.

## 11. Görseller klasörü ve tarih ayarı
- images/blog/ klasörünü de sitenin ana klasörüne koy (30 kapak/örnek kartı + 4 gerçek ekran görüntüsü).
- İlk batch 15 makale, 12 Ekim 2026'dan başlıyor (hafta içi her gün 1 makale, 30 Ekim'de bitiyor).
- Yayına çıkış gününü değiştirmek için (örnek: 19 Ekim'den başlasın):
      node reschedule.js 2026-10-19
  Hafta sonu dahil her gün yayın için sona 7 ekle:  node reschedule.js 2026-10-19 7
- Tarihi geçmiş makaleler ilk build'de hemen yayınlanır. Yayına almadan önce tarihleri ileri al.

## Bilgisayarda deneme
    node build.js                          -> bugüne kadar olanları üretir
    BUILD_DATE=2026-12-31 node build.js    -> gelecekteki makaleleri de önizler
Sonra blog/index.html dosyasını tarayıcıda aç.

## Araç sayfalarından makaleye link (statik)
Her araç sayfasının altına, ilgili makaleye normal <a href="/blog/slug/"> linki koy.
blog/latest.json son 10 makaleyi verir (isteğe bağlı "Latest Guides" kutusu için).
