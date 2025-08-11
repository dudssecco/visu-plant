import { NextApiRequest, NextApiResponse } from 'next';
import { db } from '@/lib/database';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    try {
      const { numero } = req.body;

      if (!numero) {
        return res.status(400).json({ error: 'Número do apartamento é obrigatório' });
      }

      // Tentar reservar o apartamento
      const sucesso = db.reservarApartamento(numero);

      if (sucesso) {
        res.status(200).json({ 
          success: true, 
          message: 'Apartamento reservado com sucesso',
          numero 
        });
      } else {
        res.status(409).json({ 
          error: 'Apartamento não está disponível para reserva' 
        });
      }
    } catch (error) {
      console.error('Erro ao reservar apartamento:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Método ${req.method} não permitido`);
  }
}