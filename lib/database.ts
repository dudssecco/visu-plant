import { Pool, PoolClient } from 'pg';

export function validarCPF(cpf: string): boolean {
  cpf = cpf.replace(/[^\d]/g, '');
  
  if (cpf.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(cpf)) return false;
  
  let soma = 0;
  for (let i = 0; i < 9; i++) {
    soma += parseInt(cpf.charAt(i)) * (10 - i);
  }
  let resto = 11 - (soma % 11);
  if (resto === 10 || resto === 11) resto = 0;
  if (resto !== parseInt(cpf.charAt(9))) return false;
  
  soma = 0;
  for (let i = 0; i < 10; i++) {
    soma += parseInt(cpf.charAt(i)) * (11 - i);
  }
  resto = 11 - (soma % 11);
  if (resto === 10 || resto === 11) resto = 0;
  if (resto !== parseInt(cpf.charAt(10))) return false;
  
  return true;
}

export function formatarCPF(cpf: string): string {
  cpf = cpf.replace(/[^\d]/g, '');
  return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
}

export interface Apartamento {
  id: number;
  numero: string;
  status: 'disponivel' | 'negociacao' | 'vendido';
  cliente_nome?: string;
  cliente_telefone?: string;
  cliente_email?: string;
  cliente_cpf?: string;
  consultor_nome?: string;
  created_at: string;
  updated_at: string;
}

class DatabaseManager {
  private pool: Pool;

  constructor() {
    // Configuração do pool de conexões PostgreSQL
    this.pool = new Pool({
      connectionString: process.env.DATABASE_URL || 'postgresql://visuplant_user:visuplant_password@localhost:5432/visuplant',
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });

    this.init();
  }

  private async init() {
    try {
      // Testar conexão
      const client = await this.pool.connect();
      console.log('✅ Conectado ao PostgreSQL');
      client.release();
    } catch (error) {
      console.error('❌ Erro ao conectar no PostgreSQL:', error);
      // Em desenvolvimento, criar tabelas se não existirem
      if (process.env.NODE_ENV !== 'production') {
        await this.createTablesIfNotExists();
      }
    }
  }

