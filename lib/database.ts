import { Pool } from 'pg';
import { validarCPF } from './cpf-utils';

export interface Apartamento {
  id: number;
  numero: string;
  status: 'disponivel' | 'negociacao' | 'reservado' | 'vendido';
  cliente_nome?: string;
  cliente_telefone?: string;
  cliente_email?: string;
  cliente_cpf?: string;
  consultor_nome?: string;
  created_at: string;
  updated_at: string;
}

export interface FilaSegundaOpcao {
  id: number;
  apartamento_numero: string;
  posicao_fila: number;
  cliente_nome: string;
  cliente_telefone: string;
  cliente_email: string;
  cliente_cpf: string;
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
          status VARCHAR(20) DEFAULT 'disponivel' CHECK (status IN ('disponivel', 'negociacao', 'reservado', 'vendido')),
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

      // Criar tabela de fila de segunda opção
      await client.query(`
        CREATE TABLE IF NOT EXISTS fila_segunda_opcao (
          id SERIAL PRIMARY KEY,
          apartamento_numero VARCHAR(10) NOT NULL,
          posicao_fila INTEGER NOT NULL,
          cliente_nome VARCHAR(255) NOT NULL,
          cliente_telefone VARCHAR(20) NOT NULL,
          cliente_email VARCHAR(255) NOT NULL,
          cliente_cpf VARCHAR(14) NOT NULL,
          consultor_nome VARCHAR(255),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT fk_apartamento FOREIGN KEY (apartamento_numero)
            REFERENCES apartamentos(numero) ON DELETE CASCADE,
          CONSTRAINT unique_cpf_apartamento UNIQUE (apartamento_numero, cliente_cpf)
        )
      `);

