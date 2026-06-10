export interface CreditCardApplication {
  id: number;
  nama: string;
  nik: string;
  email: string;
  nomorHp: string;
  jenisKartu: string;
  pendapatanBulanan: number;
  tanggalPengajuan: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  catatan: string;
  tandaTangan: string; // Base64 signature image
}

export interface SqlLog {
  timestamp: string;
  query: string;
  params?: string;
  rowsAffected: number;
}

// In-Memory Simulation of MySQL Database
class SimulatedMySqlDb {
  private applications: CreditCardApplication[] = [];
  private sqlLogs: SqlLog[] = [];
  private nextId = 1;

  constructor() {
    // Initial DDL Log
    this.logSql(
      `CREATE TABLE IF NOT EXISTS applications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nama VARCHAR(100) NOT NULL,
  nik VARCHAR(16) NOT NULL UNIQUE,
  email VARCHAR(100) NOT NULL,
  nomor_hp VARCHAR(20) NOT NULL,
  jenis_kartu VARCHAR(50) NOT NULL,
  pendapatan_bulanan DECIMAL(15, 2) NOT NULL,
  tanggal_pengajuan TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  status ENUM('PENDING', 'APPROVED', 'REJECTED') DEFAULT 'PENDING',
  catatan TEXT,
  tanda_tangan LONGTEXT
);`,
      1,
      '[]'
    );

    // Seed data
    this.seedInitialData();
  }

  private logSql(query: string, rowsAffected: number, params?: any) {
    this.sqlLogs.unshift({
      timestamp: new Date().toISOString(),
      query: query.trim(),
      params: params ? JSON.stringify(params) : undefined,
      rowsAffected
    });
    console.log(`[MySQL Sandbox Log] Query Executed: \n${query.trim()}`);
  }

  private seedInitialData() {
    this.createApplication({
      nama: 'Budi Santoso',
      nik: '3171012345670001',
      email: 'budi.santoso@email.com',
      nomorHp: '081234567890',
      jenisKartu: 'Visa Gold Card',
      pendapatanBulanan: 8500000,
      tandaTangan: '',
      status: 'APPROVED',
      catatan: 'Pendapatan Rp8.500.000 memenuhi batas minimum Visa Gold Card (Rp5.000.000). Otomatis disetujui secara real-time.'
    });

    this.createApplication({
      nama: 'Siti Rahmawati',
      nik: '3273023456780002',
      email: 'siti.rahma@email.com',
      nomorHp: '081987654321',
      jenisKartu: 'Mastercard Platinum Card',
      pendapatanBulanan: 22000000,
      tandaTangan: '',
      status: 'APPROVED',
      catatan: 'Pendapatan Rp22.000.000 memenuhi batas minimum Mastercard Platinum (Rp15.000.000). Otomatis disetujui secara real-time.'
    });
  }

  public getApplications(): CreditCardApplication[] {
    const query = `SELECT id, nama, nik, email, nomor_hp, jenis_kartu, pendapatan_bulanan, tanggal_pengajuan, status, catatan, tanda_tangan FROM applications ORDER BY tanggal_pengajuan DESC;`;
    this.logSql(query, this.applications.length);
    return [...this.applications].sort((a, b) => b.id - a.id);
  }

