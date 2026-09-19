---
id: setup-proyek-dan-ui-statis
title: 02. Setup Proyek & Pembangunan UI Statis (UI First)
sidebar_label: 02. Setup & UI Statis
sidebar_position: 2
description: Menyiapkan proyek Vite + React dan membangun antarmuka platform RWA Properti Fraksional lengkap dengan mockup state sebelum menyentuh kode Web3.
---

# 02. Setup Proyek & Pembangunan UI Statis (UI First)

---

Pada modul ini, kita akan memulai pengerjaan antarmuka dApp RWA dengan filosofi **UI First**: membangun tampilan visual lengkap beserta state interaktif sementara (*mockup state*). 

Dengan cara ini, peserta dapat melihat secara langsung bagaimana antarmuka investasi properti fraksional beroperasi di browser sebelum kita menghubungkannya dengan blockchain Arbitrum di modul berikutnya.

---

## 🚀 1. Inisialisasi Proyek Vite + React

Buka terminal di komputer Anda dan jalankan perintah berikut untuk membuat proyek React baru berbasis Vite:

```bash
# Buat proyek baru dengan template React
npm create vite@latest arbitrum-rwa-property -- --template react

# Masuk ke direktori proyek
cd arbitrum-rwa-property

# Pasang dependensi bawaan
npm install

# Pasang pustaka Web3 (ethers v6 dipin) dan paket ikon modern (lucide-react)
npm install ethers@6 lucide-react

# Buat direktori penampung komponen dan konfigurasi kontrak
mkdir -p src/components src/constants
```

### Struktur Direktori yang Akan Kita Buat

Susun file dan folder di dalam direktori `src/` hingga memiliki struktur rapi seperti ini:

```text
arbitrum-rwa-property/
├── src/
│   ├── components/
│   │   ├── Navbar.jsx             # Header, status jaringan Arbitrum, & tombol wallet
│   │   ├── PropertyCard.jsx       # Informasi properti, sertifikat IPFS, harga, & sisa fraksi
│   │   ├── InvestorPortfolio.jsx  # Portofolio jumlah lembar fraksi milik investor
│   │   ├── InvestBox.jsx          # Form pembelian unit fraksi & status transaksi
│   │   ├── IssuerPanel.jsx        # Panel kontrol pengelola aset (Restock kuota & Tarik dana)
│   │   └── TransactionHistory.jsx # Riwayat bukti transaksi on-chain & link Arbiscan (LocalStorage)
│   ├── App.jsx                    # Komponen utama penampung state dApp
│   ├── App.css                    # Tata letak grid dashboard dan cards
│   ├── index.css                  # Desain sistem global bertema Arbitrum Slate
│   └── main.jsx
├── package.json
└── vite.config.js
```

---

## 🎨 2. Desain Sistem Global (`src/index.css`)

Ganti seluruh isi file `src/index.css` dengan desain modern berikut. Gaya ini menggunakan palet gelap bernuansa ekosistem Arbitrum (*deep cyber-slate* dan neon cyan `#28a0f0`):

```css
:root {
  --bg-main: #0b1118;
  --bg-card: rgba(18, 27, 36, 0.75);
  --border-card: rgba(40, 160, 240, 0.2);
  --primary: #28a0f0;
  --primary-hover: #1b8cd4;
  --primary-glow: rgba(40, 160, 240, 0.35);
  --text-main: #f0f6fc;
  --text-muted: #8b949e;
  --accent-gold: #f59e0b;
  --accent-green: #10b981;
  --accent-red: #ef4444;
  font-family: 'Inter', system-ui, -apple-system, sans-serif;
  color-scheme: dark;
}

* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  background-color: var(--bg-main);
  background-image: 
    radial-gradient(at 0% 0%, rgba(40, 160, 240, 0.15) 0px, transparent 50%),
    radial-gradient(at 100% 100%, rgba(16, 185, 129, 0.08) 0px, transparent 50%);
  color: var(--text-main);
  min-height: 100vh;
  line-height: 1.5;
}

button {
  cursor: pointer;
  border: none;
  outline: none;
  font-family: inherit;
  transition: all 0.2s ease;
}

input {
  outline: none;
  font-family: inherit;
}
```

