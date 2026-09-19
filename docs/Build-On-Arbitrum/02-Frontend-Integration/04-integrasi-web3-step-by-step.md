---
id: integrasi-web3-step-by-step
title: 04. Integrasi Web3 Langkah demi Langkah
sidebar_label: 04. Integrasi Web3 Lengkap
sidebar_position: 4
description: Menghubungkan MetaMask, membaca state kontrak RWA, mengeksekusi investasi fraksi dengan ETH, mengaktifkan Issuer Panel, dan menangkap real-time events.
---

# 04. Integrasi Web3 Langkah demi Langkah

---

Sekarang tibalah saatnya menyatukan seluruh elemen: **menghidupkan antarmuka React statis dari Modul 02 dengan smart contract nyata `FractionalProperty.sol` di Arbitrum Sepolia menggunakan pustaka `ethers.js` v6**.

Kita akan mengintegrasikan 5 kapabilitas Web3 utama secara bertahap:
1. **Connect Wallet & Network Guard**: Otentikasi dompet pengguna & auto-switch jaringan ke Arbitrum Sepolia (`421614`).
2. **Read Operations**: Membaca data on-chain properti (nama, harga, sisa fraksi, dokumen IPFS, dan saldo investor) tanpa biaya gas.
3. **Write Operations**: Mengirim transaksi investasi pembelian unit fraksi properti dengan nilai ETH (`payable`).
4. **Role-Based Issuer Controls**: Membuka fitur pengelola aset (*Restock* fraksi & penarikan modal investasi) jika akun aktif adalah `owner`.
5. **Real-time Event Listeners**: Mendengarkan pembaruan transaksi pembelian di blockchain secara langsung (*live update*).

---

## 🔌 1. Langkah 1: Connect Wallet & Network Guard

Untuk berinteraksi dengan smart contract di browser, aplikasi web meminta akses ke dompet pengguna melalui standar antarmuka **EIP-1193** (`window.ethereum`). Selain meminta otentikasi, kita wajib memastikan dompet pengguna terhubung ke **Arbitrum Sepolia** (Chain ID: `421614`).

### Kode Logika Koneksi & Pergantian Jaringan

```javascript
import { ethers } from 'ethers';
import {
  PROPERTY_CONTRACT_ADDRESS,
  FRACTIONAL_PROPERTY_ABI,
  ARBITRUM_SEPOLIA_HEX_ID,
  ARBITRUM_SEPOLIA_NETWORK_PARAMS
} from './constants/contract';

// 1. Meminta izin akun dompet pengguna
const connectWallet = async () => {
  if (!window.ethereum) {
    alert("MetaMask tidak terdeteksi! Silakan instal ekstensi MetaMask.");
    return;
  }

  try {
    // Meminta izin daftar akun dari dompet pengguna
    const accounts = await window.ethereum.request({
      method: 'eth_requestAccounts'
    });
    
    // Pastikan dompet berada di jaringan Arbitrum Sepolia
    await checkAndSwitchNetwork();

    return accounts[0];
  } catch (error) {
    console.error("Gagal menghubungkan wallet:", error);
  }
};

// 2. Memastikan jaringan adalah Arbitrum Sepolia (Chain ID: 421614 / 0x66eee)
const checkAndSwitchNetwork = async () => {
  try {
    // Coba beralih ke Arbitrum Sepolia jika sudah terdaftar di MetaMask
    await window.ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: ARBITRUM_SEPOLIA_HEX_ID }],
    });
  } catch (switchError) {
    // Error 4902: Jaringan belum terdaftar di MetaMask, daftarkan secara otomatis!
    if (switchError.code === 4902) {
      await window.ethereum.request({
        method: 'wallet_addEthereumChain',
        params: [ARBITRUM_SEPOLIA_NETWORK_PARAMS],
      });
    } else {
      throw switchError;
    }
  }
};
```

---

## 📖 2. Langkah 2: Membaca Data Kontrak (*Read Calls*)

Untuk membaca data, kita membuat instance `ethers.BrowserProvider` dan objek `ethers.Contract`. Karena fungsi-fungsi ini bertipe `view`, pemanggilan ini **gratis biaya gas** dan tidak memicu popup tanda tangan di MetaMask.

