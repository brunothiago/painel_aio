/**
 * App.jsx — carrega o CSV gerado pelo pipeline Python e exibe o dashboard.
 *
 * Fluxo de dados:
 *   aio_pipeline.py → PostgreSQL → exportar_csv.py → public/aio_solicitacoes.csv → aqui
 */
import React, { useEffect, useState } from 'react';
import Papa from 'papaparse';
import DashboardAIO from './DashboardAIO';
import { mapearLinhasAIO } from './mapeador';
import { dadosExemplo } from './dados-exemplo';

const CSV_URL = `${import.meta.env.BASE_URL}aio_solicitacoes.csv`;

export default function App() {
  const [dados, setDados] = useState(dadosExemplo);
  const [fonte, setFonte] = useState('exemplo');
  const [erro, setErro] = useState(null);

  useEffect(() => {
    Papa.parse(CSV_URL, {
      download: true,
      header: true,
      skipEmptyLines: true,
      transformHeader: (h) => h.trim(),
      complete: (res) => {
        const linhas = (res.data || []).filter((r) => r.id || r.instrumento);
        if (linhas.length === 0) {
          setErro('CSV vazio — rode: python3 exportar_csv.py');
          setFonte('exemplo');
          setDados(dadosExemplo);
          return;
        }
        setDados(mapearLinhasAIO(linhas));
        setFonte('csv');
        setErro(null);
      },
      error: () => {
        setErro(`Não foi possível ler ${CSV_URL}`);
        setFonte('exemplo');
        setDados(dadosExemplo);
      },
    });
  }, []);

  return (
    <>
      {erro && (
        <div
          style={{
            background: '#FFF3CD',
            color: '#664D03',
            padding: '8px 16px',
            fontSize: 13,
            textAlign: 'center',
          }}
        >
          {erro} — exibindo dados de exemplo.
        </div>
      )}
      {fonte === 'csv' && (
        <div
          style={{
            background: '#D1E7DD',
            color: '#0F5132',
            padding: '6px 16px',
            fontSize: 12,
            textAlign: 'center',
          }}
        >
          Dados carregados de aio_solicitacoes.csv ({dados.length} registros)
        </div>
      )}
      <DashboardAIO dados={dados} />
    </>
  );
}