Perbarui juga file `src/App.css` untuk tata letak halaman:

```css
.app-container {
  max-width: 960px;
  margin: 0 auto;
  padding: 24px 16px 64px 16px;
}

.grid-dashboard {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  margin-top: 24px;
}

@media (max-width: 768px) {
  .grid-dashboard {
    grid-template-columns: 1fr;
  }
}

.card {
  background: var(--bg-card);
  backdrop-filter: blur(12px);
  border: 1px solid var(--border-card);
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
}

.card-title {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--primary);
  margin-bottom: 16px;
}

.status-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 12px;
  border-radius: 9999px;
  font-size: 0.85rem;
  font-weight: 500;
  background: rgba(40, 160, 240, 0.1);
  color: var(--primary);
  border: 1px solid rgba(40, 160, 240, 0.3);
}

.progress-bar-bg {
  width: 100%;
  height: 8px;
  background: rgba(255, 255, 255, 0.08);
  border-radius: 9999px;
  overflow: hidden;
  margin-top: 8px;
}

.progress-bar-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--primary), var(--accent-green));
  border-radius: 9999px;
  transition: width 0.4s ease;
}
```

---

## 🧩 3. Komponen Antarmuka RWA

Mari kita buat komponen UI satu per satu di dalam folder `src/components/`.

### 3.1. Komponen Navbar (`src/components/Navbar.jsx`)

Menampilkan identitas platform RWA, status jaringan Arbitrum Sepolia, dan tombol koneksi dompet:

```jsx
import React from 'react';
import { Wallet, ShieldCheck, Building2 } from 'lucide-react';

export default function Navbar({ account, onConnect, isConnecting }) {
  const formatAddress = (addr) => {
    if (!addr) return '';
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  return (
    <header style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '16px 20px',
      background: 'var(--bg-card)',
      border: '1px solid var(--border-card)',
      borderRadius: '16px'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{
          width: '42px',
          height: '42px',
          borderRadius: '10px',
          background: 'rgba(40, 160, 240, 0.15)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          border: '1px solid var(--primary)'
        }}>
          <Building2 size={24} color="var(--primary)" />
        </div>
        <div>
          <h1 style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>Arbitrum RWA Real Estate</h1>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Tokenized Property on Arbitrum Sepolia</p>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {/* Label target jaringan (pada Modul 04 akan diamankan secara dinamis via ensureArbitrumNetwork) */}
        <div className="status-badge">
          <ShieldCheck size={16} color="var(--accent-green)" />
          <span>Arbitrum Sepolia (421614)</span>
        </div>

        {account ? (
          <div style={{
            padding: '8px 16px',
            background: 'rgba(40, 160, 240, 0.15)',
            border: '1px solid var(--primary)',
            borderRadius: '12px',
            fontWeight: '600',
            fontSize: '0.9rem',
            color: 'var(--primary)'
          }}>
            {formatAddress(account)}
          </div>
        ) : (
          <button
            onClick={onConnect}
            disabled={isConnecting}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 20px',
              background: 'var(--primary)',
              color: '#fff',
              borderRadius: '12px',
              fontWeight: '600',
              boxShadow: '0 4px 14px var(--primary-glow)'
            }}
          >
            <Wallet size={18} />
            <span>{isConnecting ? 'Menghubungkan...' : 'Connect Wallet'}</span>
          </button>
        )}
      </div>
    </header>
  );
}
```

---

### 3.2. Komponen Informasi Properti (`src/components/PropertyCard.jsx`)

Menampilkan detail aset fisik, sertifikat IPFS, harga per unit fraksi, dan progress kuota yang tersedia:

