---
id: quickstart-solidity-remix
title: Bangun Aplikasi Terdesentralisasi (dApp) dengan Solidity (Quickstart)
sidebar_label: Quickstart Solidity + Remix
sidebar_position: 1
description: Panduan lengkap dan terstruktur membangun aplikasi terdesentralisasi (dApp) di Arbitrum menggunakan Solidity modern, Remix IDE, Foundry Anvil, dan testnet Arbitrum Sepolia.
---

# Bangun Aplikasi Terdesentralisasi (dApp) dengan Solidity (Quickstart)

---

## 🎯 Apa yang Akan Kita Pelajari

Dalam panduan praktis ini, Anda akan mempelajari:

1. **Konsep Dasar Web3**: Perbedaan arsitektur client/server tradisional (Web2) vs komputasi terdistribusi blockchain (Web3).
2. **Fase Persiapan**: Menyiapkan dompet **MetaMask** dengan jaringan **Arbitrum Sepolia** dan menghubungkannya ke **Remix IDE**.
3. **Fondasi Solidity Esensial**: Memahami konsep inti yang digunakan di smart contract dunia nyata:
   * **`msg.sender`**: Autentikasi dompet otomatis (identitas berasal langsung dari tanda tangan transaksi, bukan input form manual).
   * **`require()`**: Standar validasi kondisi dan penanganan error yang bersih.
   * **`event` & `emit`**: Mekanisme pencatatan log blockchain yang menjadi jembatan notifikasi ke frontend/dApp.
   * **`constructor` & Hak Akses Admin (`owner`)**: Menentukan pemilik kontrak yang berhak mengelola stok mesin.
4. **Tantangan Proyek Utama (`VendingMachine.sol`)**: Membangun smart contract lengkap mesin penjual otomatis cupcake digital.
5. **Praktik Langsung (Compile, Deploy, Test & Verify)**: Mengompilasi kode di Remix, men-deploy ke **Arbitrum Sepolia Testnet** via MetaMask, menguji logika bisnis secara interaktif, dan memverifikasi hasilnya di **Arbiscan**.

---

## ⚙️ Tinjauan Kasus: Mesin Penjual Otomatis (*Vending Machine*)

Kita akan memodelkan sebuah **mesin penjual otomatis cupcake digital (*digital cupcake vending machine*)**[^1]. Mesin ini memiliki aturan bisnis sederhana:
1. Setiap pengguna berhak mengambil 1 cupcake gratis setiap 5 detik (*cooldown period*).
2. Mesin memiliki stok terbatas; jika habis, hanya pemilik mesin (*owner*) yang berhak mengisi ulang stok.
3. Aturan operasional bersifat transparan dan tidak dapat dimanipulasi secara sepihak.

### Perbandingan Masalah: Mengapa Web2 Tidak Cukup?

Jika kita membangun mesin ini dengan JavaScript dan server Web2 biasa:

```js title="VendingMachine.js (Model Web2)"
class VendingMachine {
  cupcakeBalances = {};
  cupcakeDistributionTimes = {};

  // Di Web2, identitas userId dikirim manual lewat form/parameter
  giveCupcakeTo(userId) {
    const fiveSeconds = 5000;
    const lastClaim = this.cupcakeDistributionTimes[userId] || 0;

    if (Date.now() - lastClaim >= fiveSeconds) {
      this.cupcakeBalances[userId] = (this.cupcakeBalances[userId] || 0) + 1;
      this.cupcakeDistributionTimes[userId] = Date.now();
      return true;
    }
    return false;
  }
}
```

:::caution Titik Lemah Arsitektur Web2 Tersentralisasi
1. **Identitas Palsu (*Impersonation*)**: Siapa pun bisa mengirim string `userId` milik orang lain ke server karena tidak ada pembuktian kriptografis tanda tangan digital (*cryptographic signature*).
2. **Kekuasaan Penuh Admin**: Pengelola database/server bisa mengubah saldo cupcake kapan saja sesuka hati tanpa audit publik.
3. **Sensor & Deplatforming**: Server pusat dapat memblokir pengguna tertentu agar tidak bisa mengklaim.
4. **Single Point of Failure**: Jika server hosting tumbang atau diserang, seluruh data saldo dan layanan ikut mati.
:::

Di **Web3**, logika bisnis dan penyimpanan data dipindahkan ke **Smart Contract** di blockchain Arbitrum. Semua interaksi diamankan dengan tanda tangan kriptografi dari wallet pengguna, dan eksekusi kode dijamin tidak dapat diubah (*immutable*) oleh siapa pun.

---

## 🛠️ Fase Persiapan: Remix IDE & MetaMask

Sebelum mulai menulis dan memahami kode Solidity, mari kita siapkan *development environment* kita terlebih dahulu agar siap digunakan saat praktik nanti:

