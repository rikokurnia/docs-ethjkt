---
id: integrasi-web3-step-by-step
title: 04. Integrasi Web3 Langkah demi Langkah
sidebar_label: 04. Integrasi Web3 Lengkap
sidebar_position: 4
description: Menghubungkan MetaMask, membaca state kontrak, mengeksekusi pembelian dengan ETH, mengaktifkan Owner Panel, dan menangkap real-time events.
---

# 04. Integrasi Web3 Langkah demi Langkah

---

Sekarang tibalah saatnya menyatukan seluruh elemen: **menghidupkan antarmuka React statis dari Modul 02 dengan smart contract nyata di Arbitrum Sepolia menggunakan pustaka `ethers.js` v6**.

Kita akan mengintegrasikan 5 kapabilitas Web3 utama secara bertahap:
1. **Connect Wallet & Network Guard**: Otentikasi dompet & auto-switch jaringan ke Arbitrum Sepolia.
2. **Read Operations**: Membaca data on-chain tanpa biaya gas.
3. **Write Operations**: Mengirim transaksi pembelian dengan pembayaran ETH.
4. **Role-Based Controls**: Membuka fitur Owner secara kondisional.
5. **Real-time Event Listeners**: Mendengarkan perubahan data di blockchain secara live.

---

## 🔌 1. Langkah 1: Connect Wallet & Network Guard

Untuk berinteraksi dengan smart contract, aplikasi web harus meminta izin akses ke dompet pengguna melalui standar antarmuka **EIP-1193** (`window.ethereum`).

### Kode Logika Koneksi & Pergantian Jaringan

```javascript
import { ethers } from 'ethers';
import {
  VENDING_MACHINE_ADDRESS,
  VENDING_MACHINE_ABI,
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
    // Meminta daftar akun pengguna
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

// 2. Memastikan jaringan adalah Arbitrum Sepolia (Chain ID: 421614)
const checkAndSwitchNetwork = async () => {
  try {
    // Coba beralih ke Arbitrum Sepolia
    await window.ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: ARBITRUM_SEPOLIA_HEX_ID }],
    });
  } catch (switchError) {
    // Error 4902: Jaringan belum terdaftar di MetaMask, tambahkan secara otomatis!
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

Untuk membaca data, kita membuat instance `ethers.BrowserProvider` dan objek `ethers.Contract`. Karena fungsi bertipe `view`, pemanggilan ini **gratis gas** dan tidak memicu popup MetaMask.

```javascript
const loadContractData = async (userAddress) => {
  try {
    const provider = new ethers.BrowserProvider(window.ethereum);
    const contract = new ethers.Contract(
      VENDING_MACHINE_ADDRESS,
      VENDING_MACHINE_ABI,
      provider
    );

    // 1. Membaca sisa stok mesin (saldo cupcake milik alamat kontrak itu sendiri)
    const rawStock = await contract.cupcakeBalances(VENDING_MACHINE_ADDRESS);
    
    // 2. Membaca harga per cupcake (dalam satuan Wei)
    const rawPrice = await contract.CUPCAKE_PRICE();
    
    // 3. Membaca kepemilikan cupcake pengguna
    const rawUserBalance = await contract.getCupcakeBalance(userAddress);
    
    // 4. Membaca alamat owner kontrak
    const contractOwner = await contract.owner();

    // 5. Menghitung sisa cooldown user
    const lastTimestamp = await contract.lastPurchaseTimestamp(userAddress);
    const cooldownDuration = await contract.COOLDOWN_PERIOD();
    
    const currentBlockTime = Math.floor(Date.now() / 1000);
    const elapsed = currentBlockTime - Number(lastTimestamp);
    const remainingCooldown = Math.max(0, Number(cooldownDuration) - elapsed);

    return {
      stock: Number(rawStock),
      priceEth: ethers.formatEther(rawPrice),
      rawPriceWei: rawPrice,
      userCupcakes: Number(rawUserBalance),
      isOwner: userAddress.toLowerCase() === contractOwner.toLowerCase(),
      remainingCooldown
    };
  } catch (err) {
    console.error("Gagal membaca data kontrak:", err);
  }
};
```

---

## ✍️ 3. Langkah 3: Menjalankan Transaksi Pembelian (*Write Call*)

Pembelian cupcake memodifikasi *state* di blockchain dan membutuhkan pengiriman dana ETH (`payable`). Oleh karena itu, kita harus menggunakan **Signer** dari MetaMask:

```javascript
const buyCupcakes = async (quantity, rawPriceWei) => {
  try {
    const provider = new ethers.BrowserProvider(window.ethereum);
    // Mengambil signer dari dompet yang sedang aktif
    const signer = await provider.getSigner();

    // Inisialisasi kontrak dengan Signer
    const contractWithSigner = new ethers.Contract(
      VENDING_MACHINE_ADDRESS,
      VENDING_MACHINE_ABI,
      signer
    );

    // Hitung total harga dalam satuan Wei (BigInt)
    const totalCostWei = BigInt(quantity) * BigInt(rawPriceWei);

    // Eksekusi pemanggilan fungsi payable
    const tx = await contractWithSigner.purchase(quantity, {
      value: totalCostWei
    });

    console.log("Transaksi terkirim ke Arbitrum:", tx.hash);

    // Tunggu blok Arbitrum mengonfirmasi transaksi (biasanya ~250ms - 1 detik)
    const receipt = await tx.wait();
    console.log("Transaksi terkonfirmasi di blok:", receipt.blockNumber);

    return { success: true, hash: tx.hash };
  } catch (error) {
    console.error("Transaksi gagal:", error);
    // Ekstrak pesan revert require yang ramah
    let errorMsg = "Transaksi dibatalkan atau gagal dieksekusi.";
    if (error.reason) {
      errorMsg = error.reason;
    } else if (error.message && error.message.includes("Tunggu cooldown")) {
      errorMsg = "Harap tunggu periode cooldown selesai sebelum membeli lagi!";
    }
    return { success: false, error: errorMsg };
  }
};
```

---

## 🔒 4. Langkah 4: Operasi Panel Pemilik (*Owner Controls*)

Jika `isOwner === true`, pemilik dapat memanggil fungsi `refill` dan `withdraw`:

```javascript
// Menambah stok cupcake ke dalam mesin
const refillCupcakes = async (amount) => {
  const provider = new ethers.BrowserProvider(window.ethereum);
  const signer = await provider.getSigner();
  const contract = new ethers.Contract(VENDING_MACHINE_ADDRESS, VENDING_MACHINE_ABI, signer);

  const tx = await contract.refill(amount);
  await tx.wait();
};