```jsx
import React from 'react';
import { Home, Tag, Layers, FileText, ExternalLink } from 'lucide-react';

export default function PropertyCard({ propertyName, symbol, priceEth, availableFractions, totalFractions, documentURI }) {
  const total = Number(totalFractions) || 1000;
  const available = Number(availableFractions) || 0;
  const sold = Math.max(0, total - available);
  const percentSold = Math.min(100, Math.round((sold / total) * 100));

  return (
    <div className="card">
      <div className="card-title">
        <Home size={20} />
        <span>Detail Aset Properti (RWA)</span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '8px' }}>
        <div>
          <h2 style={{ fontSize: '1.3rem', fontWeight: 'bold', color: 'var(--text-main)' }}>
            {propertyName || 'Bali Sunset Villa #01'}
          </h2>
          <span style={{ fontSize: '0.85rem', color: 'var(--primary)', fontWeight: '600' }}>
            Ticker: {symbol || 'VILLA-BALI-01'}
          </span>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Tag size={18} /> Harga per Fraksi
          </span>
          <span style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--accent-gold)' }}>
            {priceEth} ETH
          </span>
        </div>

        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.9rem' }}>
            <span style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Layers size={18} /> Kuota Penjualan
            </span>
            <span>
              <strong>{available}</strong> / {total} Fraksi Tersedia
            </span>
          </div>
          <div className="progress-bar-bg">
            <div className="progress-bar-fill" style={{ width: `${percentSold}%` }}></div>
          </div>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px', textAlign: 'right' }}>
            {percentSold}% Terjual
          </p>
        </div>

        <div style={{
          padding: '10px 14px',
          background: 'rgba(255, 255, 255, 0.03)',
          borderRadius: '10px',
          fontSize: '0.85rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)' }}>
            <FileText size={16} /> Sertifikat BPN Legal
          </span>
          <a
            href={
              documentURI 
                ? (documentURI.startsWith('ipfs://') 
                    ? `https://ipfs.io/ipfs/${documentURI.replace('ipfs://', '')}` 
                    : documentURI) 
                : '#'
            }
            target="_blank"
            rel="noreferrer"
            style={{ color: 'var(--primary)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
          >
            Verifikasi On-Chain <ExternalLink size={14} />
          </a>
        </div>
      </div>
    </div>
  );
}
```

:::info Konversi Protokol IPFS ke HTTP Gateway di Frontend
Di smart contract, tautan dokumen disimpan dalam format standar protokol terdesentralisasi:
`ipfs://bafybeiexwukp7b44s42dk7fjybeduq4teqganfsmndrpxmr6im32meru3i`

Namun, peramban web umum (seperti Chrome, Safari, atau Edge) tidak dapat membuka protokol `ipfs://` secara langsung tanpa ekstensi IPFS node khusus. 

Oleh karena itu, pada baris kode di atas kita mengonversinya menggunakan **IPFS HTTP Gateway**:
```javascript
// Mengubah: "ipfs://bafybei..." 
// Menjadi:  "https://ipfs.io/ipfs/bafybei..."
const targetUrl = documentURI 
  ? (documentURI.startsWith('ipfs://') 
      ? `https://ipfs.io/ipfs/${documentURI.replace('ipfs://', '')}` 
      : documentURI) 
  : '#';
```
Dengan teknik ini, investor yang menekan tombol **"Verifikasi On-Chain"** akan otomatis membuka dokumen sertifikat tanah asli langsung di tab baru browser melalui gateway publik IPFS yang terdesentralisasi. *(Tips: Selain `ipfs.io`, Anda juga dapat memakai gateway cepat seperti `https://gateway.pinata.cloud/ipfs/${cid}`).*
:::

