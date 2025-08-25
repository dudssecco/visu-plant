import { NextApiRequest, NextApiResponse } from 'next';
import { db } from '@/lib/database';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    try {
      const { apartamentos } = req.body;

      if (!apartamentos || !Array.isArray(apartamentos) || apartamentos.length === 0) {
        return res.status(400).json({ error: 'Lista de apartamentos é obrigatória' });
      }

      // Tentar reservar todos os apartamentos
      const reservaPromises = apartamentos.map(numero => 
        db.reservarApartamento(numero)
      );
      const reservaResults = await Promise.all(reservaPromises);

      // Verificar quais apartamentos não puderam ser reservados
      const apartamentosNaoReservados = apartamentos.filter((_, index) => !reservaResults[index]);

      if (apartamentosNaoReservados.length > 0) {
        // Liberar os apartamentos que foram reservados com sucesso
        const apartamentosReservados = apartamentos.filter((_, index) => reservaResults[index]);
        await Promise.all(apartamentosReservados.map(numero => 
          db.liberarApartamento(numero)
        ));

        return res.status(409).json({ 
          error: `Os seguintes apartamentos não estão mais disponíveis: ${apartamentosNaoReservados.join(', ')}`,
          apartamentosNaoReservados
        });
      }

      // Se chegou até aqui, todos os apartamentos foram reservados
      res.status(200).json({ 
        success: true, 
        message: `${apartamentos.length} apartamento(s) reservado(s) com sucesso`,
        apartamentos: apartamentos
      });

    } catch (error) {
      console.error('Erro ao reservar apartamentos:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Método ${req.method} não permitido`);
  }
}

