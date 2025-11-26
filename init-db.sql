-- Script de inicialização do banco PostgreSQL para VisuPlant
-- Este arquivo será executado automaticamente quando o container PostgreSQL for criado pela primeira vez

-- Criar a tabela de apartamentos
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
);

-- Inserir apartamentos iniciais com status específicos
-- L01: Vendida
INSERT INTO apartamentos (numero, status) VALUES ('L01', 'vendido')
ON CONFLICT (numero) DO UPDATE SET status = 'vendido', cliente_nome = NULL, cliente_telefone = NULL, cliente_email = NULL, cliente_cpf = NULL, consultor_nome = NULL, updated_at = CURRENT_TIMESTAMP;

-- L02: Disponível (formulário múltiplo)
INSERT INTO apartamentos (numero, status) VALUES ('L02', 'disponivel')
ON CONFLICT (numero) DO UPDATE SET status = 'disponivel', cliente_nome = NULL, cliente_telefone = NULL, cliente_email = NULL, cliente_cpf = NULL, consultor_nome = NULL, updated_at = CURRENT_TIMESTAMP;

-- 1º Andar
INSERT INTO apartamentos (numero, status) VALUES ('101', 'vendido')
ON CONFLICT (numero) DO UPDATE SET status = 'vendido', cliente_nome = NULL, cliente_telefone = NULL, cliente_email = NULL, cliente_cpf = NULL, consultor_nome = NULL, updated_at = CURRENT_TIMESTAMP;

INSERT INTO apartamentos (numero, status) VALUES ('102', 'disponivel')
ON CONFLICT (numero) DO UPDATE SET status = 'disponivel', cliente_nome = NULL, cliente_telefone = NULL, cliente_email = NULL, cliente_cpf = NULL, consultor_nome = NULL, updated_at = CURRENT_TIMESTAMP;

INSERT INTO apartamentos (numero, status) VALUES ('103', 'disponivel')
ON CONFLICT (numero) DO UPDATE SET status = 'disponivel', cliente_nome = NULL, cliente_telefone = NULL, cliente_email = NULL, cliente_cpf = NULL, consultor_nome = NULL, updated_at = CURRENT_TIMESTAMP;

INSERT INTO apartamentos (numero, status) VALUES ('104', 'vendido')
ON CONFLICT (numero) DO UPDATE SET status = 'vendido', cliente_nome = NULL, cliente_telefone = NULL, cliente_email = NULL, cliente_cpf = NULL, consultor_nome = NULL, updated_at = CURRENT_TIMESTAMP;

INSERT INTO apartamentos (numero, status) VALUES ('105', 'vendido')
ON CONFLICT (numero) DO UPDATE SET status = 'vendido', cliente_nome = NULL, cliente_telefone = NULL, cliente_email = NULL, cliente_cpf = NULL, consultor_nome = NULL, updated_at = CURRENT_TIMESTAMP;

INSERT INTO apartamentos (numero, status) VALUES ('106', 'vendido')
ON CONFLICT (numero) DO UPDATE SET status = 'vendido', cliente_nome = NULL, cliente_telefone = NULL, cliente_email = NULL, cliente_cpf = NULL, consultor_nome = NULL, updated_at = CURRENT_TIMESTAMP;

INSERT INTO apartamentos (numero, status) VALUES ('107', 'vendido')
ON CONFLICT (numero) DO UPDATE SET status = 'vendido', cliente_nome = NULL, cliente_telefone = NULL, cliente_email = NULL, cliente_cpf = NULL, consultor_nome = NULL, updated_at = CURRENT_TIMESTAMP;

INSERT INTO apartamentos (numero, status) VALUES ('108', 'disponivel')
ON CONFLICT (numero) DO UPDATE SET status = 'disponivel', cliente_nome = NULL, cliente_telefone = NULL, cliente_email = NULL, cliente_cpf = NULL, consultor_nome = NULL, updated_at = CURRENT_TIMESTAMP;

INSERT INTO apartamentos (numero, status) VALUES ('109', 'disponivel')
ON CONFLICT (numero) DO UPDATE SET status = 'disponivel', cliente_nome = NULL, cliente_telefone = NULL, cliente_email = NULL, cliente_cpf = NULL, consultor_nome = NULL, updated_at = CURRENT_TIMESTAMP;

-- 2º Andar
INSERT INTO apartamentos (numero, status) VALUES ('201', 'disponivel')
ON CONFLICT (numero) DO UPDATE SET status = 'disponivel', cliente_nome = NULL, cliente_telefone = NULL, cliente_email = NULL, cliente_cpf = NULL, consultor_nome = NULL, updated_at = CURRENT_TIMESTAMP;

