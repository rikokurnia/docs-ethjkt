---
id: quickstart-solidity-remix
title: "Smart Contract Real World Asset (RWA): Properti Fraksional di Arbitrum"
sidebar_label: "Smart Contract RWA"
sidebar_position: 1
description: "Panduan lengkap membangun smart contract Real World Asset (RWA) untuk tokenisasi properti fraksional di Arbitrum Sepolia menggunakan Solidity modern dan Remix IDE."
---

# Smart Contract Real World Asset (RWA): Properti Fraksional di Arbitrum

---

## 🎯 Apa yang Akan Kita Pelajari

Dalam panduan praktis ini, Anda akan mempelajari:

1. **Konsep Dasar Web3 & Real World Asset (RWA)**: Perbedaan mendasar antara platform investasi properti terpusat (Web2) vs tokenisasi kepemilikan aset nyata di atas blockchain (Web3).
2. **Fase Persiapan**: Menyiapkan dompet **MetaMask** dengan jaringan **Arbitrum Sepolia** dan menghubungkannya ke **Remix IDE**.
3. **11 Fondasi Solidity Esensial**: Memahami konsep inti yang digunakan di smart contract RWA dunia nyata:
   * **`string`**: Representasi data properti (nama, dokumen legal).
   * **`uint256` & `bool`**: Kuantitas unit saham fraksional dan status penawaran investasi.
   * **`public` vs `private`**: Visibilitas data aset publik vs data internal kontrak.
   * **`view` & `pure`**: Pemanggilan data gratis tanpa gas fee.
   * **`mapping`**: Pencatatan kepemilikan fraksi investor secara terdistribusi.
   * **`msg.sender`**: Autentikasi dompet investor langsung dari tanda tangan kriptografi.
   * **`block.timestamp`**: Penegakan aturan batas waktu dan cooldown transaksi.
   * **`payable` & `msg.value`**: Penerimaan transfer mata uang kripto asli (ETH) dan membaca nilainya dalam satuan Wei.
   * **`require()`**: Validasi kuota fraksi dan verifikasi kecukupan pembayaran ETH.
   * **`event` & `emit`**: Pencatatan log transaksi on-chain untuk sinkronisasi antarmuka dApp secara real-time.
   * **`constructor` & Hak Akses Pengelola (`owner`)**: Pengaturan awal aset dan hak akses manajer properti.