```javascript
const loadPropertyData = async (userAddress) => {
  try {
    const provider = new ethers.BrowserProvider(window.ethereum);
    const contract = new ethers.Contract(
      PROPERTY_CONTRACT_ADDRESS,
      FRACTIONAL_PROPERTY_ABI,
      provider
    );

    // 1. Membaca metadata aset properti
    const propertyName = await contract.propertyName();
    const propertySymbol = await contract.propertySymbol();
    const documentURI = await contract.propertyDocumentURI();
    const rawPrice = await contract.fractionPrice();
    const totalFractions = await contract.totalFractions();
    const availableFractions = await contract.availableFractions();
    const contractOwner = await contract.owner();

    // 2. Membaca data spesifik investor jika alamat sudah terhubung
    let userFractions = 0;
    let remainingCooldown = 0;

    if (userAddress) {
      const rawUserBalance = await contract.getInvestorFractions(userAddress);
      userFractions = Number(rawUserBalance);

      const lastTimestamp = await contract.lastInvestmentTime(userAddress);
      const cooldownDuration = await contract.COOLDOWN_PERIOD();
      
      // Menghitung sisa waktu cooldown di antarmuka (Date.now()/1000 digunakan sebagai estimasi visual UX lokal,
      // sedangkan validasi final dan absolut tetap dilakukan oleh smart contract via block.timestamp di Arbitrum)
      const currentBlockTime = Math.floor(Date.now() / 1000);
      const elapsed = currentBlockTime - Number(lastTimestamp);
      remainingCooldown = Math.max(0, Number(cooldownDuration) - elapsed);
    }

    return {
      propertyName,
      propertySymbol,
      documentURI,
      priceEth: ethers.formatEther(rawPrice),
      rawPriceWei: rawPrice,
      totalFractions: Number(totalFractions),
      availableFractions: Number(availableFractions),
      userFractions,
      isOwner: userAddress ? userAddress.toLowerCase() === contractOwner.toLowerCase() : false,
      remainingCooldown
    };
  } catch (err) {
    console.error("Gagal membaca data on-chain properti:", err);
  }
};
```

---

## ✍️ 3. Langkah 3: Menjalankan Transaksi Investasi (*Write Call*)

Pembelian unit fraksi properti memodifikasi *state* di blockchain Arbitrum dan membutuhkan pengiriman dana ETH (`payable`). Oleh karena itu, kita harus menggunakan **Signer** dari MetaMask untuk menandatangani transaksi:

```javascript
const investInFractions = async (quantity, rawPriceWei) => {
  try {
    const provider = new ethers.BrowserProvider(window.ethereum);
    // Mengambil signer dari dompet aktif
    const signer = await provider.getSigner();

    // Inisialisasi kontrak dengan Signer
    const contractWithSigner = new ethers.Contract(
      PROPERTY_CONTRACT_ADDRESS,
      FRACTIONAL_PROPERTY_ABI,
      signer
    );

    // Hitung total pembayaran dalam satuan Wei (BigInt)
    const totalCostWei = BigInt(quantity) * BigInt(rawPriceWei);

    // Eksekusi pemanggilan fungsi payable buyFractions
    const tx = await contractWithSigner.buyFractions(quantity, {
      value: totalCostWei
    });

    console.log("Transaksi terkirim ke Arbitrum Sepolia:", tx.hash);

    // Tunggu konfirmasi blok Arbitrum (~250ms - 1 detik)
    const receipt = await tx.wait();
    console.log("Transaksi terkonfirmasi di blok:", receipt.blockNumber);

    return { success: true, hash: tx.hash };
  } catch (error) {
    console.error("Investasi gagal:", error);
    
    // Ekstrak pesan revert require yang ramah bagi pengguna
    let errorMsg = "Transaksi dibatalkan atau gagal dieksekusi.";
    if (error.reason) {
      errorMsg = error.reason;
    } else if (error.message && error.message.includes("Tunggu cooldown")) {
      errorMsg = "Harap tunggu periode cooldown anti-spam selesai sebelum membeli lagi!";
    } else if (error.message && error.message.includes("user rejected action")) {
      errorMsg = "Transaksi dibatalkan oleh pengguna di MetaMask.";
    }
    return { success: false, error: errorMsg };
  }
};
```

---

## 🔒 4. Langkah 4: Operasi Panel Pengelola Aset (*Issuer Controls*)

Jika `isOwner === true` (alamat dompet aktif sama dengan pemilik sah kontrak), pengelola aset properti dapat mengeksekusi fungsi manajerial:

