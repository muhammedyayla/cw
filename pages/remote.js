import Head from 'next/head';
import Link from 'next/link';
import styles from '../styles/Home.module.css';

export default function RemotePage() {
  return (
    <>
      <Head>
        <title>CharacterWorks Remote</title>
      </Head>
      <main className={styles.main}>
        <div className={styles.card}>
          <h1>CharacterWorks Remote Kontrol</h1>
          <p>
            Bu sayfa CharacterWorks için React tabanlı bir remote kontrol arayüzü olarak hazırlandı. Buradan metin kontrolü ve motion yönetimi ekleyebilirsiniz.
          </p>
          <p>
            Şu anda grid kontrol sayfasını kullanarak CharacterWorks servisine erişebilirsiniz.
          </p>
          <Link className={styles.button} href="/grid">Grid Kontrolüne Dön</Link>
        </div>
      </main>
    </>
  );
}