      // Criar índices para performance nas consultas de fila
      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_fila_apartamento_posicao
          ON fila_segunda_opcao(apartamento_numero, posicao_fila)
      `);
      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_fila_cpf
          ON fila_segunda_opcao(cliente_cpf)
      `);

      // Verificar se precisa inserir dados iniciais
      const result = await client.query('SELECT COUNT(*) as count FROM apartamentos');
      const count = parseInt(result.rows[0].count);

      if (count === 0) {
        // Apartamentos com seus status específicos (numero, status)
        const apartamentos: [string, string][] = [
          // Lojas
          ['L01', 'vendido'],
          ['L02', 'disponivel'], // Formulário múltiplo

          // 1º Andar
          ['101', 'vendido'],
          ['102', 'disponivel'],
          ['103', 'disponivel'],
          ['104', 'vendido'],
          ['105', 'vendido'],
          ['106', 'vendido'],
          ['107', 'vendido'],
          ['108', 'disponivel'],
          ['109', 'disponivel'],

          // 2º Andar
          ['201', 'disponivel'],
          ['202', 'disponivel'],
          ['203', 'disponivel'],
          ['204', 'disponivel'],
          ['205', 'disponivel'],
          ['206', 'vendido'],
          ['207', 'disponivel'], // Formulário múltiplo
          ['208', 'disponivel'], // Formulário múltiplo
          ['209', 'disponivel'], // Formulário múltiplo
          ['210', 'disponivel'],
          ['211', 'disponivel'], // Formulário múltiplo
          ['212', 'disponivel'],
          ['213', 'disponivel'], // Formulário múltiplo
          ['214', 'disponivel'],
          ['215', 'disponivel'], // Formulário múltiplo

          // 3º Andar
          ['301', 'disponivel'],
          ['302', 'disponivel'],
          ['303', 'disponivel'],
          ['304', 'disponivel'],
          ['305', 'disponivel'],
          ['306', 'disponivel'], // Formulário múltiplo
          ['307', 'disponivel'], // Formulário múltiplo
          ['308', 'vendido'],
          ['309', 'disponivel'], // Formulário múltiplo
          ['310', 'disponivel'],
          ['311', 'disponivel'],
          ['312', 'disponivel'],
          ['313', 'disponivel'],
          ['314', 'disponivel'],
          ['315', 'disponivel'],

          // 4º Andar
          ['401', 'vendido'],
          ['402', 'vendido'],
          ['403', 'vendido'],
          ['404', 'vendido'],
          ['405', 'vendido'],
          ['406', 'vendido']
        ];

        for (const [numero, status] of apartamentos) {
          await client.query('INSERT INTO apartamentos (numero, status) VALUES ($1, $2)', [numero, status]);
        }

        console.log('✅ Apartamentos iniciais inseridos com status corretos');
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
    status: 'disponivel' | 'negociacao' | 'reservado' | 'vendido',
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
      // Limpar CPF (apenas dígitos) para buscar no banco
      const cpfLimpo = cpf.replace(/[^\d]/g, '');

      const result = await this.pool.query(`
        SELECT COUNT(*) as count
        FROM apartamentos
        WHERE cliente_cpf = $1 AND status IN ('negociacao', 'reservado')
      `, [cpfLimpo]);

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
        SET status = 'reservado',
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
        SET status = 'reservado',
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

  // ============================================
  // MÉTODOS DA FILA DE SEGUNDA OPÇÃO
  // ============================================

  /**
   * Adiciona um cliente à fila de segunda opção para um apartamento
   * Retorna a posição na fila ou erro se falhar
   */
  async adicionarNaFila(
    apartamentoNumero: string,
    clienteData: {
      nome: string;
      telefone: string;
      email: string;
      cpf: string;
      consultor?: string;
    }
  ): Promise<{ success: boolean; posicao?: number; error?: string }> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');

      // Limpar CPF (apenas dígitos)
      const cpfLimpo = clienteData.cpf.replace(/[^\d]/g, '');

      // Verificar se CPF já está na fila para este apartamento
      const checkDuplicate = await client.query(
        'SELECT id FROM fila_segunda_opcao WHERE apartamento_numero = $1 AND cliente_cpf = $2',
        [apartamentoNumero, cpfLimpo]
      );

      if (checkDuplicate.rows.length > 0) {
        await client.query('ROLLBACK');
        return { success: false, error: 'CPF já está na fila para este apartamento' };
      }

      // Calcular próxima posição na fila
      const positionQuery = await client.query(
        'SELECT COALESCE(MAX(posicao_fila), 0) + 1 as next_position FROM fila_segunda_opcao WHERE apartamento_numero = $1',
        [apartamentoNumero]
      );
      const nextPosition = positionQuery.rows[0].next_position;

      // Inserir na fila
      const result = await client.query(
        `INSERT INTO fila_segunda_opcao
         (apartamento_numero, posicao_fila, cliente_nome, cliente_telefone, cliente_email, cliente_cpf, consultor_nome)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING id, posicao_fila`,
        [
          apartamentoNumero,
          nextPosition,
          clienteData.nome,
          clienteData.telefone,
          clienteData.email,
          cpfLimpo,
          clienteData.consultor || null
        ]
      );

      await client.query('COMMIT');
      return { success: true, posicao: result.rows[0].posicao_fila };
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Erro ao adicionar na fila:', error);
      return { success: false, error: 'Erro ao adicionar na fila de espera' };
    } finally {
      client.release();
    }
  }

  /**
   * Obtém toda a fila de um apartamento específico, ordenada por posição
   */
  async obterFilaPorApartamento(apartamentoNumero: string): Promise<FilaSegundaOpcao[]> {
    try {
      const result = await this.pool.query(
        'SELECT * FROM fila_segunda_opcao WHERE apartamento_numero = $1 ORDER BY posicao_fila ASC',
        [apartamentoNumero]
      );
      return result.rows;
    } catch (error) {
      console.error('Erro ao obter fila:', error);
      return [];
    }
  }

  /**
   * Obtém o tamanho da fila de um apartamento
   */
  async obterTamanhoFila(apartamentoNumero: string): Promise<number> {
    try {
      const result = await this.pool.query(
        'SELECT COUNT(*) as count FROM fila_segunda_opcao WHERE apartamento_numero = $1',
        [apartamentoNumero]
      );
      return parseInt(result.rows[0].count);
    } catch (error) {
      console.error('Erro ao obter tamanho da fila:', error);
      return 0;
    }
  }

  /**
   * Verifica se um CPF está na fila de um apartamento específico
   */
  async verificarCpfNaFila(apartamentoNumero: string, cpf: string): Promise<{
    naFila: boolean;
    posicao?: number;
  }> {
    try {
      const cpfLimpo = cpf.replace(/[^\d]/g, '');
      const result = await this.pool.query(
        'SELECT posicao_fila FROM fila_segunda_opcao WHERE apartamento_numero = $1 AND cliente_cpf = $2',
        [apartamentoNumero, cpfLimpo]
      );

      if (result.rows.length > 0) {
        return { naFila: true, posicao: result.rows[0].posicao_fila };
      }
      return { naFila: false };
    } catch (error) {
      console.error('Erro ao verificar CPF na fila:', error);
      return { naFila: false };
    }
  }

  /**
   * Obtém todas as filas de todos os apartamentos
   * Útil para visualização administrativa
   */
  async obterTodasFilas(): Promise<FilaSegundaOpcao[]> {
    try {
      const result = await this.pool.query(
        'SELECT * FROM fila_segunda_opcao ORDER BY apartamento_numero, posicao_fila ASC'
      );
      return result.rows;
    } catch (error) {
      console.error('Erro ao obter todas as filas:', error);
      return [];
    }
  }

  // Método para fechar conexões (útil para testes)
  async close(): Promise<void> {
    await this.pool.end();
  }
}

export const db = new DatabaseManager();