  public createApplication(appData: Omit<CreditCardApplication, 'id' | 'tanggalPengajuan' | 'status' | 'catatan'> & { status?: 'PENDING' | 'APPROVED' | 'REJECTED', catatan?: string }): CreditCardApplication {
    const id = this.nextId++;
    const tanggalPengajuan = new Date().toISOString();
    
    // Auto decision rules based on Income and Type of Card
    // Visa Gold Card: Min 5,000,000
    // Mastercard Platinum Card: Min 15,000,000
    // Visa Signature Card: Min 30,000,000
    // World Elite Card: Min 100,000,000
    
    let status: 'PENDING' | 'APPROVED' | 'REJECTED' = appData.status || 'PENDING';
    let catatan = appData.catatan || '';

    if (!appData.status) {
      const gaj = appData.pendapatanBulanan;
      const kartu = appData.jenisKartu.toLowerCase();
      
      if (kartu.includes('world elite')) {
        if (gaj >= 100000000) {
          status = 'APPROVED';
          catatan = `Pendapatan Rp${gaj.toLocaleString('id-ID')} memenuhi batas minimum World Elite Card (Rp100.000.000). Pengajuan otomatis disetujui secara real-time dalam event.`;
        } else {
          status = 'REJECTED';
          catatan = `Maaf, pendapatan Rp${gaj.toLocaleString('id-ID')} di bawah batas minimum World Elite Card (Rp100.000.000). Direkomendasikan jenis kartu lainnya.`;
        }
      } else if (kartu.includes('signature')) {
        if (gaj >= 30000000) {
          status = 'APPROVED';
          catatan = `Pendapatan Rp${gaj.toLocaleString('id-ID')} memenuhi batas minimum Visa Signature Card (Rp30.000.000). Pengajuan otomatis disetujui secara real-time dalam event.`;
        } else {
          status = 'REJECTED';
          catatan = `Maaf, pendapatan Rp${gaj.toLocaleString('id-ID')} di bawah batas minimum Visa Signature Card (Rp30.000.000).`;
        }
      } else if (kartu.includes('platinum')) {
        if (gaj >= 15000000) {
          status = 'APPROVED';
          catatan = `Pendapatan Rp${gaj.toLocaleString('id-ID')} memenuhi batas minimum Mastercard Platinum Card (Rp15.000.000). Pengajuan otomatis disetujui secara real-time.`;
        } else {
          status = 'REJECTED';
          catatan = `Maaf, pendapatan Rp${gaj.toLocaleString('id-ID')} di bawah batas minimum Mastercard Platinum Card (Rp15.000.000).`;
        }
      } else if (kartu.includes('gold')) {
        if (gaj >= 5000000) {
          status = 'APPROVED';
          catatan = `Pendapatan Rp${gaj.toLocaleString('id-ID')} memenuhi batas minimum Visa Gold Card (Rp5.000.000). Pengajuan otomatis disetujui secara real-time.`;
        } else {
          status = 'REJECTED';
          catatan = `Maaf, pendapatan Rp${gaj.toLocaleString('id-ID')} di bawah batas minimum Visa Gold Card (Rp5.000.000).`;
        }
      } else {
        // Fallback
        if (gaj >= 3000000) {
          status = 'APPROVED';
          catatan = 'Pengajuan disetujui secara instan berdasarkan kriteria pendapatan regional.';
        } else {
          status = 'PENDING';
          catatan = 'Dibutuhkan dokumen tambahan untuk peninjauan lebih lanjut oleh bagian analis bank.';
        }
      }
    }

    const newApp: CreditCardApplication = {
      id,
      nama: appData.nama,
      nik: appData.nik,
      email: appData.email,
      nomorHp: appData.nomorHp,
      jenisKartu: appData.jenisKartu,
      pendapatanBulanan: appData.pendapatanBulanan,
      tanggalPengajuan,
      status,
      catatan,
      tandaTangan: appData.tandaTangan
    };

    // Check duplicate NIK
    const exists = this.applications.some(a => a.nik === appData.nik);
    if (exists && !appData.status) {
      throw new Error(`Nasabah dengan NIK ${appData.nik} sudah melakukan pengajuan kartu kredit.`);
    }

    this.applications.push(newApp);

    const query = `INSERT INTO applications (nama, nik, email, nomor_hp, jenis_kartu, pendapatan_bulanan, status, catatan, tanda_tangan) 
VALUES ('${appData.nama}', '${appData.nik}', '${appData.email}', '${appData.nomorHp}', '${appData.jenisKartu}', ${appData.pendapatanBulanan}, '${status}', '${catatan.replace(/'/g, "''")}', '[LONGTEXT_SIGNATURE]');`;
    this.logSql(query, 1, appData);

    return newApp;
  }

  public deleteApplication(id: number): boolean {
    const initialLength = this.applications.length;
    this.applications = this.applications.filter(app => app.id !== id);
    const affected = initialLength - this.applications.length;
    
    const query = `DELETE FROM applications WHERE id = ${id};`;
    this.logSql(query, affected);
    
    return affected > 0;
  }

  public getSqlLogs(): SqlLog[] {
    return this.sqlLogs;
  }
}

export const dbService = new SimulatedMySqlDb();