INSERT INTO apartamentos (numero, status) VALUES ('202', 'disponivel')
ON CONFLICT (numero) DO UPDATE SET status = 'disponivel', cliente_nome = NULL, cliente_telefone = NULL, cliente_email = NULL, cliente_cpf = NULL, consultor_nome = NULL, updated_at = CURRENT_TIMESTAMP;

INSERT INTO apartamentos (numero, status) VALUES ('203', 'disponivel')
ON CONFLICT (numero) DO UPDATE SET status = 'disponivel', cliente_nome = NULL, cliente_telefone = NULL, cliente_email = NULL, cliente_cpf = NULL, consultor_nome = NULL, updated_at = CURRENT_TIMESTAMP;

INSERT INTO apartamentos (numero, status) VALUES ('204', 'disponivel')
ON CONFLICT (numero) DO UPDATE SET status = 'disponivel', cliente_nome = NULL, cliente_telefone = NULL, cliente_email = NULL, cliente_cpf = NULL, consultor_nome = NULL, updated_at = CURRENT_TIMESTAMP;

INSERT INTO apartamentos (numero, status) VALUES ('205', 'disponivel')
ON CONFLICT (numero) DO UPDATE SET status = 'disponivel', cliente_nome = NULL, cliente_telefone = NULL, cliente_email = NULL, cliente_cpf = NULL, consultor_nome = NULL, updated_at = CURRENT_TIMESTAMP;

INSERT INTO apartamentos (numero, status) VALUES ('206', 'vendido')
ON CONFLICT (numero) DO UPDATE SET status = 'vendido', cliente_nome = NULL, cliente_telefone = NULL, cliente_email = NULL, cliente_cpf = NULL, consultor_nome = NULL, updated_at = CURRENT_TIMESTAMP;

-- 207, 208, 209, 211, 213, 214, 215: Disponível (formulário múltiplo)
INSERT INTO apartamentos (numero, status) VALUES ('207', 'disponivel')
ON CONFLICT (numero) DO UPDATE SET status = 'disponivel', cliente_nome = NULL, cliente_telefone = NULL, cliente_email = NULL, cliente_cpf = NULL, consultor_nome = NULL, updated_at = CURRENT_TIMESTAMP;

INSERT INTO apartamentos (numero, status) VALUES ('208', 'disponivel')
ON CONFLICT (numero) DO UPDATE SET status = 'disponivel', cliente_nome = NULL, cliente_telefone = NULL, cliente_email = NULL, cliente_cpf = NULL, consultor_nome = NULL, updated_at = CURRENT_TIMESTAMP;

INSERT INTO apartamentos (numero, status) VALUES ('209', 'disponivel')
ON CONFLICT (numero) DO UPDATE SET status = 'disponivel', cliente_nome = NULL, cliente_telefone = NULL, cliente_email = NULL, cliente_cpf = NULL, consultor_nome = NULL, updated_at = CURRENT_TIMESTAMP;

INSERT INTO apartamentos (numero, status) VALUES ('210', 'disponivel')
ON CONFLICT (numero) DO UPDATE SET status = 'disponivel', cliente_nome = NULL, cliente_telefone = NULL, cliente_email = NULL, cliente_cpf = NULL, consultor_nome = NULL, updated_at = CURRENT_TIMESTAMP;

INSERT INTO apartamentos (numero, status) VALUES ('211', 'disponivel')
ON CONFLICT (numero) DO UPDATE SET status = 'disponivel', cliente_nome = NULL, cliente_telefone = NULL, cliente_email = NULL, cliente_cpf = NULL, consultor_nome = NULL, updated_at = CURRENT_TIMESTAMP;

INSERT INTO apartamentos (numero, status) VALUES ('212', 'disponivel')
ON CONFLICT (numero) DO UPDATE SET status = 'disponivel', cliente_nome = NULL, cliente_telefone = NULL, cliente_email = NULL, cliente_cpf = NULL, consultor_nome = NULL, updated_at = CURRENT_TIMESTAMP;

INSERT INTO apartamentos (numero, status) VALUES ('213', 'disponivel')
ON CONFLICT (numero) DO UPDATE SET status = 'disponivel', cliente_nome = NULL, cliente_telefone = NULL, cliente_email = NULL, cliente_cpf = NULL, consultor_nome = NULL, updated_at = CURRENT_TIMESTAMP;

