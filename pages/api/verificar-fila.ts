import { NextApiRequest, NextApiResponse } from 'next';
import { db } from '@/lib/database';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      const { apartamento, cpf } = req.query;

      if (!apartamento) {
        return res.status(400).json({ error: 'Número do apartamento é obrigatório' });
      }

      // Se CPF fornecido, verificar posição específica
      if (cpf) {
        const resultado = await db.verificarCpfNaFila(
          apartamento as string,
          cpf as string
        );
        return res.status(200).json(resultado);
      }

      // Caso contrário, retornar fila completa do apartamento
      const fila = await db.obterFilaPorApartamento(apartamento as string);
      const tamanho = await db.obterTamanhoFila(apartamento as string);

      res.status(200).json({
        fila,
        tamanho
      });
    } catch (error) {
      console.error('Erro ao verificar fila:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  } else {
    res.setHeader('Allow', ['GET']);
    res.status(405).end(`Método ${req.method} não permitido`);
  }
}
