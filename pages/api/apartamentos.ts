import { NextApiRequest, NextApiResponse } from 'next';
import { db } from '@/lib/database';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method === 'GET') {
      const apartamentos = await db.getAllApartamentos();
      res.status(200).json(apartamentos);
      return;
    }

    if (req.method === 'POST') {
      const { numeros } = req.body as { numeros?: string[] };
      if (!Array.isArray(numeros) || numeros.length === 0) {
        res.status(400).json({ error: 'Parâmetro "numeros" deve ser um array com ao menos 1 item' });
        return;
      }
      const affected = await db.upsertApartamentosDisponiveis(numeros);
      res.status(200).json({ success: true, affected });
      return;
    }

    res.setHeader('Allow', ['GET', 'POST']);
    res.status(405).end(`Método ${req.method} não permitido`);
  } catch (error) {
    console.error('Erro na API de apartamentos:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
}