INSERT INTO apartamentos (numero, status) VALUES ('214', 'disponivel')
ON CONFLICT (numero) DO UPDATE SET status = 'disponivel', cliente_nome = NULL, cliente_telefone = NULL, cliente_email = NULL, cliente_cpf = NULL, consultor_nome = NULL, updated_at = CURRENT_TIMESTAMP;

INSERT INTO apartamentos (numero, status) VALUES ('215', 'disponivel')
ON CONFLICT (numero) DO UPDATE SET status = 'disponivel', cliente_nome = NULL, cliente_telefone = NULL, cliente_email = NULL, cliente_cpf = NULL, consultor_nome = NULL, updated_at = CURRENT_TIMESTAMP;

-- 3º Andar
INSERT INTO apartamentos (numero, status) VALUES ('301', 'disponivel')
ON CONFLICT (numero) DO UPDATE SET status = 'disponivel', cliente_nome = NULL, cliente_telefone = NULL, cliente_email = NULL, cliente_cpf = NULL, consultor_nome = NULL, updated_at = CURRENT_TIMESTAMP;

INSERT INTO apartamentos (numero, status) VALUES ('302', 'disponivel')
ON CONFLICT (numero) DO UPDATE SET status = 'disponivel', cliente_nome = NULL, cliente_telefone = NULL, cliente_email = NULL, cliente_cpf = NULL, consultor_nome = NULL, updated_at = CURRENT_TIMESTAMP;

INSERT INTO apartamentos (numero, status) VALUES ('303', 'disponivel')
ON CONFLICT (numero) DO UPDATE SET status = 'disponivel', cliente_nome = NULL, cliente_telefone = NULL, cliente_email = NULL, cliente_cpf = NULL, consultor_nome = NULL, updated_at = CURRENT_TIMESTAMP;

INSERT INTO apartamentos (numero, status) VALUES ('304', 'disponivel')
ON CONFLICT (numero) DO UPDATE SET status = 'disponivel', cliente_nome = NULL, cliente_telefone = NULL, cliente_email = NULL, cliente_cpf = NULL, consultor_nome = NULL, updated_at = CURRENT_TIMESTAMP;

INSERT INTO apartamentos (numero, status) VALUES ('305', 'disponivel')
ON CONFLICT (numero) DO UPDATE SET status = 'disponivel', cliente_nome = NULL, cliente_telefone = NULL, cliente_email = NULL, cliente_cpf = NULL, consultor_nome = NULL, updated_at = CURRENT_TIMESTAMP;

-- 306, 307, 309: Disponível (formulário múltiplo)
INSERT INTO apartamentos (numero, status) VALUES ('306', 'disponivel')
ON CONFLICT (numero) DO UPDATE SET status = 'disponivel', cliente_nome = NULL, cliente_telefone = NULL, cliente_email = NULL, cliente_cpf = NULL, consultor_nome = NULL, updated_at = CURRENT_TIMESTAMP;

INSERT INTO apartamentos (numero, status) VALUES ('307', 'disponivel')
ON CONFLICT (numero) DO UPDATE SET status = 'disponivel', cliente_nome = NULL, cliente_telefone = NULL, cliente_email = NULL, cliente_cpf = NULL, consultor_nome = NULL, updated_at = CURRENT_TIMESTAMP;

INSERT INTO apartamentos (numero, status) VALUES ('308', 'vendido')
ON CONFLICT (numero) DO UPDATE SET status = 'vendido', cliente_nome = NULL, cliente_telefone = NULL, cliente_email = NULL, cliente_cpf = NULL, consultor_nome = NULL, updated_at = CURRENT_TIMESTAMP;

INSERT INTO apartamentos (numero, status) VALUES ('309', 'disponivel')
ON CONFLICT (numero) DO UPDATE SET status = 'disponivel', cliente_nome = NULL, cliente_telefone = NULL, cliente_email = NULL, cliente_cpf = NULL, consultor_nome = NULL, updated_at = CURRENT_TIMESTAMP;

INSERT INTO apartamentos (numero, status) VALUES ('310', 'disponivel')
ON CONFLICT (numero) DO UPDATE SET status = 'disponivel', cliente_nome = NULL, cliente_telefone = NULL, cliente_email = NULL, cliente_cpf = NULL, consultor_nome = NULL, updated_at = CURRENT_TIMESTAMP;

INSERT INTO apartamentos (numero, status) VALUES ('311', 'disponivel')
ON CONFLICT (numero) DO UPDATE SET status = 'disponivel', cliente_nome = NULL, cliente_telefone = NULL, cliente_email = NULL, cliente_cpf = NULL, consultor_nome = NULL, updated_at = CURRENT_TIMESTAMP;

