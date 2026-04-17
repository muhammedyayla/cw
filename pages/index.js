import Link from 'next/link';
import Head from 'next/head';
import styles from '../styles/Home.module.css';

export default function Home() {
  return (
    <>
      <Head>
        <title>CharacterWorks React</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <main className={styles.main}>
        <div className={styles.card}>
          <h1 className={styles.title}>CharacterWorks React</h1>
          <p className={styles.description}>Bu proje, CharacterWorks grid kontrolünü React ve Node.js tabanlı Next.js ile yeniden inşa eder.</p>
          <div className={styles.links}>
            <Link className={styles.button} href="/grid">Grid Kontrolör</Link>
            <Link className={styles.button} href="/remote">Remote Kontrolör</Link>
          </div>
        </div>
      </main>
    </>
  );
}