4. **Tantangan Proyek Utama (`FractionalProperty.sol`)**: Membangun smart contract lengkap untuk tokenisasi kepemilikan vila fisik (*Bali Sunset Villa #01*).
5. **Praktik Langsung (Compile, Deploy, Test & Verify)**: Mengompilasi kode di Remix, men-deploy ke **Arbitrum Sepolia Testnet**, menguji fungsi investasi secara interaktif, dan memverifikasi sertifikatnya di **Arbiscan**.

---

## 🏢 Tinjauan Kasus: Tokenisasi Properti Fraksional (*RWA*)

Bayangkan sebuah properti fisik bernilai tinggi di dunia nyata, misalnya sebuah vila eksklusif: **"Bali Sunset Villa #01"**[^1].

Secara konvensional, membeli properti utuh membutuhkan modal yang sangat besar dan proses birokrasi legal yang memakan waktu berbulan-bulan. Melalui teknologi **Real World Asset (RWA) di Arbitrum**, hak kepemilikan properti tersebut difraksionalisasi (*fractionalized*) menjadi unit-unit kecil yang dapat dimiliki oleh siapa saja secara terdesentralisasi:

1. Properti dibagi menjadi **1.000 unit fraksi kepemilikan**.
2. Setiap fraksi dijual seharga **0.001 ETH**.
3. Investor dapat membeli 1 fraksi atau lebih dan kepemilikannya tercatat secara permanen di blockchain.
4. Tautan bukti sertifikat fisik (dokumen legal/BPN) disimpan secara transparan di dalam kontrak.

---

### Perbandingan Masalah: Mengapa Platform Web2 Tidak Cukup?

Jika kita membangun platform investasi fraksional ini menggunakan JavaScript dan database tersentralisasi (Web2 biasa):

```js title="PropertyPlatform.js (Model Web2 Tradisional)"
class PropertyPlatform {
  fractionBalances = {}; // userId => jumlah lembar fraksi
  availableFractions = 1000;

  // Di Web2, identitas investor dan pencatatan saham bergantung pada server admin
  buyFraction(userId, amount) {
    if (this.availableFractions >= amount) {
      this.fractionBalances[userId] = (this.fractionBalances[userId] || 0) + amount;
      this.availableFractions -= amount;
      return true;
    }
    return false;
  }
}
```

:::caution Titik Lemah Arsitektur Web2 pada Investasi Aset Nyata (RWA)
1. **Manipulasi Kepemilikan (*Double Selling*)**: Admin database internal dapat diam-diam mengubah saldo kepemilikan atau mencetak lembar fraksi melebihi batas fisik properti tanpa audit independen.
2. **Ketiadaan Bukti Kriptografis Permanen**: Jika perusahaan platform properti bangkrut atau server cloud dimatikan, seluruh catatan kepemilikan investor lenyap.
3. **Risiko Pemalsuan Identitas**: Identitas investor hanya berupa string `userId` di database yang rentan dibobol atau dipalsukan.
4. **Ketergantungan Perantara (*Middleman Friction*)**: Transaksi antar-investor lambat, mahal, dan tidak dapat dipindahkan secara bebas ke dompet pribadi.
:::

Di **Web3 (Arbitrum)**, kepemilikan fraksi properti dijamin oleh **Smart Contract Solidity**. Setiap pembelian diverifikasi dengan tanda tangan digital dompet investor, aturan suplai tidak dapat dimanipulasi (*immutable*), dan biaya transaksi di Arbitrum hanya sepersekian sen dolar dengan konfirmasi instan (~250ms).

---

## 🛠️ Fase Persiapan: Remix IDE & MetaMask

Sebelum mulai menulis kode smart contract RWA, mari kita siapkan *development environment* kita terlebih dahulu:

### 1. Persiapan Dompet MetaMask & Jaringan Arbitrum Sepolia
1. **Instalasi**: Pasang ekstensi browser MetaMask dari situs resmi [https://metamask.io](https://metamask.io/).
2. **Buat Dompet**: Buat akun wallet baru. **Catat dan simpan Secret Recovery Phrase (Seed Phrase) Anda di tempat yang aman dan rahasia!**
3. **Tambahkan Jaringan Arbitrum Sepolia**:
   * Buka MetaMask > Klik menu pemilih jaringan di pojok kiri atas > Klik **Add Network** > Pilih **Add a network manually**.
   * Masukkan parameter berikut:
     * **Network Name**: `Arbitrum Sepolia`
     * **New RPC URL**: `https://sepolia-rollup.arbitrum.io/rpc`
     * **Chain ID**: `421614`
     * **Currency Symbol**: `ETH`
     * **Block Explorer URL**: `https://sepolia.arbiscan.io/`
   * Klik **Save** dan beralihlah ke jaringan Arbitrum Sepolia.
4. **Dapatkan Testnet ETH Gratis**:
   * Dapatkan testnet ETH gratis melalui [Alchemy Arbitrum Sepolia Faucet](https://www.alchemy.com/faucets/arbitrum-sepolia) atau [Chainlink Faucets](https://faucets.chain.link/).
   * Atau, klaim Sepolia ETH di Layer 1 melalui [sepoliafaucet.com](https://sepoliafaucet.com/) lalu kirim (*bridge*) ke Arbitrum Sepolia lewat [Arbitrum Official Bridge](https://bridge.arbitrum.io/).

---

### 2. Buka & Siapkan Remix IDE
1. Buka tab baru di browser Anda dan kunjungi **[https://remix.ethereum.org](https://remix.ethereum.org/)**.
2. Di panel navigasi sebelah kiri, klik ikon **File Explorer** (ikon folder).
3. Lingkungan coding online Anda sudah siap digunakan tanpa perlu instalasi perangkat lunak tambahan apa pun di komputer!

---

### 3. Hubungkan Remix ke MetaMask
1. Di panel bilah kiri Remix, klik menu **Deploy & Run Transactions** (ikon logo Ethereum dengan tanda panah).
2. Pada dropdown opsi **ENVIRONMENT**, ubah dari `Remix VM` menjadi **Injected Provider - MetaMask**.
3. Jendela pop-up MetaMask akan otomatis muncul meminta izin koneksi. Pilih akun dompet Anda, lalu klik **Next** ➡️ **Connect**.
4. Perhatikan keterangan di bawah opsi Environment: pastikan tertera Chain ID `421614` (Arbitrum Sepolia) dan saldo ETH Anda telah terbaca.
5. **Selesai!** Ekosistem coding dan dompet Web3 Anda kini telah saling terhubung.

---

## 📘 Fondasi Solidity: 11 Konsep Kunci Sebelum Masuk ke Kontrak RWA

Sebelum kita menyusun smart contract `FractionalProperty.sol`, mari kita pelajari 11 konsep inti Solidity berikut secara berurutan. Setiap konsep di bawah ini menyediakan satu file smart contract mandiri (`.sol`) yang dapat langsung Anda salin ke Remix IDE, di-deploy, dan diuji tombolnya secara interaktif:

---

### 1. Tipe Data String & Struktur Dasar Kontrak
**Apa itu**: Setiap smart contract diawali dengan lisensi open-source (`SPDX-License-Identifier`) dan deklarasi versi compiler (`pragma solidity`). Tipe data `string` digunakan untuk menyimpan teks (UTF-8), seperti nama properti atau dokumen legal.

Buat file `LearnString.sol`:

```solidity title="LearnString.sol"
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract LearnString {
    // Menyimpan nama aset properti fisik
    string public propertyName;

    // Constructor mengatur nama awal properti saat deploy
    constructor() {
        propertyName = "Bali Sunset Villa #01";
    }

    // Fungsi untuk memperbarui nama properti jika ada renovasi/rebranding
    function updatePropertyName(string memory _newName) public {
        propertyName = _newName;
    }
}
```

**Coba di Remix**:
1. **Deploy** contract `LearnString`.
2. Di panel kiri bawah (*Deployed Contracts*), klik tombol biru **`propertyName`** ➡️ Muncul teks `"Bali Sunset Villa #01"`.
3. Masukkan teks `"Bali Luxury Beachfront Villa"` pada kolom fungsi **`updatePropertyName`** ➡️ Klik tombol oranye **`updatePropertyName`**.
4. Klik tombol biru **`propertyName`** lagi ➡️ Sekarang nilainya berubah menjadi `"Bali Luxury Beachfront Villa"`!

---

### 2. Tipe Data Numerik (uint256) & Boolean (bool)
**Apa itu**: `uint256` menyimpan bilangan bulat positif 256-bit (dari `0` hingga `2^256 - 1`), ideal untuk mencatat kuantitas fraksi saham properti. Sedangkan `bool` menyimpan nilai logika (`true` atau `false`) untuk menentukan status penawaran investasi (*offering status*).

Buat file `LearnNumber.sol`:

```solidity title="LearnNumber.sol"
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract LearnNumber {
    // Sisa fraksi properti yang tersedia untuk dibeli
    uint256 public availableFractions;
    // Status apakah periode penjualan investasi sedang dibuka
    bool public isOfferingOpen;

    constructor() {
        availableFractions = 1000;
        isOfferingOpen = true;
    }

    // Menambah kuota fraksi jika properti melakukan ekspansi
    function addFractions(uint256 _amount) public {
        availableFractions += _amount;
    }

    // Mengubah saklar buka/tutup penawaran investasi
    function toggleOffering() public {
        isOfferingOpen = !isOfferingOpen;
    }
}
```

**Coba di Remix**:
1. **Deploy** contract `LearnNumber`.
2. Klik tombol biru **`availableFractions`** ➡️ Lihat angka `1000`.
3. Klik tombol biru **`isOfferingOpen`** ➡️ Lihat nilai `true`.
4. Masukkan angka `250` pada kolom **`addFractions`** ➡️ Klik tombol oranye **`addFractions`**.
5. Klik **`availableFractions`** lagi ➡️ Sekarang nilainya menjadi `1250`!
6. Klik tombol oranye **`toggleOffering`** ➡️ Klik lagi **`isOfferingOpen`** ➡️ Sekarang bernilai `false`!

---

### 3. Visibilitas Fungsi dan Variabel: public dan private
**Apa itu**: Di Solidity, setiap fungsi dan variabel state memiliki tingkat akses (*visibility*):
* **`public`**: Dapat diakses dan dibaca oleh siapa saja dari luar blockchain (investor/dApp) maupun dari dalam kontrak itu sendiri.
* **`private`**: Hanya dapat dibaca dan dieksekusi oleh kode internal smart contract. Informasi sensitif (seperti kode brankas fisik) tidak dapat dipanggil langsung oleh dompet luar.

Buat file `LearnVisibility.sol`:

```solidity title="LearnVisibility.sol"
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract LearnVisibility {
    // Data publik yang boleh diakses seluruh calon investor
    string public publicLegalNotice = "Sertifikat Tanah Hak Milik No. 882/Canggu";

    // Data privat: Hanya digunakan untuk audit internal pengelola
    string private internalVaultCode = "VAULT-SEC-9912";

    // Fungsi publik untuk memverifikasi keabsahan data privat secara terkontrol
    function verifyVaultCode() public view returns (string memory) {
        return getInternalCode();
    }

    // Fungsi private pembantu yang hanya bisa dipanggil dari dalam kontrak
    function getInternalCode() private view returns (string memory) {
        return internalVaultCode;
    }
}
```

**Coba di Remix**:
1. **Deploy** contract `LearnVisibility`.
2. Perhatikan tombol yang muncul di panel *Deployed Contracts*:
   * Tombol biru **`publicLegalNotice`** dan **`verifyVaultCode`** muncul karena berstatus **`public`**.
   * Variabel `internalVaultCode` dan fungsi `getInternalCode` **TIDAK muncul** sebagai tombol karena berstatus **`private`**!
3. Klik tombol biru **`verifyVaultCode`** ➡️ Muncul teks `"VAULT-SEC-9912"`. Ini membuktikan fungsi internal kontrak dapat mengakses data privat secara aman.

---

### 4. State Mutability (view & pure) serta Nilai Balik Fungsi
**Apa itu**: Fungsi yang hanya membaca data dari storage tanpa mengubah state ditandai dengan **`view`**. Pemanggilan fungsi `view` bersifat **100% bebas gas (*gas-free*)** dan tidak memicu popup MetaMask. Fungsi **`pure`** melakukan kalkulasi murni tanpa membaca storage blockchain. Fungsi yang mengubah state memerlukan transaksi dan gas fee.

Buat file `LearnFunctions.sol`:

```solidity title="LearnFunctions.sol"
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract LearnFunctions {
    uint256 public totalFractionsSold = 0;
    uint256 public constant FRACTION_PRICE = 0.001 ether;

    // 1. Fungsi Pengubah State: Memotong kuota & mengubah state (Butuh Gas)
    function recordSale(uint256 _amount) public {
        totalFractionsSold += _amount;
    }

    // 2. Fungsi 'view': HANYA MEMBACA data (100% GRATIS, Tanpa Gas Fee)
    function getTotalSold() public view returns (uint256) {
        return totalFractionsSold;
    }

    // 3. Fungsi 'pure': Menghitung estimasi biaya investasi sebelum transaksi
    function calculateTotalCost(uint256 _amount) public pure returns (uint256) {
        return _amount * FRACTION_PRICE;
    }
}
```

**Coba di Remix**:
1. **Deploy** contract `LearnFunctions`.
2. Perhatikan perbedaan warna tombol:
   * **Tombol Biru** (`getTotalSold`, `calculateTotalCost`, `FRACTION_PRICE`): Fungsi `view`/`pure` ➡️ Klik instan bebas biaya gas.
   * **Tombol Oranye** (`recordSale`): Fungsi pengubah state ➡️ Membutuhkan tanda tangan transaksi.
3. Masukkan angka `5` pada **`calculateTotalCost`** ➡️ Klik tombol biru ➡️ Muncul `5000000000000000` (yaitu `0.005 ETH` dalam Wei).
4. Masukkan angka `5` pada tombol oranye **`recordSale`** ➡️ Klik tombol ➡️ Lalu klik **`getTotalSold`** ➡️ Sekarang bernilai `5`!

---

### 5. Struktur Data Mapping (Key-Value Storage)
**Apa itu**: `mapping(keyType => valueType)` adalah buku besar (*ledger*) tabel hash pada blockchain yang memetakan alamat dompet (`address`) ke jumlah fraksi saham kepemilikan (`uint256`).

Buat file `LearnMapping.sol`:

```solidity title="LearnMapping.sol"
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract LearnMapping {
    // Buku besar kepemilikan: Alamat Investor => Jumlah Fraksi
    mapping(address => uint256) public fractionBalances;

    // Menetapkan kepemilikan fraksi ke alamat investor tertentu
    function assignFractions(address _investor, uint256 _shares) public {
        fractionBalances[_investor] += _shares;
    }

    // Membaca kepemilikan investor tertentu
    function getInvestorFractions(address _investor) public view returns (uint256) {
        return fractionBalances[_investor];
    }
}
```

**Coba di Remix**:
1. **Deploy** contract `LearnMapping`.
2. Salin alamat akun Anda dari bagian atas panel Remix (dropdown **ACCOUNT**).
3. Masukkan alamat dompet Anda dan angka `10` pada kolom **`assignFractions`** (format: `0x5B38Da6a701c568545dCfcB03FcB875f56beddC4, 10`).
4. Klik tombol oranye **`assignFractions`**.
5. Masukkan alamat dompet Anda ke kolom biru **`getInvestorFractions`** ➡️ Muncul angka `10`!

---

### 6. Global Variable msg.sender (Autentikasi Pemanggil)
**Apa itu**: Di Web2, pengguna mengirim username/password yang rentan diretas. Di Solidity, **`msg.sender`** adalah variabel global bawaan EVM yang membaca alamat dompet penandatangan transaksi secara otomatis via kriptografi. Identitas pemanggil tidak bisa dipalsukan oleh siapa pun!

Buat file `LearnMsgSender.sol`:

```solidity title="LearnMsgSender.sol"
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract LearnMsgSender {
    // Mencatat siapa investor terakhir yang berinvestasi
    address public lastInvestor;
    mapping(address => uint256) public myFractions;

    // Investor mengklaim fraksi tanpa perlu menginput alamat dompetnya secara manual
    function investMySelf(uint256 _shares) public {
        lastInvestor = msg.sender; // msg.sender otomatis membaca dompet Anda!
        myFractions[msg.sender] += _shares;
    }
}
```

**Coba di Remix**:
1. **Deploy** contract `LearnMsgSender`.
2. Masukkan angka `3` pada kolom oranye **`investMySelf`** ➡️ Klik tombol.
3. Klik tombol biru **`lastInvestor`** ➡️ Alamat dompet Anda langsung tercatat tanpa Anda pernah mengetiknya!
4. Masukkan alamat Anda pada **`myFractions`** ➡️ Muncul nilai `3`!

---

### 7. Global Variable block.timestamp & Time Units
**Apa itu**: **`block.timestamp`** mengembalikan waktu standar UNIX saat blok tersebut divalidasi oleh Sequencer Arbitrum. Fitur ini krusial untuk membuat periode jeda (*cooldown*) guna melindungi sistem dari bot, atau menetapkan tenggat waktu penawaran investasi.

Buat file `LearnTimestamp.sol`:

```solidity title="LearnTimestamp.sol"
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract LearnTimestamp {
    mapping(address => uint256) public lastInvestmentTime;
    uint256 public constant COOLDOWN_DURATION = 15 seconds;

    // Investor hanya boleh melakukan transaksi setiap 15 detik sekali
    function recordInvestment() public {
        require(
            block.timestamp >= lastInvestmentTime[msg.sender] + COOLDOWN_DURATION,
            "Harap tunggu 15 detik sebelum melakukan investasi lagi!"
        );
        lastInvestmentTime[msg.sender] = block.timestamp;
    }

    // Melihat sisa waktu cooldown untuk investor
    function checkCooldown(address _investor) public view returns (uint256) {
        if (block.timestamp >= lastInvestmentTime[_investor] + COOLDOWN_DURATION) {
            return 0; // Cooldown sudah selesai, siap transaksi
        }
        return (lastInvestmentTime[_investor] + COOLDOWN_DURATION) - block.timestamp;
    }
}
```

**Coba di Remix**:
1. **Deploy** contract `LearnTimestamp`.
2. Klik tombol oranye **`recordInvestment`** ➡️ Transaksi sukses.
3. Langsung klik lagi tombol **`recordInvestment`** dalam 15 detik ➡️ Transaksi seketika **gagal (*revert*)** dengan pesan error cooldown!
4. Tunggu 15 detik, lalu klik lagi ➡️ Transaksi kembali sukses!

---

### 8. Transaksi Finansial: Kata Kunci payable & Nilai msg.value
**Apa itu**: Secara bawaan, smart contract di Ethereum/Arbitrum akan menolak (*revert*) setiap transaksi yang mencoba mentransfer koin ETH jika fungsi tersebut tidak memiliki pengubah khusus **`payable`**. Variabel global **`msg.value`** membaca jumlah koin ETH (dalam satuan terkecil, yaitu **Wei**, di mana `1 ETH = 10^18 Wei`) yang dikirimkan oleh investor bersama transaksi tersebut.

Buat file `LearnPayable.sol`:

```solidity title="LearnPayable.sol"
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract LearnPayable {
    // Total dana ETH yang terkumpul di dalam kontrak (dalam satuan Wei)
    uint256 public totalFundsReceived;

    // Kata kunci 'payable' mengizinkan fungsi menerima kiriman dana ETH asli
    function invest() public payable {
        // msg.value otomatis membaca berapa banyak ETH yang ditransfer oleh pemanggil
        totalFundsReceived += msg.value;
    }

    // Membaca saldo ETH yang tersimpan di brankas smart contract ini secara langsung
    function getContractBalance() public view returns (uint256) {
        return address(this).balance;
    }
}
```

**Coba di Remix**:
1. **Deploy** contract `LearnPayable`.
2. Perhatikan tombol fungsi di panel *Deployed Contracts*: Tombol **`invest`** berwarna **merah tua/burgundy** (bukan oranye biasa), menandakan bahwa fungsi ini adalah fungsi `payable` yang dapat menerima transfer uang kripto!
3. Di panel atas Remix (bagian **VALUE**):
   * Masukkan angka `2`.
   * Ubah satuan dari `Wei` menjadi **`Finney`** (setara dengan `0.002 Ether`).
4. Klik tombol merah **`invest`** ➡️ Setujui transaksi di MetaMask.
5. Klik tombol biru **`getContractBalance`** ➡️ Muncul nilai `2000000000000000` (angka 18 desimal Wei dari 0.002 ETH). Dana berhasil masuk ke saldo smart contract!

---

### 9. Validasi Kondisi & Error Handling: require()
**Apa itu**: **`require(kondisi, "pesan error")`** adalah penjaga gerbang (*guard clause*) di Solidity. Jika kondisi bernilai `false`, seluruh eksekusi transaksi langsung dibatalkan (*revert*), seluruh perubahan state dikembalikan ke kondisi semula, dan sisa gas fee dikembalikan ke dompet pengguna. Di smart contract RWA, `require()` digunakan untuk memastikan sisa kuota fraksi mencukupi dan pembayaran ETH yang dikirimkan (`msg.value`) sesuai dengan harga.

Buat file `LearnRequire.sol`:

```solidity title="LearnRequire.sol"
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract LearnRequire {
    uint256 public availableFractions = 50;
    uint256 public constant FRACTION_PRICE = 0.001 ether;

    function purchaseFractions(uint256 _amount) public payable {
        // 1. Validasi kuantitas minimal
        require(_amount > 0, "Jumlah pembelian harus lebih dari 0!");

        // 2. Validasi ketersediaan stok fraksi
        require(_amount <= availableFractions, "Sisa kuota fraksi properti tidak cukup!");

        // 3. Validasi pembayaran ETH investor
        uint256 totalCost = _amount * FRACTION_PRICE;
        require(msg.value >= totalCost, "Pembayaran ETH yang dikirim kurang!");

        availableFractions -= _amount;
    }
}
```

**Coba di Remix**:
1. **Deploy** contract `LearnRequire`.
2. Masukkan angka `10` pada kolom **`purchaseFractions`**, isi kolom **VALUE** dengan `0.01 Ether` (atau `10 Finney`) ➡️ Sukses! Nilai `availableFractions` berkurang jadi `40`.
3. Masukkan angka `0` pada **`purchaseFractions`** ➡️ Gagal dengan pesan: `"Jumlah pembelian harus lebih dari 0!"`.
4. Masukkan angka `5` pada **`purchaseFractions`**, tapi kosongkan kolom VALUE (`0 Ether`) ➡️ Gagal dengan pesan: `"Pembayaran ETH yang dikirim kurang!"`.
5. Masukkan angka `100` pada **`purchaseFractions`** ➡️ Gagal dengan pesan: `"Sisa kuota fraksi properti tidak cukup!"`.

---

### 10. Event Logging & Emit: Komunikasi State ke Frontend
**Apa itu**: Blockchain tidak memiliki sistem webhook REST API tradisional. Untuk memberitahu frontend dApp saat ada transaksi baru, smart contract memancarkan **`event`** menggunakan perintah **`emit`**. Frontend React dapat mendengarkan event ini secara real-time untuk memperbarui tampilan UI tanpa reload halaman!

Buat file `LearnEvent.sol`:

```solidity title="LearnEvent.sol"
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract LearnEvent {
    // Deklarasi event: parameter 'indexed' mempermudah pencarian log oleh dApp
    event FractionPurchased(
        address indexed investor,
        uint256 amount,
        uint256 timestamp
    );

    function buy(uint256 _shares) public {
        // Pancarkan log event ke blockchain
        emit FractionPurchased(msg.sender, _shares, block.timestamp);
    }
}
```

**Coba di Remix**:
1. **Deploy** contract `LearnEvent`.
2. Masukkan angka `5` pada **`buy`** ➡️ Klik tombol oranye.
3. Buka konsol log di bagian bawah layar Remix, klik tanda panah pada baris transaksi terbaru.
4. Perhatikan bagian **logs**: Terdapat data event `FractionPurchased` lengkap dengan alamat `investor`, jumlah `amount: 5`, dan `timestamp`!

---

### 11. Constructor & Kontrol Hak Akses (Owner)
**Apa itu**: **`constructor()`** adalah fungsi inisialisasi yang hanya dieksekusi satu kali saat kontrak pertama kali dideploy. Kita menyematkan alamat `msg.sender` deployer ke dalam variabel `owner`, lalu membuat proteksi agar fitur manajerial (seperti penarikan dana investasi) hanya dapat dijalankan oleh pemilik properti sah.

Buat file `LearnOwner.sol`:

```solidity title="LearnOwner.sol"
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract LearnOwner {
    address public owner;
    uint256 public totalInvestmentQuota;

    // Modifier untuk membatasi akses khusus owner
    modifier onlyOwner() {
        require(msg.sender == owner, "Akses ditolak: Anda bukan pengelola properti!");
        _;
    }

    // Constructor menetapkan owner awal
    constructor(uint256 _initialQuota) {
        owner = msg.sender;
        totalInvestmentQuota = _initialQuota;
    }

    // Fungsi manajerial: Hanya bisa dieksekusi oleh owner
    function expandQuota(uint256 _extraQuota) public onlyOwner {
        totalInvestmentQuota += _extraQuota;
    }
}
```

**Coba di Remix**:
1. Masukkan angka `1000` di samping tombol **Deploy** ➡️ Klik **Deploy**.
2. Klik tombol biru **`owner`** ➡️ Muncul alamat dompet Anda.
3. Masukkan angka `500` pada **`expandQuota`** ➡️ Transaksi sukses! `totalInvestmentQuota` bertambah jadi `1500`.
4. *(Uji Keamanan)*: Beralih ke akun lain di dropdown **ACCOUNT** Remix, lalu klik **`expandQuota`** ➡️ Transaksi ditolak dengan pesan: `"Akses ditolak: Anda bukan pengelola properti!"`.

---

## 🏆 Tantangan Proyek Utama: Membangun `FractionalProperty.sol`

Setelah menguasai 11 fondasi Solidity di atas, saatnya menyatukannya ke dalam satu smart contract produksi: **Platform Investasi Properti Fraksional (*Real World Asset*)**!

Kontrak ini mengintegrasikan seluruh elemen:
* Penyimpanan identitas aset fisik & tautan sertifikat legal on-chain (`propertyDocumentURI`).
* Pembayaran pembelian fraksi menggunakan mata uang kripto asli (`payable` ETH di Arbitrum).
* Pencatatan saldo kepemilikan investor yang aman dan transparan.
* Penarikan modal investasi khusus pemilik aset (`onlyOwner`).
* Notifikasi live ke antarmuka web melalui **Events**.

### 📦 Langkah Praktis: Menyiapkan Dokumen Legalitas Fisik ke IPFS via Pinata

Sebelum men-deploy smart contract RWA, aset properti fisik harus ditautkan dengan dokumen bukti legalitas aslinya (misalnya sertifikat tanah BPN atau surat kepemilikan villa). 

Karena menyimpan file fisik besar (seperti PDF berukuran 2–5 MB) langsung ke dalam blockchain Arbitrum membutuhkan biaya gas yang sangat mahal, standar industri Web3 menggunakan **IPFS (*InterPlanetary File System*)**:

1. **Mengapa Menggunakan IPFS untuk RWA?**
   - **Content-Addressed Storage**: Berbeda dengan URL web biasa yang bisa mati atau diubah diam-diam oleh pemilik server, file di IPFS diidentifikasi berdasarkan isi kontennya melalui hash kriptografis unik yang disebut **CID (*Content Identifier*)**.
   - **Immutable & Transparan**: Jika dokumen sertifikat tanah diubah atau dipalsukan satu karakter saja, nilai hash CID-nya akan berubah total. Smart contract menyimpan hash CID ini sebagai garansi permanen bahwa dokumen legal tidak dapat dimanipulasi.

2. **3 Langkah Cepat Mengunggah File ke IPFS (Gratis via Pinata):**
   - **Langkah 1: Daftar Akun Gratis** di layanan IPFS pinning terpopuler [Pinata.cloud](https://pinata.cloud) (atau alternatif seperti [Filebase](https://filebase.com)).
   - **Langkah 2: Upload File** ➡️ Buka dashboard Pinata, klik tombol **Upload** ➡️ Pilih **File** ➡️ Unggah dokumen sampel Anda (misalnya file PDF dummy sertifikat tanah atau foto properti villa).
   - **Langkah 3: Salin Nilai CID** ➡️ Setelah selesai, salin string **CID** yang tertera di tabel file Anda (contoh format: `QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco`).

3. **Format Standar URI Web3**:
   Rangkai CID yang Anda dapatkan dengan protokol `ipfs://`:
   ```text
   ipfs://QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco/sertifikat-tanah.pdf
   ```
   Tautan hash inilah yang dimasukkan ke variabel `propertyDocumentURI` di bawah ini sebelum Anda menekan tombol deploy di Remix IDE!

:::tip Ingin Langsung Latihan Cepat Tanpa Ribet Setup IPFS?
Jika Anda atau peserta workshop tidak ingin repot mendaftar akun dan mengunggah file mandiri ke Pinata/IPFS saat sesi berlangsung, Anda dapat langsung menggunakan **CID dokumen sertifikat legalitas resmi** yang telah kami siapkan:
```text
bafybeiexwukp7b44s42dk7fjybeduq4teqganfsmndrpxmr6im32meru3i
```
Atau dalam format protokol Web3:
```text
ipfs://bafybeiexwukp7b44s42dk7fjybeduq4teqganfsmndrpxmr6im32meru3i
```
Nilai ini sudah terpasang langsung secara *default* di dalam constructor smart contract `FractionalProperty.sol` di bawah ini, sehingga peserta dapat langsung men-deploy kontrak dan menguji coba integrasi frontend tanpa hambatan!
:::

### Kode Lengkap Smart Contract:

```solidity title="FractionalProperty.sol"
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title FractionalProperty (Bali Sunset Villa #01)
 * @notice Smart Contract Real World Asset (RWA) untuk tokenisasi properti fraksional di Arbitrum Sepolia.
 */
contract FractionalProperty {
    // ==========================================
    // 1. DATA ASET & STATE VARIABLES
    // ==========================================

    string public propertyName;
    string public propertySymbol;
    // Tautan permanen ke dokumen sertifikat tanah legal fisik di IPFS
    string public propertyDocumentURI;

    // Alamat dompet pengelola aset / developer properti
    address public owner;

    // Harga per fraksi properti (0.001 ETH)
    uint256 public fractionPrice;

    // Total fraksi yang diterbitkan
    uint256 public totalFractions;

    // Sisa fraksi yang masih tersedia untuk dibeli
    uint256 public availableFractions;

    // Buku besar kepemilikan: Alamat Investor => Jumlah Fraksi Dimiliki
    mapping(address => uint256) public fractionBalances;

    // Waktu transaksi terakhir investor (untuk anti-spam / cooldown)
    mapping(address => uint256) public lastInvestmentTime;
    uint256 public constant COOLDOWN_PERIOD = 10 seconds;

    // ==========================================
    // 2. EVENTS (Logging untuk Frontend dApp)
    // ==========================================

    event FractionPurchased(
        address indexed investor,
        uint256 amount,
        uint256 totalCost,
        uint256 remainingFractions,
        uint256 timestamp
    );

    event FractionsRestocked(
        uint256 additionalFractions,
        uint256 newAvailableFractions,
        uint256 timestamp
    );

    event FundsWithdrawn(
        address indexed owner,
        uint256 amount,
        uint256 timestamp
    );

    // ==========================================
    // 3. MODIFIERS
    // ==========================================

    modifier onlyOwner() {
        require(msg.sender == owner, "Akses ditolak: Hanya pengelola properti yang berhak!");
        _;
    }

    // ==========================================
    // 4. CONSTRUCTOR
    // ==========================================

    constructor() {
        propertyName = "Bali Sunset Villa #01";
        propertySymbol = "VILLA-BALI-01";
        // CID resmi dokumen properti workshop (peserta dapat langsung pakai tanpa ribet upload mandiri ke IPFS)
        propertyDocumentURI = "ipfs://bafybeiexwukp7b44s42dk7fjybeduq4teqganfsmndrpxmr6im32meru3i";

        owner = msg.sender;
        fractionPrice = 0.001 ether; // 0.001 ETH per lembar fraksi
        totalFractions = 1000;
        availableFractions = 1000;
    }

    // ==========================================
    // 5. CORE FUNCTIONS (Investasi & Beli Saham)
    // ==========================================

    /**
     * @notice Membeli sejumlah fraksi kepemilikan properti dengan mengirimkan ETH.
     * @param _amount Jumlah unit fraksi yang ingin dibeli.
     */
    function buyFractions(uint256 _amount) public payable {
        // Validasi 1: Kuantitas harus valid
        require(_amount > 0, "Jumlah pembelian fraksi harus lebih dari 0!");

        // Validasi 2: Sisa fraksi harus mencukupi
        require(_amount <= availableFractions, "Sisa kuota fraksi properti tidak mencukupi!");

        // Validasi 3: Nilai pembayaran ETH harus tepat atau lebih
        uint256 totalCost = _amount * fractionPrice;
        require(msg.value >= totalCost, "Pembayaran ETH yang dikirim kurang!");

        // Validasi 4: Cooldown antar transaksi untuk proteksi anti-spam
        require(
            block.timestamp >= lastInvestmentTime[msg.sender] + COOLDOWN_PERIOD,
            "Harap tunggu periode cooldown selesai sebelum melakukan investasi lagi!"
        );

        // Update State
        lastInvestmentTime[msg.sender] = block.timestamp;
        availableFractions -= _amount;
        fractionBalances[msg.sender] += _amount;

        // Pancarkan event agar antarmuka web dApp langsung ter-update live
        emit FractionPurchased(
            msg.sender,
            _amount,
            totalCost,
            availableFractions,
            block.timestamp
        );

        // Kembalikan kelebihan pembayaran ETH jika investor mengirim lebih
        if (msg.value > totalCost) {
            payable(msg.sender).transfer(msg.value - totalCost);
        }
    }

    // ==========================================
    // 6. VIEW FUNCTIONS (Pembacaan Data Gratis)
    // ==========================================

    /**
     * @notice Membaca jumlah fraksi yang dimiliki oleh alamat pemanggil saat ini.
     */
    function getMyFractions() public view returns (uint256) {
        return fractionBalances[msg.sender];
    }

    /**
     * @notice Membaca jumlah fraksi yang dimiliki oleh alamat investor tertentu.
     */
    function getInvestorFractions(address _investor) public view returns (uint256) {
        return fractionBalances[_investor];
    }

    // ==========================================
    // 7. OWNER FUNCTIONS (Manajemen Properti)
    // ==========================================

    /**
     * @notice Menambah kuota fraksi properti (Hanya untuk pengelola aset).
     */
    function restockFractions(uint256 _additionalFractions) public onlyOwner {
        require(_additionalFractions > 0, "Jumlah penambahan harus lebih dari 0!");
        
        availableFractions += _additionalFractions;
        totalFractions += _additionalFractions;

        emit FractionsRestocked(_additionalFractions, availableFractions, block.timestamp);
    }

    /**
     * @notice Menarik dana ETH hasil penjualan investasi untuk renovasi/operasional properti fisik.
     */
    function withdrawFunds() public onlyOwner {
        uint256 contractBalance = address(this).balance;
        require(contractBalance > 0, "Tidak ada saldo ETH yang dapat ditarik!");

        payable(owner).transfer(contractBalance);

        emit FundsWithdrawn(owner, contractBalance, block.timestamp);
    }
}
```

---

## 🧪 Praktik Langsung: Kompilasi, Deploy & Uji di Arbitrum Sepolia

Setelah memahami smart contract `FractionalProperty.sol`, ikuti langkah-langkah praktis berikut di Remix IDE:

### 1. Kompilasi Kontrak
1. Di panel bilah kiri Remix, buka tab **Solidity compiler** (ikon kedua).
2. Pastikan compiler version sesuai (misal: `0.8.20`).
3. Klik tombol biru **Compile FractionalProperty.sol** hingga muncul tanda centang hijau.

### 2. Deploy ke Arbitrum Sepolia
1. Pastikan ekstensi MetaMask Anda aktif di jaringan **Arbitrum Sepolia** (Chain ID: `421614`).
2. Buka tab **Deploy & Run Transactions** (ikon ketiga di bilah navigasi kiri Remix).
3. Pada dropdown **ENVIRONMENT**, pilih **Injected Provider - MetaMask**.
4. Klik tombol oranye **Deploy**.
5. Setujui transaksi di jendela pop-up MetaMask (biaya gas dipotong dari saldo Arbitrum Sepolia ETH Anda).

### 3. Uji Fungsionalitas Interaktif
Setelah transaksi berhasil dikonfirmasi oleh Sequencer Arbitrum (~250ms), buka menu dropdown kontrak Anda di bagian bawah panel kiri:

1. **Cek Informasi Aset**:
   * Klik tombol biru `propertyName` ➡️ Muncul `"Bali Sunset Villa #01"`.
   * Klik tombol biru `propertyDocumentURI` ➡️ Muncul tautan sertifikat IPFS.
   * Klik tombol biru `availableFractions` ➡️ Muncul angka `1000`.
2. **Uji Pembelian Fraksi (`buyFractions`)**:
   * Di bagian atas panel Remix, pada kolom **VALUE**, masukkan angka `10` dan ubah satuan dari `Wei` menjadi **`Finney`** (atau `0.01 Ether`).
   * Pada kolom fungsi oranye `buyFractions`, masukkan angka `10` (membeli 10 fraksi seharga 0.01 ETH).
   * Klik tombol `buyFractions` ➡️ Konfirmasi di MetaMask.
   * Klik tombol biru `getMyFractions` ➡️ Nilai kepemilikan Anda bertambah menjadi `10`!
   * Klik `availableFractions` ➡️ Kuota sisa berkurang dari `1000` menjadi `990`!
3. **Uji Validasi Cooldown**:
   * Segera klik tombol `buyFractions` sekali lagi tanpa menunggu.
   * Transaksi seketika **gagal (*revert*)** dengan pesan: `"Harap tunggu periode cooldown selesai sebelum melakukan investasi lagi!"`.
4. **Uji Penarikan Dana Pengelola (`withdrawFunds`)**:
   * Klik tombol oranye `withdrawFunds` menggunakan akun deployer (owner).
   * Dana ETH hasil penjualan fraksi berhasil ditransfer langsung ke dompet Anda!

### 4. Verifikasi di Block Explorer (Arbiscan)

Setelah smart contract Anda berhasil di-deploy ke **Arbitrum Sepolia**, kontrak tersebut memiliki identitas unik berupa **Contract Address (CA)**. Block explorer resmi **[Arbiscan Sepolia](https://sepolia.arbiscan.io/)** adalah sarana audit terbuka untuk memverifikasi seluruh kebenaran aset secara on-chain:

#### Langkah 1: Salin Contract Address (CA)
1. Di panel kiri bawah Remix IDE, pada bagian **Deployed Contracts**, cari entri kontrak `FRACTIONALPROPERTY`.
2. Klik ikon salin (📋) di samping nama kontrak untuk meng-copy alamat kontrak (contoh format: `0x7b12C9B...d34A`).

#### Langkah 2: Buka Contract Address di Arbiscan
1. Buka peramban dan kunjungi **[sepolia.arbiscan.io](https://sepolia.arbiscan.io/)**.
2. Tempelkan (*paste*) **Contract Address (CA)** Anda di bilah pencarian utama, lalu tekan **Enter**.
3. Di halaman ikhtisar kontrak, Anda dapat melihat:
   * **Contract Creator**: Alamat dompet pengelola properti (*deployer/owner*) dan hash transaksi pembuatan kontrak (`Contract Creation`).
   * **Balance**: Saldo ETH yang terkumpul dari hasil penjualan fraksi.
   * **Transactions**: Daftar seluruh transaksi yang memanggil fungsi `buyFractions`, `restockFractions`, dan `withdrawFunds`.

#### Langkah 3: Verifikasi Source Code (Verify & Publish)
Agar tab **"Read Contract"** dan **"Write Contract"** terbuka penuh di Arbiscan:
1. Klik tab **Contract** di Arbiscan ➡️ Klik tautan biru **Verify and Publish**.
2. Pilih opsi:
   * **Compiler Type**: *Solidity (Single file)*
   * **Compiler Version**: `v0.8.20+commit.a1b79de6` (sesuaikan dengan compiler di Remix)
   * **Open Source License Type**: *MIT License (MIT)*
3. Klik **Continue**, lalu tempelkan seluruh kode sumber `FractionalProperty.sol` ke kolom kode.
4. Klik **Verify and Publish**. Arbiscan akan menampilkan centang hijau: `Contract Source Code Verified`.

#### Langkah 4: Eksplorasi Tab "Read Contract" (Audit Dokumen & Kepemilikan)
Setelah terverifikasi, klik tab **Contract** ➡️ **Read Contract**:
* Klik fungsi **`propertyName`**: Mengembalikan nilai string `"Bali Sunset Villa #01"`.
* Klik fungsi **`propertyDocumentURI`**: Mengembalikan URI `"ipfs://bafybeiexwukp7b44s42dk7fjybeduq4teqganfsmndrpxmr6im32meru3i"`.
* Klik fungsi **`availableFractions`**: Mengembalikan sisa kuota yang tersedia secara *real-time*.
* Klik fungsi **`fractionPrice`**: Mengembalikan angka `1000000000000000` (setara 0.001 ETH).

#### Langkah 5: Eksplorasi Tab "Events" (Audit Transaksi & Transparansi)
Klik tab **Events** di Arbiscan:
* Setiap kali transaksi `buyFractions` terjadi, event **`FractionPurchased`** tercatat permanen di blockchain Arbitrum lengkap dengan alamat dompet pembeli, jumlah kuota saham yang dibeli, dan sisa fraksi yang ada saat itu.

:::tip 💡 FAQ Peserta: "Bukankah Ini Sama Saja dengan Menaruh Tag `<img>` Biasa di HTML?"
Pertanyaan ini sering muncul dari pengembang Web2. Jawabannya adalah **sangat berbeda secara fundamental**:

1. **Prasasti Abadi vs Mading Kantor**:
   * Menaruh gambar/dokumen di HTML biasa (`<img src="server.com/villa.png">`) ibarat menempelkan fotokopi sertifikat tanah di mading kantor swasta. Admin server cloud bisa diam-diam mengganti file tersebut kapan saja.
   * Di Web3 RWA, sidik jari digital (hash IPFS `bafybeiexwukp7b44s42dk7fjybeduq4teqganfsmndrpxmr6im32meru3i`) **dipahat permanen di ledger blockchain Arbitrum**. Dokumen fisik yang diwakilinya tidak bisa ditukar sepihak dengan sertifikat properti lain karena hash kriptografisnya diikat mati di smart contract.
2. **Kebenaran Mutlak Ada di Smart Contract, Bukan di Website**:
   * Frontend React hanyalah "kaca pembesar" atau antarmuka visual untuk membaca apa yang tertulis di smart contract on-chain.
   * Jika besok server frontend mati, bangkrut, atau di-hack, **hak kepemilikan dan bukti dokumen legalitas aset villa tetap hidup permanen**. Siapapun di dunia dapat langsung memverifikasinya melalui **Arbiscan** cukup dengan bermodalkan Contract Address (CA)!
:::

---

## 🏛️ Membedah Arsitektur RWA: Web2 vs Web3

| Aspek | Platform Properti Web2 | Smart Contract RWA (Arbitrum Sepolia) |
| :--- | :--- | :--- |
| **Pencatatan Kepemilikan** | Tabel database SQL internal perusahaan. | Buku besar terdistribusi `mapping` on-chain yang *immutable*. |
| **Bukti Legal Fisik** | File PDF di server cloud privat yang bisa diubah. | Hash dokumen sertifikat tanah permanen di IPFS & Smart Contract. |
| **Verifikasi Investor** | Username & Password yang rentan disusupi. | Tanda tangan kriptografis dari wallet Web3 (`msg.sender`). |
| **Penyelesaian Transaksi** | Berhari-hari via transfer bank konvensional. | **Sub-detik (~250ms)** di jaringan Arbitrum. |
| **Kedaulatan Investor** | Jika platform tutup, bukti kepemilikan hilang. | Investor memegang hak kepemilikan permanen di dompet pribadi. |

---

## 📝 Ringkasan

Selamat! Anda telah menguasai fondasi penuh smart contract Real World Asset (RWA):
* Memahami bagaimana aset properti fisik dapat difraksionalisasi secara aman di blockchain.
* Mengamankan hak kepemilikan investor secara deterministik menggunakan **`msg.sender`** dan **`mapping`**.
* Menerapkan validasi kuota dan pembayaran aman menggunakan **`require()`** dan **`payable`**.
* Menautkan dokumen legal aset fisik ke smart contract on-chain.
* Melakukan deployment dan uji coba langsung di testnet resmi **Arbitrum Sepolia**.

---

## 📚 Sumber Belajar Lanjutan

* **[Arbitrum Docs - Quickstart Solidity Remix](https://docs.arbitrum.io/build-decentralized-apps/quickstart-solidity-remix)**: Sumber dokumentasi asli panduan quickstart dApp Arbitrum.
* **[Stylus Quickstart](https://docs.arbitrum.io/stylus/quickstart)**: Panduan resmi menulis smart contract berkinerja tinggi menggunakan bahasa pemrograman **Rust** di Arbitrum.
* **[Arbitrum Solidity References](https://docs.arbitrum.io/arbitrum-essentials/reference/solidity-references)**: Referensi fungsi dan integrasi EVM Arbitrum.
* **[Dokumentasi Resmi Arbitrum](https://docs.arbitrum.io/)**: Panduan lengkap ekosistem Rollups, Orbit, dan Stylus.

---

## 📌 Catatan Kaki (*Footnotes*)

[^1]: Tokenisasi Real World Asset (RWA) adalah salah satu inovasi terdepan di ekosistem Web3, memungkinkan aset fisik bernilai besar (seperti properti, emas, komoditas, dan obligasi) diperdagangkan dalam satuan fraksi mikro dengan likuiditas global dan transparansi audit 24/7 di jaringan Layer-2 Arbitrum.