### 1. Persiapan Dompet MetaMask & Jaringan Arbitrum Sepolia
1. **Instalasi**: Pasang ekstensi browser MetaMask dari situs resmi [https://metamask.io](https://metamask.io/).
2. **Buat Dompet**: Buat akun wallet baru. **Catat dan simpan Secret Recovery Phrase (Seed Phrase) Anda di tempat yang aman dan rahasia!**
3. **Tambahkan Jaringan Arbitrum Sepolia**:
   * Buka MetaMask > Klik menu pemilih jaringan di pojok kiri atas > Klik **Add Network** (Tambah Jaringan) > Pilih **Add a network manually** (Tambah jaringan secara manual).
   * Masukkan parameter berikut:
     * **Network Name**: `Arbitrum Sepolia`
     * **New RPC URL**: `https://sepolia-rollup.arbitrum.io/rpc`
     * **Chain ID**: `421614`
     * **Currency Symbol**: `ETH`
     * **Block Explorer URL**: `https://sepolia.arbiscan.io/`
   * Klik **Save** (Simpan) dan beralihlah ke jaringan Arbitrum Sepolia.
4. **Dapatkan Testnet ETH Gratis**:
   * Anda bisa mendapatkan testnet ETH langsung melalui [Alchemy Arbitrum Sepolia Faucet](https://www.alchemy.com/faucets/arbitrum-sepolia) atau [Chainlink Faucets](https://faucets.chain.link/).
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
4. Perhatikan keterangan di bawah opsi Environment: pastikan tertera Chain ID `421614` (Arbitrum Sepolia) atau saldo akun dompet Anda telah terbaca.
5. **Selesai!** Ekosistem coding dan dompet Web3 Anda kini telah saling terhubung dan siap digunakan.

---

## 📘 Fondasi Solidity: Konsep Kunci Sebelum Masuk ke Kontrak

Sebelum kita menyusun smart contract `VendingMachine.sol`, mari kita pelajari 10 konsep inti Solidity berikut secara berurutan. Setiap konsep di bawah ini menyediakan satu file smart contract mandiri (`.sol`) yang dapat langsung Anda salin ke Remix IDE, di-deploy, dan diuji tombolnya secara interaktif untuk melatih memori dan pemahaman Anda:

---

### 1. Tipe Data String & Struktur Dasar Kontrak
**Apa itu**: Setiap smart contract Solidity diawali dengan lisensi open-source (`SPDX-License-Identifier`) dan deklarasi versi compiler (`pragma solidity`). Tipe data `string` digunakan untuk menyimpan teks (UTF-8), seperti nama kontrak atau deskripsi layanan.

Buat file `LearnString.sol`:

```solidity title="LearnString.sol"
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract LearnString {
    // Variabel string untuk menyimpan nama vending machine
    string public machineName;

    // Constructor mengatur nilai awal saat kontrak dideploy
    constructor() {
        machineName = "Arbitrum Cupcake Cafe";
    }

    // Fungsi untuk mengubah nama mesin
    function changeName(string memory _newName) public {
        machineName = _newName;
    }
}
```

**Coba di Remix**:
1. **Deploy** contract `LearnString`.
2. Di panel kiri bawah (*Deployed Contracts*), klik tombol biru **`machineName`** ➡️ Muncul teks `"Arbitrum Cupcake Cafe"`.
3. Masukkan teks `"Super Cupcake Nitro"` pada kolom fungsi **`changeName`** ➡️ Klik tombol oranye **`changeName`**.
4. Klik tombol biru **`machineName`** lagi ➡️ Sekarang nilainya berubah menjadi `"Super Cupcake Nitro"`!

---

### 2. Tipe Data Numerik (uint256) & Boolean (bool)
**Apa itu**: `uint256` adalah tipe data bilangan bulat positif 256-bit (dari `0` hingga `2^256 - 1`), ideal untuk pencatatan kuantitas stok dan saldo. Sedangkan `bool` menyimpan nilai logika biner (`true` atau `false`) untuk menentukan status operasional smart contract. Variabel bertanda `public` otomatis dibuatkan fungsi pembaca (*getter*) gratis oleh compiler.

Buat file `LearnNumber.sol`:

```solidity title="LearnNumber.sol"
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract LearnNumber {
    // Menyimpan jumlah stok cupcake yang ada
    uint256 public cupcakeStock;
    // Status apakah mesin sedang beroperasi
    bool public isOpen;

    constructor() {
        cupcakeStock = 100;
        isOpen = true;
    }

    // Menambah stok cupcake ke dalam mesin
    function addStock(uint256 _amount) public {
        cupcakeStock += _amount;
    }

    // Mengubah saklar buka/tutup mesin
    function toggleOpen() public {
        isOpen = !isOpen;
    }
}
```

**Coba di Remix**:
1. **Deploy** contract `LearnNumber`.
2. Klik tombol biru **`cupcakeStock`** ➡️ Lihat angka `100`.
3. Klik tombol biru **`isOpen`** ➡️ Lihat nilai `true`.
4. Masukkan angka `25` pada kolom **`addStock`** ➡️ Klik tombol oranye **`addStock`**.
5. Klik **`cupcakeStock`** lagi ➡️ Sekarang nilainya menjadi `125`!
6. Klik tombol oranye **`toggleOpen`** ➡️ Klik lagi **`isOpen`** ➡️ Sekarang bernilai `false`!

---

### 3. Visibilitas Fungsi dan Variabel: public dan private
**Apa itu**: Di Solidity, setiap fungsi dan variabel state memiliki tingkat akses (*visibility*):
* **`public`**: Dapat diakses dan dipanggil oleh siapa saja dari luar blockchain (melalui wallet pengguna/dApp) maupun dari dalam kontrak itu sendiri. Compiler otomatis membuat tombol pembaca gratis di Remix untuk variabel `public`.
* **`private`**: Hanya dapat dibaca dan dieksekusi oleh fungsi di dalam smart contract tersebut. Pihak luar (wallet atau kontrak lain) tidak dapat memanggilnya secara langsung.

Buat file `LearnVisibility.sol`:

```solidity title="LearnVisibility.sol"
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract LearnVisibility {
    // Variabel public: Otomatis memunculkan tombol baca di Remix
    string public publicMessage = "Pesan ini bisa dibaca publik";

    // Variabel private: Disembunyikan dari tombol luar di Remix
    string private secretRecipe = "Resep Rahasia: 100gr cokelat premium";

    // 1. Fungsi public: Bisa dipanggil langsung oleh wallet / dApp luar
    function revealRecipe() public view returns (string memory) {
        // Memanggil fungsi private pembantu dari dalam kontrak
        return getSecretHelper();
    }

    // 2. Fungsi private: HANYA BISA dipanggil oleh fungsi internal kontrak
    function getSecretHelper() private view returns (string memory) {
        return secretRecipe;
    }
}
```

**Coba di Remix**:
1. **Deploy** contract `LearnVisibility`.
2. Perhatikan tombol yang muncul di panel *Deployed Contracts*:
   * Tombol biru **`publicMessage`** dan **`revealRecipe`** muncul karena berstatus **`public`**.
   * Variabel `secretRecipe` dan fungsi `getSecretHelper` **TIDAK muncul** sebagai tombol di Remix karena berstatus **`private`**!
3. Klik tombol biru **`publicMessage`** ➡️ Muncul teks `"Pesan ini bisa dibaca publik"`.
4. Klik tombol biru **`revealRecipe`** ➡️ Muncul teks `"Resep Rahasia: 100gr cokelat premium"`. Ini membuktikan kode di dalam kontrak dapat membaca variabel `private`, sedangkan wallet luar tidak bisa membacanya tanpa perantara fungsi `public`!

---

### 4. State Mutability (view & pure) serta Nilai Balik Fungsi
**Apa itu**: Di Solidity, fungsi yang hanya membaca data dari storage tanpa mengubah state ditandai dengan kata kunci **`view`**. Pemanggilan fungsi `view` dari luar blockchain bersifat **100% bebas biaya gas (*gas-free*)** dan tidak memerlukan konfirmasi transaksi dompet. Sebaliknya, fungsi yang memodifikasi state storage memerlukan transaksi dan gas fee. Fungsi **`pure`** melakukan kalkulasi tanpa membaca maupun menulis storage blockchain.

Buat file `LearnFunctions.sol`:

```solidity title="LearnFunctions.sol"
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract LearnFunctions {
    uint256 private secretStock = 100;
    uint256 public totalClaims = 0;

    // 1. Fungsi Pengubah State: Mengubah data di blockchain (Butuh Gas / Transaksi)
    function takeCupcake() public {
        totalClaims += 1;
        secretStock -= 1;
    }

    // 2. Fungsi 'view': HANYA MEMBACA data (100% GRATIS, Tanpa Gas Fee)
    function checkStock() public view returns (uint256) {
        return secretStock;
    }

    // 3. Fungsi 'pure': Komputasi logika matematika tanpa membaca storage
    function calculateDouble(uint256 _number) public pure returns (uint256) {
        return _number * 2;
    }
}
```

**Coba di Remix**:
1. **Deploy** contract `LearnFunctions`.
2. Perhatikan perbedaan warna tombol di panel Deployed Contracts:
   * **Tombol Biru** (`checkStock`, `calculateDouble`, `totalClaims`): Fungsi `view`/`pure` ➡️ Klik secara instan dan bebas biaya gas kapan pun!
   * **Tombol Oranye** (`takeCupcake`): Fungsi pengubah state ➡️ Menghasilkan transaksi blockchain.
3. Klik tombol biru **`checkStock`** ➡️ Muncul angka `100`.
4. Masukkan angka `8` pada **`calculateDouble`** ➡️ Klik tombol biru ➡️ Menghasilkan nilai `16`.
5. Klik tombol oranye **`takeCupcake`** ➡️ Klik lagi tombol biru **`checkStock`** ➡️ Sekarang berkurang menjadi `99`!

---

### 5. Struktur Data Mapping (Key-Value Storage)
**Apa itu**: `mapping(keyType => valueType)` adalah struktur data tabel hash pada storage blockchain yang memetakan kunci unik (seperti alamat dompet `address`) ke suatu nilai (seperti saldo `uint256`). Kunci yang belum pernah diinisialisasi otomatis mengembalikan nilai default (`0` untuk numerik). Perhatikan penggunaan kata kunci `view` dan `returns` pada fungsi pembaca saldonya!

Buat file `LearnMapping.sol`:

```solidity title="LearnMapping.sol"
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract LearnMapping {
    // Memetakan alamat dompet pengguna ke jumlah saldo cupcake miliknya
    mapping(address => uint256) public cupcakeBalances;

    // Mengatur saldo cupcake untuk alamat tertentu
    function setBalance(address _user, uint256 _amount) public {
        cupcakeBalances[_user] = _amount;
    }

    // Fungsi untuk membaca saldo milik alamat tertentu (Gratis via 'view')
    function getBalance(address _user) public view returns (uint256) {
        return cupcakeBalances[_user];
    }
}
```

**Coba di Remix**:
1. **Deploy** contract `LearnMapping`.
2. Salin alamat akun aktif Anda dari panel Remix (dropdown **ACCOUNT** paling atas).
3. Masukkan alamat Anda ke kolom **`getBalance`** ➡️ Klik tombol biru ➡️ Nilai masih `0`.
4. Pada kolom **`setBalance`**, masukkan alamat Anda dan jumlah `5` (contoh: `0x5B38..., 5`) ➡️ Klik tombol oranye **`setBalance`**.
5. Klik lagi tombol **`getBalance`** dengan alamat Anda ➡️ Sekarang nilainya menjadi `5`!

---

### 6. Global Variable msg.sender (Autentikasi Pemanggil)
**Apa itu**: `msg.sender` adalah variabel global bawaan EVM yang merepresentasikan alamat dompet (*address*) penandatangan transaksi saat ini. Fitur ini menjamin autentikasi kriptografis tanpa memerlukan input identitas manual atau kata sandi, mencegah manipulasi maupun pemalsuan identitas (*impersonation*).

Buat file `LearnMsgSender.sol`:

```solidity title="LearnMsgSender.sol"
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract LearnMsgSender {
    // Mencatat siapa yang terakhir kali memanggil fungsi ini
    address public lastCaller;

    // Memetakan alamat penandatangan ke poin reward miliknya
    mapping(address => uint256) public myPoints;

    function claimReward() public {
        // Alamat diambil OTOMATIS dari wallet penandatangan transaksi
        address caller = msg.sender;

        lastCaller = caller;
        myPoints[caller] += 10;
    }
}
```

**Coba di Remix**:
1. **Deploy** contract `LearnMsgSender`.
2. Klik tombol biru **`lastCaller`** ➡️ Masih beralamat kosong `0x0000...0000`.
3. Klik tombol oranye **`claimReward`** (perhatikan: Anda TIDAK perlu mengetikkan alamat dompet sama sekali!).
4. Klik tombol biru **`lastCaller`** ➡️ Sekarang otomatis terisi alamat dompet Anda!
5. Masukkan alamat dompet Anda ke kolom **`myPoints`** ➡️ Klik tombol biru ➡️ Lihat nilai `10`.
6. Klik lagi tombol **`claimReward`** ➡️ Cek lagi **`myPoints`** ➡️ Sekarang menjadi `20`!

---

### 7. Global Variable block.timestamp & Time Units
**Apa itu**: `block.timestamp` adalah variabel global yang menyimpan catatan waktu blok saat ini dalam format detik Unix Epoch (waktu sejak 1 Januari 1970). Solidity menyediakan literal satuan waktu bawaan seperti `seconds`, `minutes`, `hours`, dan `days` yang berguna untuk membangun mekanisme jeda waktu (*cooldown period*).

Buat file `LearnTimestamp.sol`:

```solidity title="LearnTimestamp.sol"
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract LearnTimestamp {
    uint256 public lastClaimTime;
    // Jeda waktu cooldown selama 10 detik
    uint256 public constant COOLDOWN = 10 seconds;

    // Mencatat waktu saat transaksi diproses
    function triggerClaim() public {
        lastClaimTime = block.timestamp;
    }

    // Mengecek apakah sudah lewat 10 detik dari klaim terakhir
    function canClaimAgain() public view returns (bool) {
        return block.timestamp >= lastClaimTime + COOLDOWN;
    }
}
```

**Coba di Remix**:
1. **Deploy** contract `LearnTimestamp`.
2. Klik tombol oranye **`triggerClaim`** ➡️ Klik tombol biru **`lastClaimTime`** ➡️ Lihat angka waktu Unix saat ini (misal `1726354890`).
3. Langsung klik tombol biru **`canClaimAgain`** ➡️ Hasilnya `false` (karena belum 10 detik berlalu).
4. Tunggu selama 10 detik...
5. Klik lagi tombol biru **`canClaimAgain`** ➡️ Sekarang hasilnya berubah menjadi `true`!

---

### 8. Validasi Kondisi & Error Handling: require()
**Apa itu**: Fungsi `require(kondisi, "Pesan error")` memvalidasi prasyarat (*preconditions*) sebelum baris kode berikutnya dieksekusi. Jika `kondisi` bernilai `false`, transaksi seketika digagalkan (*revert*), seluruh perubahan state dibatalkan, dan sisa gas fee dikembalikan ke pemanggil.

Buat file `LearnRequire.sol`:

```solidity title="LearnRequire.sol"
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract LearnRequire {
    uint256 public cupcakeStock = 5;

    function getCupcake(uint256 _amount) public {
        // Syarat 1: Jumlah permintaan harus minimal 1
        require(_amount > 0, "Jumlah harus minimal 1!");

        // Syarat 2: Stok harus mencukupi
        require(cupcakeStock >= _amount, "Stok cupcake tidak cukup!");

        // Baris ini HANYA dieksekusi jika kedua require di atas lolos:
        cupcakeStock -= _amount;
    }
}
```

**Coba di Remix**:
1. **Deploy** contract `LearnRequire`.
2. Klik **`cupcakeStock`** ➡️ Nilai awal adalah `5`.
3. Masukkan angka `2` pada kolom **`getCupcake`** ➡️ Klik tombol oranye ➡️ Transaksi sukses! Klik **`cupcakeStock`** ➡️ Sekarang menjadi `3`.
4. Masukkan angka `10` pada kolom **`getCupcake`** ➡️ Klik tombol oranye.
5. Transaksi **gagal (*revert*)**! Di konsol log bawah Remix muncul pesan error merah: `"Stok cupcake tidak cukup!"`. Klik **`cupcakeStock`** ➡️ Stok tetap aman di angka `3`!

---

### 9. Event Logging & Emit: Komunikasi State ke Frontend
**Apa itu**: Smart contract tidak dapat melakukan panggilan jaringan (*network calls*) langsung ke client. Untuk mengabarkan perubahan data ke antarmuka aplikasi dApp, kontrak mendefinisikan **`event`** dan memancarkannya dengan **`emit`**. Event disimpan dalam log transaksi blockchain yang efisien gas dan dapat dipantau (*listen*) secara real-time oleh frontend.

Buat file `LearnEvent.sol`:

```solidity title="LearnEvent.sol"
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract LearnEvent {
    // Deklarasi format event (kata kunci 'indexed' memudahkan dApp memfilter data per wallet)
    event CupcakeGiven(address indexed recipient, uint256 newTotal);

    mapping(address => uint256) public balances;

    function claimCupcake() public {
        balances[msg.sender] += 1;

        // Pancarkan sinyal event ke blockchain
        emit CupcakeGiven(msg.sender, balances[msg.sender]);
    }
}
```

**Coba di Remix**:
1. **Deploy** contract `LearnEvent`.
2. Klik tombol oranye **`claimCupcake`**.
3. Perhatikan konsol log Remix di bagian bawah layar, klik tanda centang hijau transaksi untuk membuka rincian (*details*).
4. Cari bagian **`logs`** ➡️ Anda akan melihat data event `CupcakeGiven` yang memuat alamat dompet Anda dan saldo terbarunya! Inilah data yang didengarkan oleh dApp frontend secara real-time.

---

### 10. Constructor & Kontrol Hak Akses (Owner)
**Apa itu**: `constructor(...)` adalah fungsi inisialisasi yang hanya dieksekusi satu kali saat smart contract pertama kali dideploy ke jaringan. Pola ini umum digunakan untuk menetapkan deployer sebagai pemilik administratif (`owner = msg.sender`) yang memegang hak akses eksklusif atas fungsi-fungsi krusial dengan memvalidasinya via `require(msg.sender == owner)`.

Buat file `LearnOwner.sol`:

```solidity title="LearnOwner.sol"
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract LearnOwner {
    address public owner;
    uint256 public stock;

    // Menerima nilai awal saat proses deployment berlangsung
    constructor(uint256 _initialStock) {
        owner = msg.sender; // Wallet yang mendeploy otomatis menjadi owner
        stock = _initialStock;
    }

    // Fungsi ini dikunci: Hanya boleh dipanggil oleh owner!
    function refillStock(uint256 _add) public {
        require(msg.sender == owner, "Akses ditolak: Anda bukan owner!");
        stock += _add;
    }
}
```

**Coba di Remix**:
1. Pada kolom input di samping tombol oranye **Deploy**, masukkan angka `50` ➡️ Klik **Deploy**.
2. Klik tombol biru **`stock`** ➡️ Muncul `50`. Klik **`owner`** ➡️ Muncul alamat dompet Anda.
3. Masukkan angka `20` pada kolom **`refillStock`** ➡️ Klik tombol oranye ➡️ Transaksi sukses! Klik **`stock`** ➡️ Sekarang menjadi `70`!
4. *(Uji Proteksi)*: Di panel atas Remix (dropdown **ACCOUNT**), pilih akun dompet kedua (akun lain yang bukan deployer).
5. Masukkan angka `10` pada kolom **`refillStock`** ➡️ Klik tombol oranye.
6. Transaksi seketika **gagal (*revert*)** dengan pesan error: `"Akses ditolak: Anda bukan owner!"`.

---

## 🏆 Tantangan Proyek Utama: Membangun `VendingMachine.sol`

Sekarang Anda telah memahami seluruh 10 konsep dasar Solidity: mulai dari tipe data, visibilitas, fungsi, `mapping`, `msg.sender`, `require()`, `event` & `emit`, hingga `constructor` dan proteksi hak akses `owner`. Saatnya kita langsung mempraktikkan seluruh ilmu ini dengan membangun proyek nyata: **Smart Contract Cupcake Vending Machine**!

Kontrak ini menggabungkan seluruh komponen yang telah kita pelajari:
* Autentikasi wallet aman tanpa input manual melalui **`msg.sender`**.
* Validasi batas waktu (cooldown) dan stok menggunakan **`require()`**.
* Sistem pencatatan log untuk frontend dApp menggunakan **`event` & `emit`**.
* Hak istimewa pengisian ulang stok khusus pemilik melalui **`constructor` & `owner`**.

### Kode Lengkap Smart Contract:

```solidity title="VendingMachine.sol"
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title Cupcake Vending Machine
 * @notice Mesin penjual otomatis cupcake digital dengan cooldown klaim dan kontrol stok berbasis owner.
 */
contract VendingMachine {
    // ==========================================
    // 1. STATE VARIABLES
    // ==========================================

    // Alamat dompet admin/pemilik yang berhak mengisi ulang stok
    address public owner;

    // Total cupcake yang tersedia di dalam mesin
    uint256 public cupcakeStock;

    // Saldo cupcake milik masing-masing alamat pengguna
    mapping(address => uint256) public cupcakeBalances;

    // Waktu blok terakhir (timestamp) saat pengguna mengklaim cupcake
    mapping(address => uint256) public lastClaimTime;

    // Durasi cooldown antar klaim (5 detik)
    uint256 public constant COOLDOWN_TIME = 5 seconds;

    // ==========================================
    // 2. EVENTS (Logging untuk dApp / Frontend)
    // ==========================================

    // Dipancarkan setiap kali ada pengguna yang berhasil mengklaim cupcake
    event CupcakeDistributed(
        address indexed recipient,
        uint256 newBalance,
        uint256 remainingStock,
        uint256 timestamp
    );

    // Dipancarkan saat owner mengisi ulang stok cupcake
    event CupcakesRefilled(
        address indexed owner,
        uint256 amountAdded,
        uint256 totalStock,
        uint256 timestamp
    );

    // ==========================================
    // 3. CONSTRUCTOR
    // ==========================================

    /**
     * @dev Dijalankan satu kali saat contract dideploy.
     * @param _initialStock Jumlah stok awal cupcake yang dimasukkan ke mesin.
     */
    constructor(uint256 _initialStock) {
        owner = msg.sender; // Orang yang mendiskusikan transaksi deploy adalah owner
        cupcakeStock = _initialStock;

        emit CupcakesRefilled(msg.sender, _initialStock, _initialStock, block.timestamp);
    }

    // ==========================================
    // 4. CORE FUNCTIONS (Fungsi Utama)
    // ==========================================

    /**
     * @notice Mengklaim 1 cupcake gratis untuk pemanggil (msg.sender).
     * @dev Identitas tidak diinput manual, melainkan otomatis dari wallet msg.sender.
     */
    function giveCupcake() public returns (bool) {
        // Validasi 1: Pastikan stok mesin masih ada
        require(cupcakeStock > 0, "Cupcake habis! Silakan tunggu owner mengisi ulang.");

        // Validasi 2: Pastikan pengguna sudah melewati masa cooldown 5 detik
        require(
            block.timestamp >= lastClaimTime[msg.sender] + COOLDOWN_TIME,
            "HTTP 429: Terlalu cepat! Anda harus menunggu minimal 5 detik antar cupcake."
        );

        // Update State: Kurangi stok dan tambahkan ke saldo pengguna
        cupcakeStock -= 1;
        cupcakeBalances[msg.sender] += 1;
        lastClaimTime[msg.sender] = block.timestamp;

        // Pancarkan event agar frontend langsung tahu
        emit CupcakeDistributed(
            msg.sender,
            cupcakeBalances[msg.sender],
            cupcakeStock,
            block.timestamp
        );

        return true;
    }

    /**
     * @notice Mengisi ulang stok cupcake (Hanya dapat dipanggil oleh owner).
     * @param _amount Jumlah cupcake yang ingin ditambahkan ke stok mesin.
     */
    function refillCupcakes(uint256 _amount) public {
        // Validasi Akses: Hanya owner yang boleh memanggil
        require(msg.sender == owner, "Akses ditolak: Hanya owner yang boleh mengisi ulang stok!");
        
        // Validasi Input: Jumlah harus lebih besar dari 0
        require(_amount > 0, "Jumlah isi ulang harus lebih dari 0!");

        cupcakeStock += _amount;

        emit CupcakesRefilled(msg.sender, _amount, cupcakeStock, block.timestamp);
    }

    // ==========================================
    // 5. VIEW FUNCTIONS (Pembacaan Data Gratis)
    // ==========================================

    /**
     * @notice Mengecek saldo cupcake milik pemanggil (msg.sender).
     */
    function getMyCupcakeBalance() public view returns (uint256) {
        return cupcakeBalances[msg.sender];
    }

    /**
     * @notice Mengecek saldo cupcake milik alamat pengguna tertentu.
     */
    function getCupcakeBalanceFor(address _user) public view returns (uint256) {
        return cupcakeBalances[_user];
    }

    /**
     * @notice Mengecek apakah pengguna tertentu saat ini sudah siap mengklaim cupcake lagi.
     */
    function canClaim(address _user) public view returns (bool) {
        if (cupcakeStock == 0) return false;
        return block.timestamp >= lastClaimTime[_user] + COOLDOWN_TIME;
    }
}
```

---

### 🧪 Praktik Langsung: Kompilasi, Deploy & Uji di Arbitrum Sepolia

Setelah menulis smart contract `VendingMachine.sol`, ikuti langkah-langkah praktik langsung berikut di Remix IDE:

#### 1. Kompilasi Kontrak
1. Di panel bilah kiri Remix, buka tab **Solidity compiler** (ikon kedua).
2. Pastikan compiler version sesuai (misal: `0.8.20`).
3. Klik tombol biru **Compile VendingMachine.sol** hingga muncul tanda centang hijau.

![Kompilasi Smart Contract di Remix](https://docs.arbitrum.io/img/apps-remix-compile-contract-2025-01-07.gif)

#### 2. Deploy ke Arbitrum Sepolia
1. Pastikan ekstensi MetaMask Anda aktif di jaringan **Arbitrum Sepolia** (Chain ID: `421614`).
2. Buka tab **Deploy & Run Transactions** (ikon ketiga di bilah navigasi kiri Remix).
3. Pada dropdown **ENVIRONMENT**, pilih **Injected Provider - MetaMask**.
4. Pada kolom input di samping tombol oranye **Deploy**, masukkan stok awal cupcake untuk constructor `_initialStock` (misal: `50`).
5. Klik **Deploy** dan setujui transaksi di jendela konfirmasi MetaMask (gas fee dipotong dari saldo Arbitrum Sepolia ETH Anda).

![Deploy Contract di Remix](https://docs.arbitrum.io/img/apps-remix-deploy-to-local-chain-2025-01-14.gif)

#### 3. Uji Fungsionalitas Interaktif
Setelah transaksi berhasil dikonfirmasi, kontrak Anda akan muncul di bagian bawah panel kiri pada menu **Deployed Contracts**. Buka menu dropdown kontrak tersebut untuk menguji fungsi-fungsinya:

1. **Uji Klaim Cupcake (`giveCupcake`)**:
   * Klik tombol oranye `giveCupcake` ➡️ Konfirmasi transaksi di MetaMask.
   * Klik tombol biru `getMyCupcakeBalance` ➡️ Nilai saldo Anda menjadi `1`.
   * Klik tombol biru `cupcakeStock` ➡️ Nilai berkurang dari `50` menjadi `49`.
2. **Uji Validasi Cooldown (`require`)**:
   * Segera klik tombol oranye `giveCupcake` sekali lagi sebelum 5 detik berlalu.
   * Transaksi seketika **gagal (*revert*)** dengan pesan error: `"HTTP 429: Terlalu cepat! Anda harus menunggu minimal 5 detik antar cupcake."`. Ini membuktikan proteksi `require()` dan `block.timestamp` berjalan sempurna!
3. **Uji Hak Akses Owner (`refillCupcakes`)**:
   * Buka MetaMask, ganti akun aktif ke akun sekunder (bukan wallet yang men-deploy kontrak).
   * Masukkan angka `20` pada kolom fungsi `refillCupcakes`, lalu klik tombol.
   * Transaksi akan **gagal** dengan pesan error: `"Akses ditolak: Hanya owner yang boleh mengisi ulang stok!"`.
   * Kembalikan akun MetaMask ke akun deployer (owner), lalu klik lagi `refillCupcakes` ➡️ Transaksi sukses dan stok cupcake bertambah!

#### 4. Verifikasi di Block Explorer (Arbiscan)
1. Salin alamat kontrak (*contract address*) dari panel Remix (klik ikon copy di samping nama kontrak).
2. Kunjungi **[Arbiscan Sepolia](https://sepolia.arbiscan.io/)**.
3. Tempelkan alamat contract Anda pada kolom pencarian.
4. Anda dapat melihat riwayat deployment, setiap transaksi `giveCupcake` yang terjadi, serta log `CupcakeDistributed` yang dipancarkan secara real-time!

---

## 🏛️ Membedah Arsitektur: Apa yang Sebenarnya Terjadi?

![Diagram Arsitektur Web2 vs Web3](https://docs.arbitrum.io/img/apps-quickstart-vending-machine-architecture.png)

| Aspek | Web2 | Web3 (Localhost / Anvil) | Web3 (Arbitrum Sepolia Testnet) | Web3 (Arbitrum One Mainnet) |
| :--- | :--- | :--- | :--- | :--- |
| **Penyimpanan Data** | Database MySQL / Postgres di server cloud. | Di memori komputer lokal via emulasi node Anvil. | Di ribuan node publik Ethereum & Arbitrum Sepolia. | Di jaringan produksi global Arbitrum One secara permanen. |
| **Autentikasi** | Cookie / JWT token berbasis password. | Kriptografi tanda tangan wallet (`msg.sender`). | Kriptografi tanda tangan wallet (`msg.sender`). | Kriptografi tanda tangan wallet (`msg.sender`). |
| **Eksekusi Logika** | Backend Node.js/Python di server pusat. | Smart Contract di EVM lokal Anvil. | Smart contract di Arbitrum Nitro testnet node. | Smart contract di Arbitrum One sequencer & validators. |
| **Notifikasi dApp** | Polling HTTP atau WebSocket tersentralisasi. | Log Event EVM lokal. | **Log Event Blockchain (`emit`)** yang ditangkap frontend dApp. | Log Event terverifikasi publik secara real-time. |
| **Biaya Transaksi** | Pengembang membayar sewa cloud bulanan (fiat). | Gratis (simulasi saldo dummy di Anvil). | Menggunakan **Sepolia ETH Testnet** gratis. | Menggunakan **ETH Mainnet** (namun ~90% lebih murah dari Ethereum L1). |

---

## 🏁 Menuju Jaringan Produksi (*Production Mainnet*)

Proses deployment ke **Arbitrum One Mainnet** sama persis dengan ke testnet:
1. Ubah jaringan di MetaMask ke **Arbitrum One** (`Chain ID: 42161`).
2. Gunakan ETH Mainnet untuk biaya gas.

Berkat teknologi *Optimistic Rollup*, transaksi di Arbitrum dieksekusi dalam hitungan sub-detik (~0.25 detik) dengan efisiensi biaya luar biasa tanpa mengorbankan keamanan terdesentralisasi Ethereum. Untuk estimasi biaya transaksi lebih mendalam, simak [Panduan Estimasi Gas Arbitrum](https://docs.arbitrum.io/arbitrum-essentials/how-to-estimate-gas).

---

## 📝 Ringkasan

Selamat! Anda telah mempelajari siklus hidup penuh pengembangan smart contract Web3 modern:
* Mengganti paradigma autentikasi manual dengan **`msg.sender`**.
* Menerapkan validasi keamanan deterministik menggunakan **`require()`**.
* Membangun jalur komunikasi antara blockchain dan frontend dApp dengan **`event` & `emit`**.
* Mengamankan hak istimewa administrator menggunakan **`constructor` & `owner`**.
* Menguji secara lokal dengan **Anvil** dan men-deploy ke jaringan nyata **Arbitrum Sepolia**.

---

## 📚 Sumber Belajar Lanjutan

* **[Arbitrum Docs - Quickstart Solidity Remix](https://docs.arbitrum.io/build-decentralized-apps/quickstart-solidity-remix)**: Sumber dokumentasi asli panduan quickstart dApp Arbitrum.
* **[Stylus Quickstart](https://docs.arbitrum.io/stylus/quickstart)**: Panduan resmi menulis smart contract berkinerja tinggi menggunakan bahasa pemrograman **Rust** di Arbitrum.
* **[Arbitrum Solidity References](https://docs.arbitrum.io/arbitrum-essentials/reference/solidity-references)**: Referensi fungsi dan integrasi EVM Arbitrum.
* **[Dokumentasi Resmi Arbitrum](https://docs.arbitrum.io/)**: Panduan arsitektur Nitro, Rollups, Orbit, dan Stylus.
* **[Komunitas Discord Arbitrum](https://discord.gg/arbitrum)**: Tempat berdiskusi dan berbagi pengalaman bersama builder global lainnya.

---

## 📌 Catatan Kaki (*Footnotes*)

[^1]: Konsep analogi mesin penjual otomatis pertama kali dipopulerkan oleh pionir kriptografi Nick Szabo pada esai klasiknya tahun 1996: *"From vending machines to smart contracts"*, yang kemudian diadopsi luas dalam literatur pengenalan Ethereum.
[^2]: Smart contract dieksekusi secara otonom oleh jaringan node. Arbitrum mengelompokkan ribuan transaksi ke dalam satu batch lalu memvalidasikannya ke rantai utama Ethereum, memangkas biaya gas secara signifikan sambil tetap mewarisi desentralisasi L1.
[^3]: Pada jaringan PoS (Proof of Stake), validator bertanggung jawab mengusulkan dan memvalidasi blok baru untuk memperoleh imbalan ETH.
[^4]: Kode smart contract yang telah dideploy ke EVM bersifat permanen dan tidak dapat diubah oleh pihak mana pun di luar aturan upgradeability yang telah didefinisikan secara transparan di awal.