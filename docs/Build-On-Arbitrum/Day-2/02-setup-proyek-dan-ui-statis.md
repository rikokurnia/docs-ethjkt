---
id: setup-proyek-dan-ui-statis
title: 02. Setup Proyek & Pembangunan UI Statis (UI First)
sidebar_label: 02. Setup & UI Statis
sidebar_position: 2
description: Menyiapkan proyek Vite + React dan membangun antarmuka Vending Machine lengkap dengan mockup state sebelum menyentuh kode Web3.
---

# 02. Setup Proyek & Pembangunan UI Statis (UI First)

---

Pada modul ini, kita akan memulai pengerjaan frontend dengan filosofi **UI First**: membangun antarmuka visual lengkap beserta state interaktif sementara (*mockup state*). 

Dengan cara ini, Anda dan pengguna dapat melihat secara nyata bagaimana aplikasi beroperasi sebelum kita menghubungkannya dengan blockchain di modul berikutnya.

---

## 🚀 1. Inisialisasi Proyek Vite + React

Buka terminal di komputer Anda dan jalankan perintah berikut untuk membuat proyek React baru berbasis Vite:

```bash
# Buat proyek baru dengan template React
npm create vite@latest arbitrum-vending-machine -- --template react

# Masuk ke direktori proyek
cd arbitrum-vending-machine

# Pasang dependensi proyek
npm install

# Pasang pustaka Web3 (ethers v6) dan ikon modern (lucide-react)
npm install ethers lucide-react
```

### Struktur Direktori yang Akan Kita Buat

Susun file dan folder di dalam direktori `src/` hingga memiliki struktur seperti ini:

```text
arbitrum-vending-machine/
├── src/
│   ├── components/
│   │   ├── Navbar.jsx          # Header, status jaringan, dan tombol wallet
│   │   ├── MachineStatus.jsx   # Informasi stok, harga, dan kondisi mesin
│   │   ├── UserInventory.jsx   # Sisa saldo cupcake milik user
│   │   ├── PurchaseBox.jsx     # Form input pembelian & tombol eksekusi
│   │   └── OwnerPanel.jsx      # Panel kontrol khusus pemilik (Restock & Withdraw)
│   ├── App.jsx                 # Komponen utama penampung state
│   ├── App.css                 # Gaya tata letak grid dan cards
│   ├── index.css               # Desain sistem global & palet warna Arbitrum
│   └── main.jsx
├── package.json
└── vite.config.js
```

---

## 🎨 2. Desain Sistem Global (`src/index.css`)

Ganti seluruh isi file `src/index.css` dengan CSS modern berikut. Gaya ini menggunakan tema gelap bernuansa ekosistem Arbitrum (*cyber-slate* dan neon cyan `#28a0f0`):

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

Dan perbarui file `src/App.css` untuk tata letak halaman:

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
```

---

## 🧩 3. Komponen Antarmuka Statis

Mari kita buat komponen UI satu per satu di dalam folder `src/components/`. Semua komponen ini dirancang mandiri dan menerima data melalui *props*.

### 3.1. Komponen Navbar (`src/components/Navbar.jsx`)

Komponen ini menampilkan branding dApp, indikator jaringan Arbitrum Sepolia, serta tombol koneksi dompet:

```jsx
import React from 'react';
import { Wallet, ShieldCheck } from 'lucide-react';

