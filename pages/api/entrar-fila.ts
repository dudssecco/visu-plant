import { NextApiRequest, NextApiResponse } from 'next';
import { db } from '@/lib/database';
import { validarCPF } from '@/lib/cpf-utils';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    try {
      const { apartamento_numero, nome, telefone, email, cpf, consultor } = req.body;

      // Validação de campos obrigatórios
      if (!apartamento_numero || !nome || !telefone || !email || !cpf) {
        return res.status(400).json({ error: 'Todos os campos são obrigatórios' });
      }

      // Validar CPF
      if (!validarCPF(cpf)) {
        return res.status(400).json({ error: 'CPF inválido. Verifique os números digitados.' });
      }

      // Verificar se apartamento existe
      const apartamento = await db.getApartamentoByNumero(apartamento_numero);
      if (!apartamento) {
        return res.status(404).json({ error: 'Apartamento não encontrado' });
      }

      // Adicionar à fila
      const resultado = await db.adicionarNaFila(apartamento_numero, {
        nome,
        telefone,
        email,
        cpf,
        consultor
      });

      if (resultado.success) {
        res.status(200).json({
          success: true,
          message: `Você foi adicionado à fila de espera na posição ${resultado.posicao}`,
          posicao: resultado.posicao
        });
      } else {
        res.status(409).json({ error: resultado.error || 'Não foi possível entrar na fila' });
      }
    } catch (error) {
      console.error('Erro ao entrar na fila:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Método ${req.method} não permitido`);
  }
}