  private async createTablesIfNotExists() {
    try {
      const client = await this.pool.connect();
      
      // Criar tabela se não existir (para desenvolvimento local)
      await client.query(`
        CREATE TABLE IF NOT EXISTS apartamentos (
          id SERIAL PRIMARY KEY,
          numero VARCHAR(10) UNIQUE NOT NULL,
          status VARCHAR(20) DEFAULT 'disponivel' CHECK (status IN ('disponivel', 'negociacao', 'vendido')),
          cliente_nome VARCHAR(255),
          cliente_telefone VARCHAR(20),
          cliente_email VARCHAR(255),
          cliente_cpf VARCHAR(14),
          consultor_nome VARCHAR(255),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Adicionar coluna CPF se não existir (migração)
      await client.query(`
        ALTER TABLE apartamentos 
        ADD COLUMN IF NOT EXISTS cliente_cpf VARCHAR(14)
      `);

      // Verificar se precisa inserir dados iniciais
      const result = await client.query('SELECT COUNT(*) as count FROM apartamentos');
      const count = parseInt(result.rows[0].count);

      if (count === 0) {
        const apartamentos = [
          'L01',
          '101', '102', '103', '104', '105', '106', '107', '108', '109', '110', '111',
          '201', '202', '203', '204', '205', '206', '207', '208', '209', '210', '211', '212',
          '301', '302', '303', '304', '305', '306', '307', '308', '309',
          '401', '402', '403', '404', '405', '406', '407', '408', '409',
          '501', '502'
        ];

        for (const numero of apartamentos) {
          await client.query('INSERT INTO apartamentos (numero) VALUES ($1)', [numero]);
        }
        
        console.log('✅ Apartamentos iniciais inseridos');
      }

      client.release();
    } catch (error) {
      console.error('❌ Erro ao criar tabelas:', error);
    }
  }

  async getAllApartamentos(): Promise<Apartamento[]> {
    try {
      const result = await this.pool.query('SELECT * FROM apartamentos ORDER BY numero');
      return result.rows;
    } catch (error) {
      console.error('Erro ao buscar apartamentos:', error);
      return [];
    }
  }

  async getApartamentoByNumero(numero: string): Promise<Apartamento | undefined> {
    try {
      const result = await this.pool.query('SELECT * FROM apartamentos WHERE numero = $1', [numero]);
      return result.rows[0];
    } catch (error) {
      console.error('Erro ao buscar apartamento:', error);
      return undefined;
    }
  }

  async updateApartamentoStatus(
    numero: string, 
    status: 'disponivel' | 'negociacao' | 'vendido', 
    clienteData?: {
      nome?: string;
      telefone?: string;
      email?: string;
      cpf?: string;
      consultor?: string;
    }
  ): Promise<boolean> {
    try {
      const result = await this.pool.query(`
        UPDATE apartamentos 
        SET status = $1, 
            cliente_nome = $2, 
            cliente_telefone = $3, 
            cliente_email = $4, 
            cliente_cpf = $5,
            consultor_nome = $6,
            updated_at = CURRENT_TIMESTAMP
        WHERE numero = $7
      `, [
        status,
        clienteData?.nome || null,
        clienteData?.telefone || null,
        clienteData?.email || null,
        clienteData?.cpf || null,
        clienteData?.consultor || null,
        numero
      ]);

      return result.rowCount !== null && result.rowCount > 0;
    } catch (error) {
      console.error('Erro ao atualizar apartamento:', error);
      return false;
    }
  }

  async verificarLimiteCPF(cpf: string): Promise<{ valido: boolean; apartamentosAtivos: number }> {
    try {
      const result = await this.pool.query(`
        SELECT COUNT(*) as count 
        FROM apartamentos 
        WHERE cliente_cpf = $1 AND status IN ('negociacao', 'vendido')
      `, [cpf]);

      const apartamentosAtivos = parseInt(result.rows[0].count);
      return {
        valido: apartamentosAtivos < 2,
        apartamentosAtivos
      };
    } catch (error) {
      console.error('Erro ao verificar limite CPF:', error);
      return { valido: false, apartamentosAtivos: 0 };
    }
  }

  async reservarApartamento(numero: string): Promise<boolean> {
    try {
      const result = await this.pool.query(`
        UPDATE apartamentos 
        SET status = 'negociacao', updated_at = CURRENT_TIMESTAMP
        WHERE numero = $1 AND status = 'disponivel'
      `, [numero]);

      return result.rowCount !== null && result.rowCount > 0;
    } catch (error) {
      console.error('Erro ao reservar apartamento:', error);
      return false;
    }
  }

  async confirmarVenda(numero: string, clienteData: {
    nome: string;
    telefone: string;
    email: string;
    cpf: string;
    consultor: string;
  }): Promise<boolean> {
    try {
      // Validar CPF
      if (!validarCPF(clienteData.cpf)) {
        console.error('CPF inválido');
        return false;
      }

      // Verificar limite de 2 apartamentos por CPF
      const { valido } = await this.verificarLimiteCPF(clienteData.cpf);
      if (!valido) {
        console.error('Limite de 2 apartamentos por CPF excedido');
        return false;
      }

      const cpfLimpo = clienteData.cpf.replace(/[^\d]/g, '');

      const result = await this.pool.query(`
        UPDATE apartamentos 
        SET status = 'vendido',
            cliente_nome = $1,
            cliente_telefone = $2,
            cliente_email = $3,
            cliente_cpf = $4,
            consultor_nome = $5,
            updated_at = CURRENT_TIMESTAMP
        WHERE numero = $6 AND status = 'negociacao'
      `, [
        clienteData.nome,
        clienteData.telefone,
        clienteData.email,
        cpfLimpo,
        clienteData.consultor,
        numero
      ]);

      return result.rowCount !== null && result.rowCount > 0;
    } catch (error) {
      console.error('Erro ao confirmar venda:', error);
      return false;
    }
  }

  async liberarApartamento(numero: string): Promise<boolean> {
    try {
      const result = await this.pool.query(`
        UPDATE apartamentos 
        SET status = 'disponivel',
            cliente_nome = NULL,
            cliente_telefone = NULL,
            cliente_email = NULL,
            cliente_cpf = NULL,
            consultor_nome = NULL,
            updated_at = CURRENT_TIMESTAMP
        WHERE numero = $1 AND status = 'negociacao'
      `, [numero]);

      return result.rowCount !== null && result.rowCount > 0;
    } catch (error) {
      console.error('Erro ao liberar apartamento:', error);
      return false;
    }
  }

  async vendaRapida(numero: string): Promise<boolean> {
    try {
      const result = await this.pool.query(`
        UPDATE apartamentos
        SET status = 'vendido',
            cliente_nome = NULL,
            cliente_telefone = NULL,
            cliente_email = NULL,
            consultor_nome = NULL,
            updated_at = CURRENT_TIMESTAMP
        WHERE numero = $1 AND status IN ('disponivel', 'negociacao')
      `, [numero]);

      return result.rowCount !== null && result.rowCount > 0;
    } catch (error) {
      console.error('Erro em venda rápida:', error);
      return false;
    }
  }

  async upsertApartamentosDisponiveis(numeros: string[]): Promise<number> {
    if (!numeros || numeros.length === 0) return 0;
    const client = await this.pool.connect();
    try {
      const valuesPlaceholders = numeros.map((_, idx) => `($${idx + 1}, 'disponivel')`).join(', ');
      const query = `
        INSERT INTO apartamentos (numero, status)
        VALUES ${valuesPlaceholders}
        ON CONFLICT (numero) DO UPDATE SET
          status = 'disponivel',
          cliente_nome = NULL,
          cliente_telefone = NULL,
          cliente_email = NULL,
          cliente_cpf = NULL,
          consultor_nome = NULL,
          updated_at = CURRENT_TIMESTAMP
      `;
      const result = await client.query(query, numeros);
      return result.rowCount ?? 0;
    } catch (error) {
      console.error('Erro ao upsert de apartamentos:', error);
      return 0;
    } finally {
      client.release();
    }
  }

  // Método para fechar conexões (útil para testes)
  async close(): Promise<void> {
    await this.pool.end();
  }
}

export const db = new DatabaseManager();