:::tip Dokumen IPFS Siap Pakai untuk Peserta Workshop
Jika peserta workshop tidak ingin repot mendaftar akun atau mengunggah file sertifikat mandiri ke IPFS/Pinata, gunakan **CID resmi workshop**:
```text
bafybeiexwukp7b44s42dk7fjybeduq4teqganfsmndrpxmr6im32meru3i
```
(Format URI: `ipfs://bafybeiexwukp7b44s42dk7fjybeduq4teqganfsmndrpxmr6im32meru3i`).

Nilai ini telah dijadikan nilai *default* di smart contract maupun mockup frontend kita, sehingga saat tombol **"Verifikasi On-Chain"** ditekan, browser akan langsung membuka dokumen sertifikat asli properti villa via gateway tanpa peserta harus upload manual terlebih dahulu.
:::

---

### 3.3. Komponen Portofolio Investor (`src/components/InvestorPortfolio.jsx`)

Menampilkan kepemilikan saham fraksional milik akun investor dan status proteksi cooldown:

```jsx
import React from 'react';
import { PieChart, Clock, Award } from 'lucide-react';

export default function InvestorPortfolio({ myFractions, priceEth, cooldownSeconds }) {
  const fractions = Number(myFractions) || 0;
  const price = parseFloat(priceEth) || 0.001;
  const estimatedValue = (fractions * price).toFixed(3);

  return (
    <div className="card">
      <div className="card-title">
        <PieChart size={20} />
        <span>Portofolio Kepemilikan Anda</span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '8px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Award size={18} /> Unit Fraksi Dimiliki
          </span>
          <span style={{ fontSize: '1.4rem', fontWeight: 'bold', color: 'var(--primary)' }}>
            {fractions} <small style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Lembar</small>
          </span>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ color: 'var(--text-muted)' }}>
            Estimasi Nilai Kepemilikan
          </span>
          <span style={{ fontSize: '1.1rem', fontWeight: 'bold', color: 'var(--accent-gold)' }}>
            ≈ {estimatedValue} ETH
          </span>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Clock size={18} /> Status Cooldown Anti-Spam
          </span>
          <span style={{
            fontSize: '0.9rem',
            color: cooldownSeconds > 0 ? 'var(--accent-red)' : 'var(--accent-green)',
            fontWeight: '600'
          }}>
            {cooldownSeconds > 0 ? `Tunggu ${cooldownSeconds} detik` : 'Siap Berinvestasi ⚡'}
          </span>
        </div>

        <div style={{
          padding: '10px 14px',
          background: 'rgba(255, 255, 255, 0.03)',
          borderRadius: '10px',
          fontSize: '0.85rem',
          color: 'var(--text-muted)'
        }}>
          💡 <em>Kepemilikan tercatat langsung di smart contract Arbitrum Sepolia dan mewakili hak atas aset fisik.</em>
        </div>
      </div>
    </div>
  );
}
```

---

### 3.4. Komponen Form Investasi (`src/components/InvestBox.jsx`)

Tempat investor menentukan jumlah fraksi yang ingin dibeli, melihat total pembayaran ETH, dan mengirimkan transaksi:

