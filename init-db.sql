-- Script de inicialização do banco PostgreSQL para VisuPlant
-- Este arquivo será executado automaticamente quando o container PostgreSQL for criado pela primeira vez

-- Criar a tabela de apartamentos
CREATE TABLE IF NOT EXISTS apartamentos (
    id SERIAL PRIMARY KEY,
    numero VARCHAR(10) UNIQUE NOT NULL,
    status VARCHAR(20) DEFAULT 'disponivel' CHECK (status IN ('disponivel', 'negociacao', 'vendido')),
    cliente_nome VARCHAR(255),
    cliente_telefone VARCHAR(20),
    cliente_email VARCHAR(255),
    consultor_nome VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Inserir apartamentos iniciais
INSERT INTO apartamentos (numero) VALUES 
('L01'),
('101'), ('102'), ('103'), ('104'), ('105'), ('106'), ('107'), ('108'), ('109'),
('201'), ('202'), ('203'), ('204'), ('205'), ('206'), ('207'), ('208'), ('209'), ('210'), ('211'),
('301'), ('302'), ('303'), ('304'), ('305'), ('306'), ('307'), ('308'), ('309'),
('401'), ('402')
ON CONFLICT (numero) DO NOTHING;

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