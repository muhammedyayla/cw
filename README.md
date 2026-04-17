# CharacterWorks React

Bu proje, CharacterWorks için React tabanlı bir arayüz sunar.

## Nasıl çalıştırılır

1. Terminalde proje dizinine geçin:
   ```bash
   cd c:\Users\my\Desktop\cw
   ```
2. Bağımlılıkları yükleyin:
   ```bash
   npm install
   ```
3. Geliştirme sunucusunu başlatın:
   ```bash
   npm run dev
   ```

## Sayfalar

- `/grid` - CharacterWorks grid kontrolü
- `/remote` - Remote kontrol arayüzü

## Notlar

- Grid verisi `POST /` ile alınır. Eğer CharacterWorks sunucunuz farklı bir adres kullanıyorsa `NEXT_PUBLIC_CW_BASE_URL` ortam değişkenini ayarlayabilirsiniz.