```jsx
import React, { useState } from 'react';
import { ShoppingBag, AlertCircle, CheckCircle2, Loader2, ExternalLink } from 'lucide-react';

export default function InvestBox({ priceEth, onInvest, isTransacting, txStatus, txHash, availableFractions }) {
  const [quantity, setQuantity] = useState(1);
  const price = parseFloat(priceEth || '0.001');
  const totalEth = (quantity * price).toFixed(4);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (quantity > 0) {
      onInvest(quantity);
    }
  };

  return (
    <div className="card" style={{ marginTop: '20px' }}>
      <div className="card-title">
        <ShoppingBag size={20} />
        <span>Beli Unit Fraksi Properti</span>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          <div style={{ flex: '1' }}>
            <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '6px' }}>
              Jumlah Unit Fraksi
            </label>
            <input
              type="number"
              min="1"
              max={availableFractions || 100}
              value={quantity}
              onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
              disabled={isTransacting}
              style={{
                width: '100%',
                padding: '12px 16px',
                background: 'rgba(0, 0, 0, 0.3)',
                border: '1px solid var(--border-card)',
                borderRadius: '10px',
                color: 'var(--text-main)',
                fontSize: '1rem',
                fontWeight: 'bold'
              }}
            />
          </div>

          <div style={{ flex: '1' }}>
            <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '6px' }}>
              Total Pembayaran (ETH)
            </label>
            <div style={{
              padding: '12px 16px',
              background: 'rgba(0, 0, 0, 0.15)',
              border: '1px dashed var(--border-card)',
              borderRadius: '10px',
              fontSize: '1.1rem',
              fontWeight: 'bold',
              color: 'var(--accent-gold)'
            }}>
              {totalEth} ETH
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={isTransacting || availableFractions === 0}
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: '10px',
            padding: '14px',
            background: isTransacting ? 'rgba(40, 160, 240, 0.5)' : 'var(--primary)',
            color: '#fff',
            borderRadius: '12px',
            fontSize: '1rem',
            fontWeight: 'bold',
            marginTop: '8px'
          }}
        >
          {isTransacting ? (
            <>
              <Loader2 size={20} className="animate-spin" />
              <span>Memproses Investasi di Arbitrum...</span>
            </>
          ) : (
            <>
              <span>🏢 Konfirmasi & Beli ({quantity} Lembar Fraksi)</span>
            </>
          )}
        </button>
      </form>

      {/* Banner status transaksi */}
      {txStatus && (
        <div style={{
          marginTop: '16px',
          padding: '12px 16px',
          borderRadius: '10px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          background: txStatus.type === 'error' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)',
          border: `1px solid ${txStatus.type === 'error' ? 'var(--accent-red)' : 'var(--accent-green)'}`
        }}>
          {txStatus.type === 'error' ? (
            <AlertCircle size={20} color="var(--accent-red)" />
          ) : (
            <CheckCircle2 size={20} color="var(--accent-green)" />
          )}
          <div style={{ flex: 1, fontSize: '0.9rem' }}>
            {txStatus.message}
            {txHash && (
              <div style={{ marginTop: '4px' }}>
                <a
                  href={`https://sepolia.arbiscan.io/tx/${txHash}`}
                  target="_blank"
                  rel="noreferrer"
                  style={{ color: 'var(--primary)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                >
                  Lihat Transaksi di Arbiscan Sepolia <ExternalLink size={14} />
                </a>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
```

---

### 3.5. Komponen Panel Pengelola Aset (`src/components/IssuerPanel.jsx`)

Panel ini khusus untuk pengelola aset (*Asset Issuer / Owner*) untuk menambah kuota dan mencairkan modal investasi:

```jsx
import React, { useState } from 'react';
import { Lock, PlusCircle, ArrowDownToLine } from 'lucide-react';

export default function IssuerPanel({ isOwner, onRestock, onWithdraw, isTransacting }) {
  const [restockAmount, setRestockAmount] = useState(250);

  if (!isOwner) return null; // Sembunyikan jika bukan pengelola sah

  return (
    <div className="card" style={{ marginTop: '20px', border: '1px solid rgba(245, 158, 11, 0.4)' }}>
      <div className="card-title" style={{ color: 'var(--accent-gold)' }}>
        <Lock size={20} />
        <span>Asset Issuer Dashboard (Kontrol Pengelola Properti)</span>
      </div>

      <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
        Anda terdeteksi sebagai <strong>Pengelola Sah Aset (Contract Owner)</strong>. Anda memiliki hak untuk menambah kuota fraksi penawaran dan mencairkan modal investasi ETH untuk operasional properti.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        <div style={{ display: 'flex', gap: '10px' }}>
          <input
            type="number"
            min="1"
            value={restockAmount}
            onChange={(e) => setRestockAmount(parseInt(e.target.value) || 0)}
            disabled={isTransacting}
            placeholder="Tambah kuota"
            style={{
              width: '100px',
              padding: '10px',
              background: 'rgba(0, 0, 0, 0.3)',
              border: '1px solid var(--border-card)',
              borderRadius: '10px',
              color: 'var(--text-main)'
            }}
          />
          <button
            onClick={() => onRestock(restockAmount)}
            disabled={isTransacting}
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              background: 'var(--accent-gold)',
              color: '#000',
              fontWeight: 'bold',
              borderRadius: '10px'
            }}
          >
            <PlusCircle size={18} />
            <span>Tambah Kuota</span>
          </button>
        </div>

        <button
          onClick={onWithdraw}
          disabled={isTransacting}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            background: 'var(--accent-green)',
            color: '#fff',
            fontWeight: 'bold',
            borderRadius: '10px'
          }}
        >
          <ArrowDownToLine size={18} />
          <span>Tarik Modal Investasi (Withdraw)</span>
        </button>
      </div>
    </div>
  );
}
```

---

### 3.6. Komponen Riwayat Bukti On-Chain (`src/components/TransactionHistory.jsx`)

Menampilkan riwayat transaksi on-chain yang tersimpan permanen di `localStorage` peramban lengkap dengan tautan audit langsung ke **Arbiscan Sepolia**:

```jsx
import React from 'react';
import { History, ExternalLink, CheckCircle2, Trash2, Clock } from 'lucide-react';

