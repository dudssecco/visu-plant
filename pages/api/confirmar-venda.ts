import { NextApiRequest, NextApiResponse } from 'next';
import { db, validarCPF } from '@/lib/database';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    try {
      const { numero, nome, telefone, email, cpf, consultor } = req.body;

      // Modo venda rápida: sem dados pessoais
      if (!nome && !telefone && !email && !cpf && !consultor) {
        const sucesso = await db.vendaRapida(numero);
        if (sucesso) {
          return res.status(200).json({ success: true, message: 'Venda rápida concluída', numero });
        }
        return res.status(409).json({ error: 'Apartamento não disponível para venda rápida' });
      }

      // Validação padrão com dados pessoais
      if (!numero || !nome || !telefone || !email || !cpf || !consultor) {
        return res.status(400).json({ error: 'Todos os campos são obrigatórios' });
      }

      // Validar CPF
      if (!validarCPF(cpf)) {
        return res.status(400).json({ error: 'CPF inválido. Verifique os números digitados.' });
      }

      // Verificar limite de 2 apartamentos por CPF
      const { valido, apartamentosAtivos } = await db.verificarLimiteCPF(cpf);
      if (!valido) {
        return res.status(409).json({ 
          error: `Este CPF já possui ${apartamentosAtivos} apartamento(s). Máximo permitido: 2 apartamentos por CPF.` 
        });
      }

      // Confirmar a venda
      const sucesso = await db.confirmarVenda(numero, {
        nome,
        telefone,
        email,
        cpf,
        consultor
      });

      if (sucesso) {
        res.status(200).json({ 
          success: true, 
          message: 'Venda confirmada com sucesso',
          numero 
        });
      } else {
        res.status(409).json({ 
          error: 'Apartamento não está disponível para confirmação. Pode ter sido vendido para outro cliente.' 
        });
      }
    } catch (error) {
      console.error('Erro ao confirmar venda:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Método ${req.method} não permitido`);
  }
}