```javascript
// 1. Menambah kuota fraksi penawaran ke pasar
const restockPropertyFractions = async (additionalAmount) => {
  const provider = new ethers.BrowserProvider(window.ethereum);
  const signer = await provider.getSigner();
  const contract = new ethers.Contract(
    PROPERTY_CONTRACT_ADDRESS,
    FRACTIONAL_PROPERTY_ABI,
    signer
  );

  const tx = await contract.restockFractions(additionalAmount);
  await tx.wait();
};

// 2. Menarik seluruh modal investasi ETH ke dompet pengelola
const withdrawInvestmentFunds = async () => {
  const provider = new ethers.BrowserProvider(window.ethereum);
  const signer = await provider.getSigner();
  const contract = new ethers.Contract(
    PROPERTY_CONTRACT_ADDRESS,
    FRACTIONAL_PROPERTY_ABI,
    signer
  );

  const tx = await contract.withdrawFunds();
  await tx.wait();
};
```

---

## 📡 5. Langkah 5: Real-Time Event Listener

Smart contract `FractionalProperty.sol` memancarkan event `FractionPurchased` dan `FractionsRestocked`. 

Dengan memasang listener di React, antarmuka kita akan otomatis memperbarui kuota fraksi secara **real-time** saat ada transaksi masuk (bahkan jika pembelian dilakukan oleh investor lain dari perangkat berbeda!):

```javascript
// Pasang event listener saat komponen dimuat
useEffect(() => {
  if (!window.ethereum) return;

  const provider = new ethers.BrowserProvider(window.ethereum);
  const contract = new ethers.Contract(
    PROPERTY_CONTRACT_ADDRESS,
    FRACTIONAL_PROPERTY_ABI,
    provider
  );

  // Tangkap event pembelian unit fraksi
  const onFractionPurchased = (investor, amount, totalCost, remainingFractions) => {
    console.log(`Event: ${investor} baru saja membeli ${amount} fraksi! Sisa kuota: ${remainingFractions}`);
    refreshData();
  };

  // Tangkap event penambahan kuota fraksi
  const onFractionsRestocked = (additionalFractions, newAvailableFractions) => {
    console.log(`Event: Kuota ditambah ${additionalFractions}. Total sisa: ${newAvailableFractions}`);
    refreshData();
  };

  // Tangkap event penarikan modal pengelola aset
  const onFundsWithdrawn = (owner, amount) => {
    console.log(`Event: Modal ditarik oleh ${owner} sebesar ${ethers.formatEther(amount)} ETH`);
    refreshData();
  };

  contract.on("FractionPurchased", onFractionPurchased);
  contract.on("FractionsRestocked", onFractionsRestocked);
  contract.on("FundsWithdrawn", onFundsWithdrawn);

  // Bersihkan listener saat komponen unmount agar tidak terjadi kebocoran memori
  return () => {
    contract.off("FractionPurchased", onFractionPurchased);
    contract.off("FractionsRestocked", onFractionsRestocked);
    contract.off("FundsWithdrawn", onFundsWithdrawn);
  };
}, [account]);
```

---

## 🚀 6. Kode Terpadu Komponen Utama (`src/App.jsx`)

:::tip Opsi Cepat: Dokumen IPFS Siap Pakai untuk Workshop
Agar peserta tidak perlu repot melakukan registrasi akun dan upload mandiri ke IPFS saat sesi berlangsung, variabel state `documentURI` telah diinisialisasi dengan **CID resmi workshop**:
```text
bafybeiexwukp7b44s42dk7fjybeduq4teqganfsmndrpxmr6im32meru3i
```
Dengan format URI `ipfs://bafybeiexwukp7b44s42dk7fjybeduq4teqganfsmndrpxmr6im32meru3i`, dokumen sertifikat legalitas villa dapat langsung dibuka dan diverifikasi on-chain sejak awal tanpa konfigurasi tambahan.
:::

Sekarang, satukan seluruh alur Web3 di atas ke dalam file `src/App.jsx`. Ganti isi file `src/App.jsx` Anda dengan kode produksi lengkap berikut:

