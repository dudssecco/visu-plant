import { NextApiRequest, NextApiResponse } from 'next';
import { db } from '@/lib/database';

/**
 * Endpoint administrativo para visualizar todas as filas
 * Retorna todas as entradas agrupadas por apartamento
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      const todasFilas = await db.obterTodasFilas();

      // Agrupar por apartamento para facilitar visualização
      const filasPorApartamento: Record<string, any[]> = {};

      todasFilas.forEach(entrada => {
        if (!filasPorApartamento[entrada.apartamento_numero]) {
          filasPorApartamento[entrada.apartamento_numero] = [];
        }
        filasPorApartamento[entrada.apartamento_numero].push(entrada);
      });

      res.status(200).json({
        total: todasFilas.length,
        filasPorApartamento
      });
    } catch (error) {
      console.error('Erro ao listar filas:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  } else {
    res.setHeader('Allow', ['GET']);
    res.status(405).end(`Método ${req.method} não permitido`);
  }
}
