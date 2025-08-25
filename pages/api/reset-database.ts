import { NextApiRequest, NextApiResponse } from 'next';
import { db } from '@/lib/database';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    try {
      // Buscar todos os apartamentos
      const apartamentos = await db.getAllApartamentos();
      
      // Liberar todos os apartamentos (colocar como disponível)
      const resetPromises = apartamentos.map(apartamento => 
        db.updateApartamentoStatus(apartamento.numero, 'disponivel')
      );
      
      await Promise.all(resetPromises);

      res.status(200).json({ 
        success: true, 
        message: `${apartamentos.length} apartamentos foram resetados para disponível`,
        count: apartamentos.length
      });
    } catch (error) {
      console.error('Erro ao resetar banco de dados:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Método ${req.method} não permitido`);
  }
}

