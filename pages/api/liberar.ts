import { NextApiRequest, NextApiResponse } from 'next';
import { db } from '@/lib/database';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    try {
      const { numero } = req.body;

      if (!numero) {
        return res.status(400).json({ error: 'Número do apartamento é obrigatório' });
      }

      // Liberar o apartamento (apenas se estiver em negociação)
      const sucesso = await db.liberarApartamento(numero);

      if (sucesso) {
        res.status(200).json({ 
          success: true, 
          message: 'Apartamento liberado com sucesso',
          numero 
        });
      } else {
        res.status(404).json({ 
          error: 'Apartamento não encontrado ou não estava em negociação' 
        });
      }
    } catch (error) {
      console.error('Erro ao liberar apartamento:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Método ${req.method} não permitido`);
  }
}