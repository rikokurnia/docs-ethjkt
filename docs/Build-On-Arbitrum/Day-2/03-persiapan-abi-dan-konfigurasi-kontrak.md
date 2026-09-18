---
id: persiapan-abi-dan-konfigurasi-kontrak
title: 03. Persiapan ABI & Konfigurasi Kontrak
sidebar_label: 03. ABI & Konfigurasi Kontrak
sidebar_position: 3
description: Mengekstrak ABI dari Remix IDE, menetapkan parameter jaringan Arbitrum Sepolia, dan menyusun file konfigurasi Web3.
---

# 03. Persiapan ABI & Konfigurasi Kontrak

---

Pada modul sebelumnya, antarmuka visual kita masih ditenagai oleh *dummy data*. Agar antarmuka React dapat berkomunikasi langsung dengan smart contract `VendingMachine.sol` di Arbitrum Sepolia, kita memerlukan dua hal fundamental:

1. **Alamat Kontrak (`CONTRACT_ADDRESS`)**: Lokasi unik smart contract Anda di jaringan Arbitrum Sepolia.
2. **ABI (*Application Binary Interface*)**: "Buku petunjuk" berformat JSON yang mendeskripsikan fungsi, tipe data parameter, dan event yang ada di dalam kontrak.

---

## 📖 1. Mengapa Kita Membutuhkan ABI?

Ketika smart contract Solidity dikompilasi, kode manusia yang Anda tulis diubah menjadi deretan heksadesimal mesin yang disebut **EVM Bytecode** (misalnya `0x6080604052348015610010576000...`). 

EVM di Arbitrum mengeksekusi bytecode ini secara efisien, tetapi JavaScript di browser tidak tahu apa arti dari deretan bita tersebut.

```mermaid
flowchart LR
    Sol["VendingMachine.sol"] -->|Solidity Compiler| Bytecode["EVM Bytecode (Deploy ke Arbitrum)"]
    Sol -->|Solidity Compiler| ABI["ABI JSON Schema (Frontend)"]
    
    subgraph Browser ["Frontend Browser"]
        ABI --> Ethers["ethers.Contract(address, ABI, signer)"]
    end
```

**ABI berfungsi sebagai kamus terjemahan**:
- Memberitahu pustaka `ethers.js` bahwa fungsi `purchase(uint256 amount)` menerima satu argumen angka bulat (`uint256`) dan bersifat `payable`.
- Menginstruksikan bagaimana cara meng-encode nama fungsi menjadi 4-byte *Function Selector* (misalnya `0xefef39a1`) saat mengirim panggilan transaksi ke Arbitrum.
- Mendekode data mentah yang dikembalikan oleh blockchain menjadi tipe data JavaScript yang mudah dibaca (`BigInt`, string, atau array).

---

## 📋 2. Cara Mengambil ABI dari Remix IDE

Jika Anda telah menyelesaikan [Day 1](../Day-1/content.md), Anda dapat mengambil ABI kontrak Anda secara instan dari Remix IDE:

1. Buka kembali [Remix IDE](https://remix.ethereum.org).
2. Di panel sebelah kiri, buka tab **Solidity Compiler** (ikon berlogo Solidity bergambar huruf "S").
3. Pastikan file kontrak `VendingMachine.sol` terpilih di editor dan klik tombol **Compile VendingMachine.sol**.
4. Gulir ke bagian paling bawah panel compiler.
5. Anda akan menemukan tombol bertuliskan **ABI** dengan ikon salin (*copy*). Klik tombol tersebut untuk menyalin seluruh objek JSON ABI ke clipboard Anda.

> [!NOTE]
> Alamat kontrak (*Contract Address*) bisa Anda temukan di tab **Deploy & Run Transactions** pada bagian *Deployed Contracts*, atau dari riwayat transaksi deploy Anda di [Arbiscan Sepolia](https://sepolia.arbiscan.io).

---

## ⚙️ 3. Membuat File Konfigurasi (`src/constants/contract.js`)

Buat file baru di dalam proyek React Anda pada path `src/constants/contract.js`. 

Salin kode konfigurasi berikut:

```javascript
// -------------------------------------------------------------
// 1. ALAMAT SMART CONTRACT
// Ganti nilai string di bawah ini dengan alamat kontrak hasil deploy Day 1 Anda!
// -------------------------------------------------------------
export const VENDING_MACHINE_ADDRESS = "0x0000000000000000000000000000000000000000"; 

// -------------------------------------------------------------
// 2. PARAMETER JARINGAN ARBITRUM SEPOLIA (EIP-3085)
// Digunakan untuk meminta MetaMask beralih/menambahkan jaringan secara otomatis
// -------------------------------------------------------------
export const ARBITRUM_SEPOLIA_CHAIN_ID = 421614;
export const ARBITRUM_SEPOLIA_HEX_ID = "0x66eee"; // 421614 dalam format heksadesimal

export const ARBITRUM_SEPOLIA_NETWORK_PARAMS = {
  chainId: ARBITRUM_SEPOLIA_HEX_ID,
  chainName: "Arbitrum Sepolia Testnet",
  nativeCurrency: {
    name: "Ethereum",
    symbol: "ETH",
    decimals: 18
  },
  rpcUrls: ["https://sepolia-rollup.arbitrum.io/rpc"],
  blockExplorerUrls: ["https://sepolia.arbiscan.io"]
};

// -------------------------------------------------------------
// 3. APPLICATION BINARY INTERFACE (ABI)
// Mencakup semua fungsi (purchase, refill, getCupcakeBalance, dll) dan event
// -------------------------------------------------------------
export const VENDING_MACHINE_ABI = [
  {
    "inputs": [],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "buyer",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      }
    ],
    "name": "CupcakePurchased",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      }
    ],
    "name": "CupcakeRefilled",
    "type": "event"
  },
  {
    "inputs": [],
    "name": "COOLDOWN_PERIOD",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "type",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "CUPCAKE_PRICE",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "name": "cupcakeBalances",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "user",
        "type": "address"
      }
    ],
    "name": "getCupcakeBalance",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "name": "lastPurchaseTimestamp",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "owner",
    "outputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      }
    ],
    "name": "purchase",
    "outputs": [],
    "stateMutability": "payable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      }
    ],
    "name": "refill",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "withdraw",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  }
];
```

---

## 🔍 Checklist Verifikasi Konfigurasi

Sebelum melanjutkan ke integrasi kode Web3 di modul berikutnya, pastikan:
- [ ] Anda telah mengganti `VENDING_MACHINE_ADDRESS` dengan alamat kontrak asli Anda di Arbitrum Sepolia.
- [ ] Objek `VENDING_MACHINE_ABI` memuat fungsi-fungsi utama: `purchase`, `refill`, `withdraw`, `cupcakeBalances`, dan `owner`.
- [ ] Parameter Chain ID diisi dengan benar: angka desimal `421614` dan string heksadesimal `0x66eee`.

> [!TIP]
> Di [Modul 04](./04-integrasi-web3-step-by-step.md), kita akan menghubungkan file konfigurasi ini ke komponen React menggunakan pustaka `ethers.js` v6!