INSERT INTO apartamentos (numero, status) VALUES ('312', 'disponivel')
ON CONFLICT (numero) DO UPDATE SET status = 'disponivel', cliente_nome = NULL, cliente_telefone = NULL, cliente_email = NULL, cliente_cpf = NULL, consultor_nome = NULL, updated_at = CURRENT_TIMESTAMP;

INSERT INTO apartamentos (numero, status) VALUES ('313', 'disponivel')
ON CONFLICT (numero) DO UPDATE SET status = 'disponivel', cliente_nome = NULL, cliente_telefone = NULL, cliente_email = NULL, cliente_cpf = NULL, consultor_nome = NULL, updated_at = CURRENT_TIMESTAMP;

INSERT INTO apartamentos (numero, status) VALUES ('314', 'disponivel')
ON CONFLICT (numero) DO UPDATE SET status = 'disponivel', cliente_nome = NULL, cliente_telefone = NULL, cliente_email = NULL, cliente_cpf = NULL, consultor_nome = NULL, updated_at = CURRENT_TIMESTAMP;

INSERT INTO apartamentos (numero, status) VALUES ('315', 'disponivel')
ON CONFLICT (numero) DO UPDATE SET status = 'disponivel', cliente_nome = NULL, cliente_telefone = NULL, cliente_email = NULL, cliente_cpf = NULL, consultor_nome = NULL, updated_at = CURRENT_TIMESTAMP;

-- 4º Andar
INSERT INTO apartamentos (numero, status) VALUES ('401', 'vendido')
ON CONFLICT (numero) DO UPDATE SET status = 'vendido', cliente_nome = NULL, cliente_telefone = NULL, cliente_email = NULL, cliente_cpf = NULL, consultor_nome = NULL, updated_at = CURRENT_TIMESTAMP;

INSERT INTO apartamentos (numero, status) VALUES ('402', 'vendido')
ON CONFLICT (numero) DO UPDATE SET status = 'vendido', cliente_nome = NULL, cliente_telefone = NULL, cliente_email = NULL, cliente_cpf = NULL, consultor_nome = NULL, updated_at = CURRENT_TIMESTAMP;

INSERT INTO apartamentos (numero, status) VALUES ('403', 'vendido')
ON CONFLICT (numero) DO UPDATE SET status = 'vendido', cliente_nome = NULL, cliente_telefone = NULL, cliente_email = NULL, cliente_cpf = NULL, consultor_nome = NULL, updated_at = CURRENT_TIMESTAMP;

INSERT INTO apartamentos (numero, status) VALUES ('404', 'vendido')
ON CONFLICT (numero) DO UPDATE SET status = 'vendido', cliente_nome = NULL, cliente_telefone = NULL, cliente_email = NULL, cliente_cpf = NULL, consultor_nome = NULL, updated_at = CURRENT_TIMESTAMP;

INSERT INTO apartamentos (numero, status) VALUES ('405', 'vendido')
ON CONFLICT (numero) DO UPDATE SET status = 'vendido', cliente_nome = NULL, cliente_telefone = NULL, cliente_email = NULL, cliente_cpf = NULL, consultor_nome = NULL, updated_at = CURRENT_TIMESTAMP;

INSERT INTO apartamentos (numero, status) VALUES ('406', 'vendido')
ON CONFLICT (numero) DO UPDATE SET status = 'vendido', cliente_nome = NULL, cliente_telefone = NULL, cliente_email = NULL, cliente_cpf = NULL, consultor_nome = NULL, updated_at = CURRENT_TIMESTAMP;

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_apartamentos_status ON apartamentos(status);
CREATE INDEX IF NOT EXISTS idx_apartamentos_numero ON apartamentos(numero);

-- Função para atualizar o campo updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para atualizar o campo updated_at automaticamente
CREATE TRIGGER update_apartamentos_updated_at
    BEFORE UPDATE ON apartamentos
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Criar tabela de fila de segunda opção
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
);

-- Criar índices para performance nas consultas de fila
CREATE INDEX IF NOT EXISTS idx_fila_apartamento_posicao
    ON fila_segunda_opcao(apartamento_numero, posicao_fila);
CREATE INDEX IF NOT EXISTS idx_fila_cpf
    ON fila_segunda_opcao(cliente_cpf);

-- Trigger para atualizar o campo updated_at da fila automaticamente
CREATE TRIGGER update_fila_segunda_opcao_updated_at
    BEFORE UPDATE ON fila_segunda_opcao
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();