```jsx
import React, { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import Navbar from './components/Navbar';
import PropertyCard from './components/PropertyCard';
import InvestorPortfolio from './components/InvestorPortfolio';
import InvestBox from './components/InvestBox';
import IssuerPanel from './components/IssuerPanel';
import TransactionHistory from './components/TransactionHistory';
import {
  PROPERTY_CONTRACT_ADDRESS,
  FRACTIONAL_PROPERTY_ABI,
  ARBITRUM_SEPOLIA_HEX_ID,
  ARBITRUM_SEPOLIA_NETWORK_PARAMS
} from './constants/contract';
import './App.css';

export default function App() {
  // -------------------------------------------------------------
  // STATE MANAGEMENT dApp
  // -------------------------------------------------------------
  const [account, setAccount] = useState(null);
  const [propertyName, setPropertyName] = useState('Bali Sunset Villa #01');
  const [symbol, setSymbol] = useState('VILLA-BALI-01');
  // Default CID resmi workshop (peserta tidak perlu repot upload manual ke IPFS)
  const [documentURI, setDocumentURI] = useState('ipfs://bafybeiexwukp7b44s42dk7fjybeduq4teqganfsmndrpxmr6im32meru3i');
  const [totalFractions, setTotalFractions] = useState(1000);
  const [availableFractions, setAvailableFractions] = useState(0);
  const [priceEth, setPriceEth] = useState('0.001');
  const [rawPriceWei, setRawPriceWei] = useState(ethers.parseEther('0.001'));
  const [myFractions, setMyFractions] = useState(0);
  const [cooldownSeconds, setCooldownSeconds] = useState(0);
  const [isOwner, setIsOwner] = useState(false);

  const [isConnecting, setIsConnecting] = useState(false);
  const [isTransacting, setIsTransacting] = useState(false);
  const [txStatus, setTxStatus] = useState(null);
  const [txHash, setTxHash] = useState(null);

  // -------------------------------------------------------------
  // RIWAYAT TRANSAKSI ON-CHAIN DENGAN LOCALSTORAGE PERSISTENCE
  // -------------------------------------------------------------
  const [transactions, setTransactions] = useState(() => {
    try {
      const saved = localStorage.getItem('rwa_tx_history');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Gagal membaca localStorage:', e);
    }
    return [];
  });

  const addTransaction = useCallback((tx) => {
    setTransactions((prev) => {
      const updated = [tx, ...prev];
      try {
        localStorage.setItem('rwa_tx_history', JSON.stringify(updated));
      } catch (e) {
        console.error('Gagal menyimpan transaksi ke localStorage:', e);
      }
      return updated;
    });
  }, []);

  const handleClearHistory = useCallback(() => {
    try {
      localStorage.removeItem('rwa_tx_history');
    } catch (e) {
      console.error('Gagal membersihkan localStorage:', e);
    }
    setTransactions([]);
  }, []);

  // -------------------------------------------------------------
  // FUNGSI SWITCH / ADD NETWORK ARBITRUM SEPOLIA (EIP-3085)
  // -------------------------------------------------------------
  const ensureArbitrumNetwork = async () => {
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: ARBITRUM_SEPOLIA_HEX_ID }],
      });
    } catch (error) {
      if (error.code === 4902) {
        await window.ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [ARBITRUM_SEPOLIA_NETWORK_PARAMS],
        });
      } else {
        throw error;
      }
    }
  };

  // -------------------------------------------------------------
  // FUNGSI MEMBACA STATE DARI ARBITRUM SEPOLIA (READ CALLS)
  // -------------------------------------------------------------
  const fetchBlockchainData = useCallback(async (currentAddr) => {
    if (!window.ethereum) return;

    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const contract = new ethers.Contract(
        PROPERTY_CONTRACT_ADDRESS,
        FRACTIONAL_PROPERTY_ABI,
        provider
      );

      // Baca metadata properti
      const [name, sym, docURI, rawPrice, total, available, ownerAddr] = await Promise.all([
        contract.propertyName(),
        contract.propertySymbol(),
        contract.propertyDocumentURI(),
        contract.fractionPrice(),
        contract.totalFractions(),
        contract.availableFractions(),
        contract.owner()
      ]);

      setPropertyName(name);
      setSymbol(sym);
      setDocumentURI(docURI);
      setRawPriceWei(rawPrice);
      setPriceEth(ethers.formatEther(rawPrice));
      setTotalFractions(Number(total));
      setAvailableFractions(Number(available));

      // Baca data akun investor jika sudah terhubung
      if (currentAddr) {
        const [bal, lastBuy, cooldownPeriod] = await Promise.all([
          contract.getInvestorFractions(currentAddr),
          contract.lastInvestmentTime(currentAddr),
          contract.COOLDOWN_PERIOD()
        ]);

        setMyFractions(Number(bal));
        setIsOwner(currentAddr.toLowerCase() === ownerAddr.toLowerCase());

        // Hitung sisa waktu cooldown anti-spam (estimasi visual UX di browser,
        // validasi absolut tetap ditegakkan oleh smart contract di Arbitrum)
        const currentBlockTime = Math.floor(Date.now() / 1000);
        const elapsed = currentBlockTime - Number(lastBuy);
        const remaining = Math.max(0, Number(cooldownPeriod) - elapsed);
        setCooldownSeconds(remaining);
      } else {
        setMyFractions(0);
        setIsOwner(false);
        setCooldownSeconds(0);
      }
    } catch (err) {
      console.error("Gagal sinkronisasi data on-chain Arbitrum:", err);
    }
  }, []);

  // -------------------------------------------------------------
  // KONEKSI WALLET
  // -------------------------------------------------------------
  const handleConnectWallet = async () => {
    if (!window.ethereum) {
      alert("Silakan instal ekstensi MetaMask untuk berinvestasi!");
      return;
    }

    try {
      setIsConnecting(true);
      await ensureArbitrumNetwork();

      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts',
      });

      if (accounts.length > 0) {
        setAccount(accounts[0]);
        await fetchBlockchainData(accounts[0]);
      }
    } catch (err) {
      console.error("Koneksi dompet gagal:", err);
    } finally {
      setIsConnecting(false);
    }
  };

  // -------------------------------------------------------------
  // TRANSAKSI INVESTASI PEMBELIAN FRAKSI (WRITE CALL)
  // -------------------------------------------------------------
  const handleInvest = async (quantity) => {
    if (!account) {
      alert("Harap hubungkan dompet MetaMask terlebih dahulu!");
      return;
    }

    try {
      setIsTransacting(true);
      setTxStatus({ type: 'info', message: 'Konfirmasi transaksi investasi di MetaMask...' });
      setTxHash(null);

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(
        PROPERTY_CONTRACT_ADDRESS,
        FRACTIONAL_PROPERTY_ABI,
        signer
      );

      const totalWei = BigInt(quantity) * BigInt(rawPriceWei);

      // Eksekusi fungsi buyFractions payable
      const tx = await contract.buyFractions(quantity, { value: totalWei });
      setTxHash(tx.hash);
      setTxStatus({
        type: 'info',
        message: 'Transaksi dikirim. Menunggu konfirmasi jaringan Arbitrum...'
      });

      // Tunggu konfirmasi blok (~250ms - 1 detik)
      await tx.wait();

      addTransaction({
        hash: tx.hash,
        type: 'Beli Fraksi',
        description: `Pembelian ${quantity} Lembar Fraksi (${ethers.formatEther(totalWei)} ETH)`,
        timestamp: Date.now(),
        status: 'Sukses'
      });

      setTxStatus({
        type: 'success',
        message: `Sukses membeli ${quantity} lembar fraksi! Kepemilikan Anda telah resmi tercatat di Arbitrum Sepolia.`
      });

      // Segarkan state on-chain
      await fetchBlockchainData(account);

    } catch (error) {
      console.error("Gagal melakukan pembelian fraksi:", error);
      let message = "Transaksi dibatalkan atau gagal.";
      if (error.reason) {
        message = `Gagal: ${error.reason}`;
      } else if (error.message && error.message.includes("Tunggu cooldown")) {
        message = "Gagal: Cooldown masih aktif. Silakan tunggu beberapa detik.";
      } else if (error.message && error.message.includes("user rejected action")) {
        message = "Transaksi dibatalkan di MetaMask.";
      }
      setTxStatus({ type: 'error', message });
    } finally {
      setIsTransacting(false);
    }
  };

  // -------------------------------------------------------------
  // RESTOCK KUOTA PENAWARAN (KHUSUS OWNER)
  // -------------------------------------------------------------
  const handleRestock = async (amount) => {
    try {
      setIsTransacting(true);
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(
        PROPERTY_CONTRACT_ADDRESS,
        FRACTIONAL_PROPERTY_ABI,
        signer
      );

      const tx = await contract.restockFractions(amount);
      await tx.wait();

      addTransaction({
        hash: tx.hash,
        type: 'Restock Kuota',
        description: `Penambahan Kuota ${amount} Fraksi`,
        timestamp: Date.now(),
        status: 'Sukses'
      });

      alert(`Berhasil menambah kuota penawaran sebanyak ${amount} fraksi!`);
      await fetchBlockchainData(account);
    } catch (err) {
      console.error("Gagal restock fraksi:", err);
      alert("Gagal menambah kuota fraksi.");
    } finally {
      setIsTransacting(false);
    }
  };

  // -------------------------------------------------------------
  // WITHDRAW HASIL INVESTASI ETH (KHUSUS OWNER)
  // -------------------------------------------------------------
  const handleWithdraw = async () => {
    try {
      setIsTransacting(true);
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(
        PROPERTY_CONTRACT_ADDRESS,
        FRACTIONAL_PROPERTY_ABI,
        signer
      );

      const tx = await contract.withdrawFunds();
      await tx.wait();

      addTransaction({
        hash: tx.hash,
        type: 'Tarik Modal',
        description: 'Penarikan Seluruh Saldo Modal ETH',
        timestamp: Date.now(),
        status: 'Sukses'
      });

      alert("Seluruh modal investasi ETH berhasil ditarik ke dompet pengelola properti!");
      await fetchBlockchainData(account);
    } catch (err) {
      console.error("Gagal withdraw modal:", err);
      alert("Gagal menarik modal investasi.");
    } finally {
      setIsTransacting(false);
    }
  };

  // -------------------------------------------------------------
  // SINKRONISASI AKUN & EVENT LISTENER REAL-TIME
  // -------------------------------------------------------------
  useEffect(() => {
    if (!window.ethereum) return;

    // Muat data umum properti saat pertama kali dibuka
    fetchBlockchainData(null);

    // Deteksi jika pengguna mengganti akun di MetaMask
    const handleAccountsChanged = (accounts) => {
      if (accounts.length > 0) {
        setAccount(accounts[0]);
        fetchBlockchainData(accounts[0]);
      } else {
        setAccount(null);
        fetchBlockchainData(null);
      }
    };

    // Deteksi jika pengguna mengganti jaringan di MetaMask
    const handleChainChanged = () => {
      window.location.reload();
    };

    window.ethereum.on('accountsChanged', handleAccountsChanged);
    window.ethereum.on('chainChanged', handleChainChanged);

    // Pasang Event Listener Real-Time dari Smart Contract
    const provider = new ethers.BrowserProvider(window.ethereum);
    const contract = new ethers.Contract(
      PROPERTY_CONTRACT_ADDRESS,
      FRACTIONAL_PROPERTY_ABI,
      provider
    );

    const onPurchased = () => {
      fetchBlockchainData(account);
    };

    const onRestocked = () => {
      fetchBlockchainData(account);
    };

    const onFundsWithdrawn = () => {
      fetchBlockchainData(account);
    };

    contract.on('FractionPurchased', onPurchased);
    contract.on('FractionsRestocked', onRestocked);
    contract.on('FundsWithdrawn', onFundsWithdrawn);

    return () => {
      window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
      window.ethereum.removeListener('chainChanged', handleChainChanged);
      contract.off('FractionPurchased', onPurchased);
      contract.off('FractionsRestocked', onRestocked);
      contract.off('FundsWithdrawn', onFundsWithdrawn);
    };
  }, [account, fetchBlockchainData]);

  // Timer cooldown lokal di antarmuka
  useEffect(() => {
    if (cooldownSeconds <= 0) return;
    const interval = setInterval(() => {
      setCooldownSeconds((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [cooldownSeconds]);

  return (
    <div className="app-container">
      <Navbar
        account={account}
        onConnect={handleConnectWallet}
        isConnecting={isConnecting}
      />

      <div className="grid-dashboard">
        <PropertyCard
          propertyName={propertyName}
          symbol={symbol}
          priceEth={priceEth}
          availableFractions={availableFractions}
          totalFractions={totalFractions}
          documentURI={documentURI}
        />
        <InvestorPortfolio
          myFractions={myFractions}
          priceEth={priceEth}
          cooldownSeconds={cooldownSeconds}
        />
      </div>

      <InvestBox
        priceEth={priceEth}
        onInvest={handleInvest}
        isTransacting={isTransacting}
        txStatus={txStatus}
        txHash={txHash}
        availableFractions={availableFractions}
      />

      <IssuerPanel
        isOwner={isOwner}
        onRestock={handleRestock}
        onWithdraw={handleWithdraw}
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

---

> [!TIP]
> Di [Modul 05](./05-testing-end-to-end-dan-deployment.md), kita akan melakukan uji coba skenario end-to-end secara menyeluruh dan mempublikasikan dApp ini ke hosting publik (Vercel) agar dapat diakses oleh siapa saja!