// Menarik seluruh saldo ETH hasil penjualan ke dompet owner
const withdrawEth = async () => {
  const provider = new ethers.BrowserProvider(window.ethereum);
  const signer = await provider.getSigner();
  const contract = new ethers.Contract(VENDING_MACHINE_ADDRESS, VENDING_MACHINE_ABI, signer);

  const tx = await contract.withdraw();
  await tx.wait();
};
```

---

## 📡 5. Langkah 5: Real-Time Event Listener

Smart contract `VendingMachine.sol` memancarkan (*emit*) event `CupcakePurchased` dan `CupcakeRefilled`. 

Dengan memasang listener di React, antarmuka kita akan otomatis memperbarui stok secara **real-time** saat ada transaksi masuk (bahkan jika transaksi tersebut dilakukan oleh orang lain dari belahan dunia lain!):

```javascript
// Pasang event listener saat komponen dimuat
useEffect(() => {
  if (!window.ethereum) return;

  const provider = new ethers.BrowserProvider(window.ethereum);
  const contract = new ethers.Contract(VENDING_MACHINE_ADDRESS, VENDING_MACHINE_ABI, provider);

  // Tangkap event pembelian
  const onPurchased = (buyer, amount) => {
    console.log(`Event: ${buyer} baru saja membeli ${amount} cupcake!`);
    // Panggil ulang fungsi pembaruan state
    refreshData();
  };

  // Tangkap event isi ulang stok
  const onRefilled = (amount) => {
    console.log(`Event: Mesin di-refill sebanyak ${amount} cupcake!`);
    refreshData();
  };

  contract.on("CupcakePurchased", onPurchased);
  contract.on("CupcakeRefilled", onRefilled);

  // Bersihkan listener saat komponen unmount
  return () => {
    contract.off("CupcakePurchased", onPurchased);
    contract.off("CupcakeRefilled", onRefilled);
  };
}, [account]);
```

---

## 🚀 6. Kode Terpadu Komponen Utama (`src/App.jsx`)

Sekarang, satukan seluruh alur Web3 di atas ke dalam file `src/App.jsx`. Ganti isi file `src/App.jsx` Anda dengan kode produksi lengkap berikut:

```jsx
import React, { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import Navbar from './components/Navbar';
import MachineStatus from './components/MachineStatus';
import UserInventory from './components/UserInventory';
import PurchaseBox from './components/PurchaseBox';
import OwnerPanel from './components/OwnerPanel';
import {
  VENDING_MACHINE_ADDRESS,
  VENDING_MACHINE_ABI,
  ARBITRUM_SEPOLIA_HEX_ID,
  ARBITRUM_SEPOLIA_NETWORK_PARAMS
} from './constants/contract';
import './App.css';

export default function App() {
  const [account, setAccount] = useState(null);
  const [stock, setStock] = useState(0);
  const [priceEth, setPriceEth] = useState('0.0001');
  const [rawPriceWei, setRawPriceWei] = useState(0n);
  const [userCupcakes, setUserCupcakes] = useState(0);
  const [cooldownSeconds, setCooldownSeconds] = useState(0);
  const [isOwner, setIsOwner] = useState(false);
  
  const [isConnecting, setIsConnecting] = useState(false);
  const [isTransacting, setIsTransacting] = useState(false);
  const [txStatus, setTxStatus] = useState(null);
  const [txHash, setTxHash] = useState(null);

  // -------------------------------------------------------------
  // FUNGSI SWITCH / ADD NETWORK ARBITRUM SEPOLIA
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
  // FUNGSI MEMBACA STATE DARI ARBITRUM (READ CALLS)
  // -------------------------------------------------------------
  const fetchBlockchainData = useCallback(async (currentAddr) => {
    if (!window.ethereum || !currentAddr) return;

    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const contract = new ethers.Contract(
        VENDING_MACHINE_ADDRESS,
        VENDING_MACHINE_ABI,
        provider
      );

      // Baca sisa stok mesin (saldo cupcake milik alamat smart contract)
      const rawStock = await contract.cupcakeBalances(VENDING_MACHINE_ADDRESS);
      setStock(Number(rawStock));

      // Baca harga per cupcake
      const rawPrice = await contract.CUPCAKE_PRICE();
      setRawPriceWei(rawPrice);
      setPriceEth(ethers.formatEther(rawPrice));

      // Baca saldo cupcake user
      const rawUserBal = await contract.getCupcakeBalance(currentAddr);
      setUserCupcakes(Number(rawUserBal));

      // Cek apakah user adalah owner
      const contractOwner = await contract.owner();
      setIsOwner(currentAddr.toLowerCase() === contractOwner.toLowerCase());

      // Cek sisa cooldown
      const lastBuy = await contract.lastPurchaseTimestamp(currentAddr);
      const cooldownPeriod = await contract.COOLDOWN_PERIOD();
      const currentBlockTime = Math.floor(Date.now() / 1000);
      const elapsed = currentBlockTime - Number(lastBuy);
      const remaining = Math.max(0, Number(cooldownPeriod) - elapsed);
      setCooldownSeconds(remaining);

    } catch (err) {
      console.error("Gagal sinkronisasi data Arbitrum:", err);
    }
  }, []);

  // -------------------------------------------------------------
  // KONEKSI WALLET
  // -------------------------------------------------------------
  const handleConnectWallet = async () => {
    if (!window.ethereum) {
      alert("Silakan instal MetaMask untuk menggunakan dApp ini!");
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
  // TRANSAKSI BELI CUPCAKE (WRITE CALL)
  // -------------------------------------------------------------
  const handlePurchase = async (quantity) => {
    if (!account) {
      alert("Harap hubungkan dompet MetaMask terlebih dahulu!");
      return;
    }

    try {
      setIsTransacting(true);
      setTxStatus({ type: 'info', message: 'Konfirmasi transaksi di MetaMask...' });
      setTxHash(null);

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(
        VENDING_MACHINE_ADDRESS,
        VENDING_MACHINE_ABI,
        signer
      );

      const totalWei = BigInt(quantity) * BigInt(rawPriceWei);

      // Kirim transaksi dengan nilai ETH
      const tx = await contract.purchase(quantity, { value: totalWei });
      setTxHash(tx.hash);
      setTxStatus({
        type: 'info',
        message: 'Transaksi terkirim. Menunggu konfirmasi Arbitrum Nitro...'
      });

      // Tunggu konfirmasi blok
      await tx.wait();

      setTxStatus({
        type: 'success',
        message: `Berhasil membeli ${quantity} cupcake! Transaksi telah final di Arbitrum Sepolia.`
      });

      // Segarkan data
      await fetchBlockchainData(account);

    } catch (error) {
      console.error("Gagal melakukan pembelian:", error);
      let message = "Transaksi dibatalkan atau gagal.";
      if (error.reason) {
        message = `Gagal: ${error.reason}`;
      } else if (error.message && error.message.includes("Tunggu cooldown")) {
        message = "Gagal: Cooldown masih aktif. Silakan tunggu beberapa saat.";
      }
      setTxStatus({ type: 'error', message });
    } finally {
      setIsTransacting(false);
    }
  };

  // -------------------------------------------------------------
  // RESTOCK OLEH OWNER
  // -------------------------------------------------------------
  const handleRefill = async (amount) => {
    try {
      setIsTransacting(true);
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(VENDING_MACHINE_ADDRESS, VENDING_MACHINE_ABI, signer);

      const tx = await contract.refill(amount);
      await tx.wait();

      alert(`Berhasil menambah stok sebanyak ${amount} cupcake!`);
      await fetchBlockchainData(account);
    } catch (err) {
      console.error("Gagal refill:", err);
      alert("Gagal melakukan refill stok.");
    } finally {
      setIsTransacting(false);
    }
  };

  // -------------------------------------------------------------
  // WITHDRAW HASIL PENJUALAN OLEH OWNER
  // -------------------------------------------------------------
  const handleWithdraw = async () => {
    try {
      setIsTransacting(true);
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(VENDING_MACHINE_ADDRESS, VENDING_MACHINE_ABI, signer);

      const tx = await contract.withdraw();
      await tx.wait();

      alert("Seluruh saldo ETH hasil penjualan berhasil ditarik ke dompet Anda!");
      await fetchBlockchainData(account);
    } catch (err) {
      console.error("Gagal withdraw:", err);
      alert("Gagal menarik saldo.");
    } finally {
      setIsTransacting(false);
    }
  };

  // -------------------------------------------------------------
  // SINKRONISASI AKUN & EVENT LISTENER
  // -------------------------------------------------------------
  useEffect(() => {
    if (!window.ethereum) return;

    // Deteksi jika user berganti akun di MetaMask
    const handleAccountsChanged = (accounts) => {
      if (accounts.length > 0) {
        setAccount(accounts[0]);
        fetchBlockchainData(accounts[0]);
      } else {
        setAccount(null);
      }
    };

    // Deteksi jika user berganti jaringan
    const handleChainChanged = () => {
      window.location.reload();
    };

    window.ethereum.on('accountsChanged', handleAccountsChanged);
    window.ethereum.on('chainChanged', handleChainChanged);

    // Event Listener Real-Time dari Smart Contract
    const provider = new ethers.BrowserProvider(window.ethereum);
    const contract = new ethers.Contract(VENDING_MACHINE_ADDRESS, VENDING_MACHINE_ABI, provider);

    const onPurchased = () => {
      if (account) fetchBlockchainData(account);
    };

    const onRefilled = () => {
      if (account) fetchBlockchainData(account);
    };

    contract.on('CupcakePurchased', onPurchased);
    contract.on('CupcakeRefilled', onRefilled);

    return () => {
      window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
      window.ethereum.removeListener('chainChanged', handleChainChanged);
      contract.off('CupcakePurchased', onPurchased);
      contract.off('CupcakeRefilled', onRefilled);
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
        <MachineStatus stock={stock} priceEth={priceEth} />
        <UserInventory userBalance={userCupcakes} cooldownSeconds={cooldownSeconds} />
      </div>

      <PurchaseBox
        priceEth={priceEth}
        onPurchase={handlePurchase}
        isTransacting={isTransacting}
        txStatus={txStatus}
        txHash={txHash}
      />

      <OwnerPanel
        isOwner={isOwner}
        onRefill={handleRefill}
        onWithdraw={handleWithdraw}
        isTransacting={isTransacting}
      />
    </div>
  );
}
```

---

> [!TIP]
> Di [Modul 05](./05-testing-end-to-end-dan-deployment.md), kita akan melakukan uji coba skenario end-to-end secara menyeluruh dan mempublikasikan dApp ini ke hosting publik (Vercel) agar dapat diakses oleh siapa saja!
