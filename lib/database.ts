import Database from 'better-sqlite3';
import path from 'path';

export interface Apartamento {
  id: number;
  numero: string;
  status: 'disponivel' | 'negociacao' | 'vendido';
  cliente_nome?: string;
  cliente_telefone?: string;
  cliente_email?: string;
  consultor_nome?: string;
  created_at: string;
  updated_at: string;
}

class DatabaseManager {
  private db: Database.Database;

  constructor() {
    const dbPath = path.join(process.cwd(), 'data', 'visuplant.db');
    this.db = new Database(dbPath);
    this.init();
  }

  private init() {
    // Criar tabela de apartamentos
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS apartamentos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        numero TEXT UNIQUE NOT NULL,
        status TEXT DEFAULT 'disponivel' CHECK (status IN ('disponivel', 'negociacao', 'vendido')),
        cliente_nome TEXT,
        cliente_telefone TEXT,
        cliente_email TEXT,
        consultor_nome TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Inserir apartamentos iniciais se não existirem
    const count = this.db.prepare('SELECT COUNT(*) as count FROM apartamentos').get() as { count: number };
    
    if (count.count === 0) {
      const insertStmt = this.db.prepare(`
        INSERT INTO apartamentos (numero) VALUES (?)
      `);

      // Lista de apartamentos disponíveis
      const apartamentos = [
        'L01',
        '101', '102', '103', '104', '105', '106', '107', '108', '109',
        '201', '202', '203', '204', '205', '206', '207', '208', '209', '210', '211',
        '301', '302', '303', '304', '305', '306', '307', '308', '309',
        '401', '402'
      ];

      apartamentos.forEach(numero => {
        insertStmt.run(numero);
      });
    }
  }

  getAllApartamentos(): Apartamento[] {
    return this.db.prepare('SELECT * FROM apartamentos ORDER BY numero').all() as Apartamento[];
  }

  getApartamentoByNumero(numero: string): Apartamento | undefined {
    return this.db.prepare('SELECT * FROM apartamentos WHERE numero = ?').get(numero) as Apartamento | undefined;
  }

  updateApartamentoStatus(numero: string, status: 'disponivel' | 'negociacao' | 'vendido', clienteData?: {
    nome?: string;
    telefone?: string;
    email?: string;
    consultor?: string;
  }): boolean {
    const updateStmt = this.db.prepare(`
      UPDATE apartamentos 
      SET status = ?, 
          cliente_nome = ?, 
          cliente_telefone = ?, 
          cliente_email = ?, 
          consultor_nome = ?,
          updated_at = CURRENT_TIMESTAMP
      WHERE numero = ?
    `);

    const result = updateStmt.run(
      status,
      clienteData?.nome || null,
      clienteData?.telefone || null,
      clienteData?.email || null,
      clienteData?.consultor || null,
      numero
    );

    return result.changes > 0;
  }

  reservarApartamento(numero: string): boolean {
    // Verifica se está disponível e muda para negociação
    const stmt = this.db.prepare(`
      UPDATE apartamentos 
      SET status = 'negociacao', updated_at = CURRENT_TIMESTAMP
      WHERE numero = ? AND status = 'disponivel'
    `);
    
    const result = stmt.run(numero);
    return result.changes > 0;
  }

  confirmarVenda(numero: string, clienteData: {
    nome: string;
    telefone: string;
    email: string;
    consultor: string;
  }): boolean {
    // Confirma a venda apenas se estiver em negociação
    const stmt = this.db.prepare(`
      UPDATE apartamentos 
      SET status = 'vendido',
          cliente_nome = ?,
          cliente_telefone = ?,
          cliente_email = ?,
          consultor_nome = ?,
          updated_at = CURRENT_TIMESTAMP
      WHERE numero = ? AND status = 'negociacao'
    `);
    
    const result = stmt.run(
      clienteData.nome,
      clienteData.telefone,
      clienteData.email,
      clienteData.consultor,
      numero
    );
    
    return result.changes > 0;
  }

  liberarApartamento(numero: string): boolean {
    // Libera apartamento em negociação de volta para disponível
    const stmt = this.db.prepare(`
      UPDATE apartamentos 
      SET status = 'disponivel',
          cliente_nome = NULL,
          cliente_telefone = NULL,
          cliente_email = NULL,
          consultor_nome = NULL,
          updated_at = CURRENT_TIMESTAMP
      WHERE numero = ? AND status = 'negociacao'
    `);
    
    const result = stmt.run(numero);
    return result.changes > 0;
  }
}

export const db = new DatabaseManager();