export default function TransactionHistory({ transactions, onClearHistory }) {
  const getBadgeStyle = (type) => {
    switch (type) {
      case 'Beli Fraksi':
        return {
          background: 'rgba(16, 185, 129, 0.12)',
          color: 'var(--accent-green)',
          borderColor: 'rgba(16, 185, 129, 0.3)'
        };
      case 'Restock Kuota':
        return {
          background: 'rgba(40, 160, 240, 0.12)',
          color: 'var(--primary)',
          borderColor: 'rgba(40, 160, 240, 0.3)'
        };
      case 'Tarik Modal':
        return {
          background: 'rgba(245, 158, 11, 0.12)',
          color: 'var(--accent-gold)',
          borderColor: 'rgba(245, 158, 11, 0.3)'
        };
      default:
        return {
          background: 'rgba(139, 148, 158, 0.12)',
          color: 'var(--text-muted)',
          borderColor: 'rgba(139, 148, 158, 0.3)'
        };
    }
  };

  const formatTime = (ts) => {
    if (!ts) return '';
    const date = new Date(ts);
    return date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) +
      ' · ' + date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
  };

  const truncateHash = (hash) => {
    if (!hash) return '';
    return `${hash.slice(0, 8)}...${hash.slice(-6)}`;
  };

  return (
    <div className="card" style={{ marginTop: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <div className="card-title" style={{ margin: 0 }}>
          <History size={20} />
          <span>Bukti Transaksi On-Chain (Arbiscan Proof)</span>
          <span style={{
            fontSize: '0.75rem',
            padding: '2px 8px',
            borderRadius: '12px',
            background: 'rgba(40, 160, 240, 0.15)',
            color: 'var(--primary)',
            marginLeft: '4px'
          }}>
            {transactions.length} Tersimpan
          </span>
        </div>

        {transactions.length > 0 && (
          <button
            onClick={onClearHistory}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '0.8rem',
              color: 'var(--text-muted)',
              background: 'transparent',
              padding: '4px 8px',
              borderRadius: '6px'
            }}
            title="Hapus riwayat lokal"
          >
            <Trash2 size={14} /> Bersihkan
          </button>
        )}
      </div>

      {transactions.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '28px 16px',
          background: 'rgba(255, 255, 255, 0.02)',
          borderRadius: '12px',
          border: '1px dashed rgba(255, 255, 255, 0.1)'
        }}>
          <Clock size={28} style={{ color: 'var(--text-muted)', marginBottom: '8px', opacity: 0.6 }} />
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Belum ada transaksi on-chain yang tersimpan.
          </p>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.78rem', marginTop: '4px', opacity: 0.75 }}>
            Lakukan pembelian fraksi untuk melihat bukti hash transaksi yang tercatat otomatis di LocalStorage dan Arbiscan!
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {transactions.map((tx, idx) => {
            const badge = getBadgeStyle(tx.type);
            return (
              <div
                key={tx.hash || idx}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '12px 16px',
                  background: 'rgba(255, 255, 255, 0.025)',
                  border: '1px solid rgba(255, 255, 255, 0.06)',
                  borderRadius: '10px',
                  flexWrap: 'wrap',
                  gap: '12px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: '3px 10px',
                      borderRadius: '6px',
                      fontSize: '0.75rem',
                      fontWeight: '600',
                      border: `1px solid ${badge.borderColor}`,
                      background: badge.background,
                      color: badge.color
                    }}
                  >
                    <CheckCircle2 size={12} />
                    {tx.type}
                  </span>

                  <div>
                    <div style={{ fontSize: '0.9rem', fontWeight: '500', color: 'var(--text-main)' }}>
                      {tx.description}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Clock size={12} /> {formatTime(tx.timestamp)}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <code style={{
                    fontSize: '0.8rem',
                    color: 'var(--text-muted)',
                    background: 'rgba(0,0,0,0.3)',
                    padding: '3px 8px',
                    borderRadius: '4px',
                    fontFamily: 'monospace'
                  }}>
                    {truncateHash(tx.hash)}
                  </code>

                  <a
                    href={`https://sepolia.arbiscan.io/tx/${tx.hash}`}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      fontSize: '0.82rem',
                      color: 'var(--primary)',
                      textDecoration: 'none',
                      padding: '4px 10px',
                      background: 'rgba(40, 160, 240, 0.1)',
                      border: '1px solid rgba(40, 160, 240, 0.25)',
                      borderRadius: '6px',
                      fontWeight: '500'
                    }}
                  >
                    Arbiscan <ExternalLink size={12} />
                  </a>
                </div>
              </div>
            );
          })}

          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '6px', textAlign: 'center' }}>
            💡 Riwayat transaksi ini tersimpan permanen di <strong>LocalStorage</strong> peramban dan terhubung langsung ke hash on-chain Arbitrum Sepolia.
          </p>
        </div>
      )}
    </div>
  );
}
```

---

## 🖥️ 4. Menyatukan Komponen dengan Mockup State (`src/App.jsx`)

Gabungkan seluruh komponen di dalam `src/App.jsx` menggunakan state simulasi (*mockup data*) sebelum kita menghubungkannya ke smart contract di modul berikutnya:

```jsx
import React, { useState } from 'react';
import Navbar from './components/Navbar';
import PropertyCard from './components/PropertyCard';
import InvestorPortfolio from './components/InvestorPortfolio';
import InvestBox from './components/InvestBox';
import IssuerPanel from './components/IssuerPanel';
import TransactionHistory from './components/TransactionHistory';
import './App.css';

