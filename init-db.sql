-- Script de inicialização do banco PostgreSQL para VisuPlant
-- Este arquivo será executado automaticamente quando o container PostgreSQL for criado pela primeira vez

-- Criar a tabela de apartamentos
CREATE TABLE IF NOT EXISTS apartamentos (
    id SERIAL PRIMARY KEY,
    numero VARCHAR(10) UNIQUE NOT NULL,
    status VARCHAR(20) DEFAULT 'disponivel' CHECK (status IN ('disponivel', 'negociacao', 'reservado')),
    cliente_nome VARCHAR(255),
    cliente_telefone VARCHAR(20),
    cliente_email VARCHAR(255),
    cliente_cpf VARCHAR(14),
    consultor_nome VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Inserir apartamentos iniciais
INSERT INTO apartamentos (numero) VALUES 
('L01'),
('101'), ('102'), ('103'), ('104'), ('105'), ('106'), ('107'), ('108'), ('109'), ('110'), ('111'),
('201'), ('202'), ('203'), ('204'), ('205'), ('206'), ('207'), ('208'), ('209'), ('210'), ('211'), ('212'),
('301'), ('302'), ('303'), ('304'), ('305'), ('306'), ('307'), ('308'), ('309'),
('401'), ('402'), ('403'), ('404'), ('405'), ('406'), ('407'), ('408'), ('409'),
('501'), ('502')
ON CONFLICT (numero) DO UPDATE SET
  status = 'disponivel',
  cliente_nome = NULL,
  cliente_telefone = NULL,
  cliente_email = NULL,
  consultor_nome = NULL,
  updated_at = CURRENT_TIMESTAMP;

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