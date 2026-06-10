import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { dbService } from './server/db.ts';
import { GoogleGenAI } from '@google/genai';

const app = express();
const PORT = 3000;

// Enable JSON payload parsing for applications and signatures (Base64)
app.use(express.json({ limit: '10mb' }));

// 1. API: List Applications
app.get('/api/applications', (req, res) => {
  try {
    const apps = dbService.getApplications();
    res.json({ success: true, data: apps });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 2. API: Submit Application
app.post('/api/applications', (req, res) => {
  try {
    const { nama, nik, email, nomorHp, jenisKartu, pendapatanBulanan, tandaTangan } = req.body;

    // Field Validations
    if (!nama || !nik || !email || !nomorHp || !jenisKartu || pendapatanBulanan === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Mohon lengkapi semua data wajib: Nama, NIK, Email, Nomor HP, Jenis Kartu, dan Pendapatan Bulanan.'
      });
    }

    if (nik.length !== 16 || !/^\d+$/.test(nik)) {
      return res.status(400).json({
        success: false,
        message: 'NIK harus berupa angka sepanjang 16 digit.'
      });
    }

    if (!email.includes('@')) {
      return res.status(400).json({
        success: false,
        message: 'Format email tidak valid.'
      });
    }

    const application = dbService.createApplication({
      nama,
      nik,
      email,
      nomorHp,
      jenisKartu,
      pendapatanBulanan: Number(pendapatanBulanan),
      tandaTangan: tandaTangan || ''
    });

    res.json({ success: true, data: application });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// 3. API: Delete Application
app.delete('/api/applications/:id', (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ success: false, message: 'ID pengajuan tidak valid.' });
    }
    const success = dbService.deleteApplication(id);
    if (!success) {
      return res.status(404).json({ success: false, message: 'Data pengajuan tidak ditemukan.' });
    }
    res.json({ success: true, message: 'Data pengajuan berhasil dibatalkan.' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 4. API: Get SQL Logs (Simulated MySQL outputs)
app.get('/api/sql-logs', (req, res) => {
  try {
    const logs = dbService.getSqlLogs();
    res.json({ success: true, data: logs });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 5. API: Gemini AI - Instantly consult and recommend cards or pitch points
app.post('/api/gemini/consult', async (req, res) => {
  const { nama, pendapatanBulanan, jenisKartu, eventTheme } = req.body;
  const incomeFormatted = Number(pendapatanBulanan || 0).toLocaleString('id-ID');

  const systemInstructions = `Anda adalah asisten AI professional perbankan di Indonesia. 
Tujuan Anda adalah membantu Petugas Bank ("petugas") dalam event on-the-spot untuk menawarkan produk kartu kredit terbaik ke calon nasabah bernama ${nama} dengan pendapatan bulanan Rp${incomeFormatted} yang tertarik pada kartu "${jenisKartu}". 
Gunakan nada profesional, persuasif, ramah, dan ringkas dalam bahasa Indonesia.`;

  const prompt = `Analisis kecocokan nasabah ${nama} (Pendapatan: Rp${incomeFormatted}) dengan kartu pilihan: ${jenisKartu}.
Sediakan analisis singkat dalam bentuk:
1. **Status Kelayakan Singkat**: Berikan simpulan kecocokan terhadap batas pendapatan dari kartu tersebut.
2. **Kelebihan utama / Pitch points**: Berikan 3 benefit utama kartu ini yang cocok ditawarkan langsung dalam situasi event on-the-spot agar nasabah tertarik.
3. **Tips Penjualan Tambahan**: Berikan 1 tips berharga bagi petugas untuk meyakinkan nasabah.

Harap kemas respon dalam markdown yang rapi, ringkas, dan mudah dibaca cepat oleh petugas di lapangan menggunakan HP/Tablet mereka.`;

  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === 'MY_GEMINI_API_KEY' || apiKey.trim() === '') {
      throw new Error('API Key missing or default placeholder');
    }

    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        systemInstruction: systemInstructions,
        temperature: 0.7,
      }
    });

    res.json({ success: true, text: response.text });
  } catch (err: any) {
    console.log('[Gemini SDK Fallback Mode Activated]:', err.message);
    
    // Provide an exceptionally robust financial-rules based fallback recommendation if Gemini API is not configured or fails.
    const kartuLower = String(jenisKartu).toLowerCase();
    const gaj = Number(pendapatanBulanan || 0);
    
    let kelayakanStr = '';
    let kelebihan = '';
    let tips = '';

    if (kartuLower.includes('world elite')) {
      kelayakanStr = gaj >= 100000000 
        ? `🔥 Sangat Layak! Pendapatan Rp${incomeFormatted} memenuhi syarat super premium World Elite (Min. Rp100.000.000/bln).` 
        : `⚠️ Kurang Layak (Batas Min. Rp100.000.000/bln). Petugas disarankan mengarahkan nasabah ke Visa Signature.`;
      
      kelebihan = `*   **Akses Global Airport Lounge VIP**: Nikmati ribuan lounge First Class gratis di seluruh dunia dengan Priority Pass.
*   **Multiplier Poin Tercepat**: Penukaran mileage maskapai penerbangan (GarudaMiles, KrisFlyer) premium dengan rate terbaik.
*   **Asuransi Perjalanan Komprehensif**: Proteksi perjalanan laut/udara hingga Rp20 Miliar secara menyeluruh.`;
      tips = 'Tekankan prestise pemilikan kartu World Elite, hadiah sambutan melimpah berupa penerbangan gratis, dan asisten concierge pribadi 24/7.';
    } else if (kartuLower.includes('signature')) {
      kelayakanStr = gaj >= 30000000 
        ? `✅ Sangat Layak! Gaji Rp${incomeFormatted} berada di atas batas minimum Visa Signature (Rp30.000.000/bln).` 
        : `⚠️ Kurang Layak (Batas Min. Rp30.000.000/bln). Coba tawarkan Mastercard Platinum sebagai alternatif handal.`;
      
      kelebihan = `*   **Voucher Lapangan Golf Eksklusif**: Complimentary green fees di 10+ lapangan golf bintang lima ternama Indonesia.
*   **Kurs Valas Spesial**: Nilai tukar transaksi luar negeri yang sangat kompetitif untuk liburan mewah.
*   **Bintang 5 Dining Privilege**: Diskon hingga 50% di berbagai restoran hotel premium terpilih.`;
      tips = 'Nasabah profil ini menghargai kemewahan gaya hidup offline secara berimbang. Tawarkan promo golf gratis dan diskon santap malam hotel berbintang.';
    } else if (kartuLower.includes('platinum')) {
      kelayakanStr = gaj >= 15000000 
        ? `✅ Layak! Gaji Rp${incomeFormatted} melampaui standar minimum Mastercard Platinum (Rp15.000.000/bln).` 
        : `⚠️ Perlu verifikasi. Syarat minimum adalah Rp15.000.000/bln. Jika di bawah itu, Visa Gold (Min. Rp5.000.000/bln) jauh lebih aman.`;

      kelebihan = `*   **Cicilan Event Spesial**: Nikmati tenor cicilan 0% hingga 12 bulan untuk pembelian gawai dan belanja retail di merchant terpilih.
*   **Double Reward Points**: Kumpulkan poin rewards 2 kali lebih cepat di setiap akhir pekan.
*   **Buy 1 Get 1 Cinema**: Nonton bioskop Premiere gratis setiap hari Sabtu di kota-kota besar.`;
      tips = 'Fokus pada fleksibilitas cicilan bunga 0% untuk melunasi gadget terbaru serta kenyamanan promo bioskop akhir pekan bersama keluarga.';
    } else {
      // Gold Card
      kelayakanStr = gaj >= 5000000 
        ? `✅ Sangat Layak! Gaji Rp${incomeFormatted} memenuhi kriteria Visa Gold Card (Min. Rp5.000.000/bln).` 
        : `⚠️ Dibawah standar. Syarat minimum kartu Gold adalah Rp5.000.000/bln. Pengajuan mungkin ditinjau ulang secara manual.`;

      kelebihan = `*   **Cashback Belanja Bulanan**: Diskon langsung 5% di seluruh Supermarket & Hypermarket ritel nasional terkemuka.
*   **Bebas Iuran Tahunan**: Bebas iuran tahun pertama tanpa syarat tersembunyi selama pendaftaran dilakukan on-the-spot di event ini.
*   **Diskon Merchant Kuliner**: Hemat hingga 25% di puluhan gerai makanan dan kafe populer setiap hari.`;
      tips = 'Tawaran "Bebas Iuran Tahunan Pertama" dan promo cashback belanja harian merupakan daya tarik terbesar bagi pemilik kartu Gold.';
    }

    const fallbackResponse = `### 📋 Hasil Konsultasi Instan (Offline Simulator)

**Status Kelayakan:**
${kelayakanStr}

**Benefit Utama Kartu Pilihan (${jenisKartu}):**
${kelebihan}

**💡 Tips Penjualan On-The-Spot Berharga:**
*   *${tips}*
*   *Gunakan momentum event hari ini dengan menawarkan benefit **"Bebas Iuran Tahunan"** dan **"Hadiah Langsung Event (Merchandise Eksklusif)"** setelah berkas lengkap dikirimkan.*`;

    res.json({ success: true, text: fallbackResponse });
  }
});


// 6. Vite or Static Server asset routes
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    // Serve index.html for index or single page routes
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