export default function App() {
  // -------------------------------------------------------------
  // MOCKUP STATE (Akan digantikan oleh data Blockchain di Modul 04)
  // -------------------------------------------------------------
  const [account, setAccount] = useState(null);
  const [availableFractions, setAvailableFractions] = useState(990);
  const [myFractions, setMyFractions] = useState(10);
  const [isOwner, setIsOwner] = useState(true); // Ubah false/true untuk tes tampilan Issuer
  const [isTransacting, setIsTransacting] = useState(false);
  const [txStatus, setTxStatus] = useState(null);

  // Riwayat transaksi dengan LocalStorage persistence
  const [transactions, setTransactions] = useState(() => {
    try {
      const saved = localStorage.getItem('rwa_tx_history');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return [
      {
        hash: '0x3a7b8e1f5d6c9a4b2e0f183748291a0b5c7d8e9f1a2b3c4d5e6f7a8b9c0d1e2f',
        type: 'Beli Fraksi',
        description: 'Pembelian Awal 10 Fraksi (0.010 ETH)',
        timestamp: Date.now() - 3600000,
        status: 'Sukses'
      }
    ];
  });

  const addTransaction = (tx) => {
    setTransactions((prev) => {
      const updated = [tx, ...prev];
      localStorage.setItem('rwa_tx_history', JSON.stringify(updated));
      return updated;
    });
  };

  const handleClearHistory = () => {
    localStorage.removeItem('rwa_tx_history');
    setTransactions([]);
  };

  // Simulasi koneksi dompet
  const handleConnect = () => {
    setAccount('0x71C8364670D803859747974C650a3161394B884B');
  };

  // Simulasi investasi pembelian fraksi
  const handleInvest = (qty) => {
    setIsTransacting(true);
    setTxStatus({ type: 'info', message: 'Mengirim transaksi investasi ke Arbitrum Sepolia...' });

    setTimeout(() => {
      setIsTransacting(false);
      setAvailableFractions((prev) => prev - qty);
      setMyFractions((prev) => prev + qty);
      const mockHash = '0x' + Array.from({length: 64}, () => Math.floor(Math.random()*16).toString(16)).join('');
      addTransaction({
        hash: mockHash,
        type: 'Beli Fraksi',
        description: `Pembelian ${qty} Lembar Fraksi (${(qty * 0.001).toFixed(3)} ETH)`,
        timestamp: Date.now(),
        status: 'Sukses'
      });
      setTxStatus({
        type: 'success',
        message: `Sukses membeli ${qty} fraksi kepemilikan Bali Sunset Villa #01!`
      });
    }, 1500);
  };

  return (
    <div className="app-container">
      <Navbar account={account} onConnect={handleConnect} isConnecting={false} />

      <div className="grid-dashboard">
        <PropertyCard
          propertyName="Bali Sunset Villa #01"
          symbol="VILLA-BALI-01"
          priceEth="0.001"
          availableFractions={availableFractions}
          totalFractions={1000}
          // Default CID resmi workshop (peserta tidak perlu repot upload manual ke IPFS)
          documentURI="ipfs://bafybeiexwukp7b44s42dk7fjybeduq4teqganfsmndrpxmr6im32meru3i"
        />
        <InvestorPortfolio
          myFractions={myFractions}
          priceEth="0.001"
          cooldownSeconds={0}
        />
      </div>

      <InvestBox
        priceEth="0.001"
        onInvest={handleInvest}
        isTransacting={isTransacting}
        txStatus={txStatus}
        txHash={null}
        availableFractions={availableFractions}
      />

      <IssuerPanel
        isOwner={isOwner}
        onRestock={(amt) => {
          setAvailableFractions((prev) => prev + amt);
          const mockHash = '0x' + Array.from({length: 64}, () => Math.floor(Math.random()*16).toString(16)).join('');
          addTransaction({
            hash: mockHash,
            type: 'Restock Kuota',
            description: `Penambahan Kuota ${amt} Fraksi`,
            timestamp: Date.now(),
            status: 'Sukses'
          });
        }}
        onWithdraw={() => alert('Simulasi penarikan modal investasi berhasil!')}
        isTransacting={isTransacting}
      />

      <TransactionHistory
        transactions={transactions}
        onClearHistory={handleClearHistory}
      />
    </div>
  );
}
```

Jalankan dev server di terminal Anda:

```bash
npm run dev
```

Buka browser di `http://localhost:5173`. Anda akan melihat antarmuka platform RWA investasi properti yang sangat elegan, berkelas, dan interaktif!

> [!TIP]
> Di [Modul 03](./03-persiapan-abi-dan-konfigurasi-kontrak.md), kita akan mengambil **ABI** dari kontrak `FractionalProperty.sol` di Remix IDE dan menyiapkan konfigurasi Web3 asli.
