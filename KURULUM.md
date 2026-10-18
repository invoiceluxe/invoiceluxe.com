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


---
# 2026-10-16 GÜNCELLEMESİ

## 1) Makale sayacı (kaç kişi okudu / kaç kez açıldı)
Kod hazır (`api/view.js`, `api/stats.js`, `blog-stats.html`). Çalışması için **bir kez** şunları yap:

1. Vercel → projen → **Storage** → **Create Database** → **Upstash Redis** (ücretsiz plan yeter) → projeye bağla. `KV_REST_API_URL` ve `KV_REST_API_TOKEN` otomatik eklenir.
2. Vercel → **Settings → Environment Variables** → `STATS_TOKEN` ekle (uzun, tahmin edilemez bir şifre; paneli açmak için kullanacaksın). İstersen `STATS_SALT` de ekle (rastgele bir metin).
3. **Redeploy** yap.
4. Paneli aç: `https://invoiceluxe.com/blog-stats.html` → STATS_TOKEN'ı gir.

Panelde her makale için: toplam açılma, tekil okuyucu, bugün / 7 gün / 30 gün, son 14 günün mini grafiği ve ülkeler görünür.

- Açılma: aynı kişinin 30 dk içindeki yenilemeleri sayılmaz. Botlar (Googlebot dahil) sayılmaz.
- Çerez yok, IP saklanmaz (tuzlanmış hash). Kişilerin kimliği tutulmaz; bu GDPR açısından da güvenli.
- Makalede herkese görünen "N readers" satırı, okuyucu sayısı **20**'ye ulaşınca görünür. Eşik: `build.js` içinde `COUNTER_MIN_PUBLIC`.
- Redis bağlı değilse site normal çalışır, sayaç sessizce kapalı kalır.

## 2) Yeni makaleler (zamanlanmış)
`content/blog/` içinde 15 yeni makale: **2 Kasım → 16 Kasım 2026** (günde 1). Kapak görselleri `images/blog/`.
Build, tarihi bugünden ileri olan makaleleri üretmez; yani Google o güne kadar sayfayı, sitemap'i, RSS'i ve blog listesini göremez. Her gün 05:10 UTC'deki otomatik deploy yeni günün makalesini yayına alır.
Yeni kapak üretmek için: `python3 make_covers.py` (listeye satır ekle).

## 3) Logo
Yeni logo tüm ikonlara uygulandı: `apple-touch-icon.png`, `icon-192/512.png`, `icon-maskable-512.png`, `favicon.ico`, `favicon-32.png`, `logo.png`, `logo-mark.png` (şeffaf amblem), `og-image.jpg`. Sayfalardaki eski SVG amblem (30 sayfa) ve blog başlığı yeni amblemle değişti. Service worker önbelleği v3'e yükseltildi.

## 4) Sitemap / Search Console düzeltmeleri
- **404 sebebi**: Sitemap temizdi; hatalar sayfaların içindeki eski `hreflang` ve `canonical` etiketlerinden geliyordu (eski kök URL'ler, `?lang=` URL'leri, yabancı alan adları). 838 sayfanın canonical + hreflang etiketleri yeniden yazıldı; ölü hreflang kalmadı.
- `sitemap.xml` yeniden üretildi: yalnızca var olan, kendi kendine canonical olan, indekslenebilir 748 URL + hreflang karşılıkları.
- `vercel.json`: eski URL'ler için 261 kalıcı yönlendirme, `/xx/index.html → /xx/`, `/?lang=xx → /xx/`, uzantısız `/xx/sayfa → /xx/sayfa.html`.
- Taslak/çöp dosyalar (`kopie`, `tools6`, `toolsr`, `herramientas1`, `customers1`, `Online ALV-laskuri #U2013…`) ve eski `blogsys/` klasörü `_removed-drafts/` içine taşındı (yayında 404 verir).
- Boş "React Artifact" başlıklı 8 sayfaya başlık + açıklama eklendi.

### Deploy sonrası Search Console'da yapılacaklar
1. `sitemap.xml` ve `sitemap-blog.xml` dosyalarını tekrar gönder.
2. "Niet gevonden (404)" raporunda **Validatie starten** (yeni doğrulama) → Google 1-2 hafta içinde eski URL'leri düşürür.
3. "Pagina met omleiding" (yönlendirme) hata değildir: http→https, www, `index.html`, `?lang=` URL'lerinin yönlendirmesi normal. Doğrulama "mislukt" görünmesi beklenen bir durum; düzeltilecek bir şey yok.
4. Vercel → Domains: `www.invoiceluxe.com` → `invoiceluxe.com` yönlendirmesinin (308) açık olduğunu kontrol et.
5. "Gecrawld, momenteel niet geïndexeerd" 3 URL (`no/pdf-verktoy`, `sv/pdf-verktyg`, `nl/online-vat-calculator`): teknik hata değil, içerik/iç link gücü meselesi; bu sayfalara ana sayfadan/araçlar sayfasından iç link ver.
