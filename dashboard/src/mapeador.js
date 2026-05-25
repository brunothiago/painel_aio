/**
 * ============================================================================
 *  mapeador.js
 * ----------------------------------------------------------------------------
 *  Converte linhas no formato bruto do banco/CSV para o shape consumido pelo
 *  componente <DashboardAIO />.
 *
 *  Exemplo de uso com fetch a uma API/endpoint do projeto:
 *
 *    import { mapearLinhasAIO } from './mapeador';
 *
 *    const res  = await fetch('/api/aio_solicitacoes');
 *    const raw  = await res.json();             // linhas brutas do PostgreSQL
 *    const dados = mapearLinhasAIO(raw);
 *    <DashboardAIO dados={dados} />
 *
 *  Exemplo com Papa Parse (lendo o CSV direto):
 *
 *    import Papa from 'papaparse';
 *    Papa.parse(csvFile, {
 *      header: true,
 *      dynamicTyping: true,
 *      complete: (res) => setDados(mapearLinhasAIO(res.data)),
 *    });
 * ============================================================================
 */

/* Mapa de código de programa -> rótulo curto.
   Atualize aqui quando novos programas forem incorporados ao Novo PAC. */
const PROGRAMA_CURTO = {
  '5600020250030': 'MCMV Sub 50',
  '5600020240045': 'Mobilidade Urbana',
};

/** Capitaliza nome de município ('CACULÉ' -> 'Caculé') */
const capitalize = (s = '') =>
  s
    .toLowerCase()
    .split(' ')
    .map((w) =>
      ['de', 'da', 'do', 'das', 'dos', 'e'].includes(w)
        ? w
        : w.charAt(0).toUpperCase() + w.slice(1)
    )
    .join(' ');

/** Extrai apenas YYYY-MM-DD de uma string com ou sem timestamp */
const onlyDate = (s) => (s ? String(s).slice(0, 10) : null);

/** Converte uma linha bruta (do CSV / SELECT) para o shape do dashboard */
export function mapearLinhaAIO(row) {
  return {
    id:             row.id,
    tc:             String(row.tc ?? ''),
    instrumento:    String(row.instrumento ?? ''),
    recebedor:      row.recebedor ?? '',
    municipio:      capitalize(row.municipio ?? ''),
    uf:             (row.uf ?? '').toUpperCase(),
    objeto:         row.objeto ?? '',
    programa:       row.programa_descricao ?? row.programa ?? '',
    programaCurto:  PROGRAMA_CURTO[String(row.programa_codigo)] ?? 'Outros',
    valorInvest:    Number(row.valor_investimento ?? 0),
    valorRepasse:   Number(row.valor_repasse ?? 0),
    dataAssinatura: onlyDate(row.data_assinatura),
    dataSuspensiva: onlyDate(row.data_retirada_suspensiva),
    dataVigencia:   onlyDate(row.data_vigencia),
    dataAIO:        onlyDate(row.data_aio_recebido),
    acao:           row.acao_orcamentaria ?? '',
  };
}

/** Versão para uma coleção (array) de linhas */
export const mapearLinhasAIO = (rows = []) => rows.map(mapearLinhaAIO);