export default function Navbar({ account, onConnect, isConnecting }) {
  // Fungsi utilitas memotong tampilan address 0x1234...5678
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
        <span style={{ fontSize: '2rem' }}>🧁</span>
        <div>
          <h1 style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>Arbitrum Vending Machine</h1>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Solidity dApp on Arbitrum Sepolia</p>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
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

### 3.2. Komponen Status Mesin (`src/components/MachineStatus.jsx`)

Menampilkan ketersediaan stok cupcake di dalam mesin dan harga per buah dalam satuan ETH:

```jsx
import React from 'react';
import { Store, Tag, PackageCheck } from 'lucide-react';

export default function MachineStatus({ stock, priceEth }) {
  return (
    <div className="card">
      <div className="card-title">
        <Store size={20} />
        <span>Status Vending Machine</span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '12px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <PackageCheck size={18} /> Sisa Stok Mesin
          </span>
          <span style={{ fontSize: '1.4rem', fontWeight: 'bold', color: 'var(--text-main)' }}>
            {stock} <small style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Pcs</small>
          </span>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Tag size={18} /> Harga per Cupcake
          </span>
          <span style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--accent-gold)' }}>
            {priceEth} ETH
          </span>
        </div>

        <div style={{
          marginTop: '8px',
          padding: '10px 14px',
          background: 'rgba(255, 255, 255, 0.03)',
          borderRadius: '10px',
          fontSize: '0.85rem',
          color: 'var(--text-muted)'
        }}>
          💡 <em>Harga bersifat tetap sesuai aturan smart contract yang telah di-deploy.</em>
        </div>
      </div>
    </div>
  );
}
```

---

### 3.3. Komponen Inventory Pengguna (`src/components/UserInventory.jsx`)

Menampilkan jumlah cupcake yang berhasil dibeli oleh dompet pengguna saat ini:

```jsx
import React from 'react';
import { Backpack, Clock, Sparkles } from 'lucide-react';

export default function UserInventory({ userBalance, cooldownSeconds }) {
  return (
    <div className="card">
      <div className="card-title">
        <Backpack size={20} />
        <span>Inventory Dompet Anda</span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '12px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Sparkles size={18} /> Cupcake Dimiliki
          </span>
          <span style={{ fontSize: '1.4rem', fontWeight: 'bold', color: 'var(--primary)' }}>
            {userBalance} <small style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Pcs</small>
          </span>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Clock size={18} /> Aturan Cooldown
          </span>
          <span style={{
            fontSize: '0.9rem',
            color: cooldownSeconds > 0 ? 'var(--accent-red)' : 'var(--accent-green)',
            fontWeight: '600'
          }}>
            {cooldownSeconds > 0 ? `Tunggu ${cooldownSeconds}s` : 'Siap Beli ⚡'}
          </span>
        </div>

        <div style={{
          marginTop: '8px',
          padding: '10px 14px',
          background: 'rgba(255, 255, 255, 0.03)',
          borderRadius: '10px',
          fontSize: '0.85rem',
          color: 'var(--text-muted)'
        }}>
          ⏱️ <em>Cooldown mencegah pembelian bot yang berlebihan dalam rentang waktu singkat.</em>
        </div>
      </div>
    </div>
  );
}
```

---

### 3.4. Komponen Form Pembelian (`src/components/PurchaseBox.jsx`)

Tempat pengguna memasukkan kuantitas cupcake, melihat total biaya, dan mengirimkan transaksi:

```jsx
import React, { useState } from 'react';
import { ShoppingCart, AlertCircle, CheckCircle2, Loader2, ExternalLink } from 'lucide-react';

export default function PurchaseBox({ priceEth, onPurchase, isTransacting, txStatus, txHash }) {
  const [quantity, setQuantity] = useState(1);
  const totalEth = (quantity * parseFloat(priceEth || '0.0001')).toFixed(4);

  const handleBuy = (e) => {
    e.preventDefault();
    if (quantity > 0) {
      onPurchase(quantity);
    }
  };

  return (
    <div className="card" style={{ marginTop: '20px' }}>
      <div className="card-title">
        <ShoppingCart size={20} />
        <span>Beli Cupcake dari Arbitrum</span>
      </div>

      <form onSubmit={handleBuy} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          <div style={{ flex: '1' }}>
            <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '6px' }}>
              Jumlah Cupcake
            </label>
            <input
              type="number"
              min="1"
              max="20"
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
              Total Harga (ETH)
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
          disabled={isTransacting}
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
              <span>Memproses Transaksi di Arbitrum...</span>
            </>
          ) : (
            <>
              <span>🧁 Konfirmasi & Beli ({quantity} Pcs)</span>
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
                  Lihat di Arbiscan Sepolia <ExternalLink size={14} />
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

### 3.5. Komponen Panel Pemilik (`src/components/OwnerPanel.jsx`)

Panel ini dirancang secara terisolasi dan hanya akan muncul jika dompet yang terhubung cocok dengan alamat *deployer/owner*:

```jsx
import React, { useState } from 'react';
import { Lock, PlusCircle, ArrowDownToLine } from 'lucide-react';

export default function OwnerPanel({ isOwner, onRefill, onWithdraw, isTransacting }) {
  const [refillAmount, setRefillAmount] = useState(50);

  if (!isOwner) return null; // Role-based rendering: Sembunyikan jika bukan owner

  return (
    <div className="card" style={{ marginTop: '20px', border: '1px solid rgba(245, 158, 11, 0.4)' }}>
      <div className="card-title" style={{ color: 'var(--accent-gold)' }}>
        <Lock size={20} />
        <span>Owner Dashboard (Kontrol Pemilik)</span>
      </div>

      <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
        Anda terdeteksi sebagai <strong>Owner Kontrak</strong>. Anda memiliki hak akses eksklusif untuk menambah stok dan menarik saldo penjualan ETH.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        <div style={{ display: 'flex', gap: '10px' }}>
          <input
            type="number"
            min="1"
            value={refillAmount}
            onChange={(e) => setRefillAmount(parseInt(e.target.value) || 0)}
            disabled={isTransacting}
            placeholder="Jumlah refill"
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
            onClick={() => onRefill(refillAmount)}
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
            <span>Refill Stok</span>
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
          <span>Tarik Hasil Penjualan (Withdraw)</span>
        </button>
      </div>
    </div>
  );
}
```

---

## 🖥️ 4. Menyatukan Semua Komponen dengan Mockup State (`src/App.jsx`)

Sekarang, gabungkan seluruh komponen di dalam `src/App.jsx` menggunakan state simulasi (*mockup data*) agar kita bisa melihat bentuk antarmuka yang hidup:

```jsx
import React, { useState } from 'react';
import Navbar from './components/Navbar';
import MachineStatus from './components/MachineStatus';
import UserInventory from './components/UserInventory';
import PurchaseBox from './components/PurchaseBox';
import OwnerPanel from './components/OwnerPanel';
import './App.css';

export default function App() {
  // -------------------------------------------------------------
  // MOCKUP STATE (Akan digantikan oleh data Blockchain di Modul 04)
  // -------------------------------------------------------------
  const [account, setAccount] = useState(null);
  const [stock, setStock] = useState(80);
  const [userCupcakes, setUserCupcakes] = useState(3);
  const [isOwner, setIsOwner] = useState(true); // Ubah false/true untuk tes UI Owner
  const [isTransacting, setIsTransacting] = useState(false);
  const [txStatus, setTxStatus] = useState(null);

  // Simulasi koneksi dompet
  const handleConnect = () => {
    setAccount('0x71C8364670D803859747974C650a3161394B884B');
  };

  // Simulasi transaksi pembelian
  const handlePurchase = (qty) => {
    setIsTransacting(true);
    setTxStatus({ type: 'info', message: 'Mengirim transaksi ke Arbitrum Sepolia...' });

    setTimeout(() => {
      setIsTransacting(false);
      setStock((prev) => prev - qty);
      setUserCupcakes((prev) => prev + qty);
      setTxStatus({
        type: 'success',
        message: `Sukses membeli ${qty} cupcake!`
      });
    }, 1500);
  };

  return (
    <div className="app-container">
      <Navbar account={account} onConnect={handleConnect} isConnecting={false} />

      <div className="grid-dashboard">
        <MachineStatus stock={stock} priceEth="0.0001" />
        <UserInventory userBalance={userCupcakes} cooldownSeconds={0} />
      </div>

      <PurchaseBox
        priceEth="0.0001"
        onPurchase={handlePurchase}
        isTransacting={isTransacting}
        txStatus={txStatus}
        txHash="0xabc123...mock"
      />

      <OwnerPanel
        isOwner={isOwner}
        onRefill={(amt) => setStock((prev) => prev + amt)}
        onWithdraw={() => alert('Simulasi penarikan dana berhasil!')}
        isTransacting={isTransacting}
      />
    </div>
  );
}
```

Jalankan dev server di terminal Anda:

```bash
npm run dev
```

Buka URL lokal (biasanya `http://localhost:5173`) di browser Anda. Anda akan melihat antarmuka dApp yang rapi, interaktif, dan bertema Arbitrum! 

> [!TIP]
> Di [Modul 03](./03-persiapan-abi-dan-konfigurasi-kontrak.md), kita akan mengambil **ABI** dari Remix IDE dan mempersiapkan konfigurasi kontrak asli untuk menggantikan data *mockup* ini.
