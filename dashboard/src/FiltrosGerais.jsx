/**
 * Filtros globais — barra discreta, painel recolhível, listas numeradas com busca.
 */
import React, { useMemo, useState, useRef, useEffect } from 'react';
import { SlidersHorizontal, ChevronDown, X, Search, Check } from 'lucide-react';

const C = {
  navy: '#071D41',
  blue: '#1351B4',
  text: '#333333',
  muted: '#8C8C8C',
  line: '#E5E7EB',
  bg: '#FAFAF7',
  card: '#FFFFFF',
  red: '#BC4749',
};

function normalizarBusca(s) {
  return s
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase();
}

/** Lista com busca, numeração e checkboxes — escala com centenas de itens */
function ListaFiltro({
  titulo,
  itens,
  selecionados,
  onChange,
  busca,
  onBuscaChange,
  renderLabel,
  renderMeta,
  idPrefix,
}) {
  const filtrados = useMemo(() => {
    const q = normalizarBusca(busca.trim());
    if (!q) return itens;
    return itens.filter((item) => normalizarBusca(renderLabel(item)).includes(q));
  }, [itens, busca, renderLabel]);

  const todosFiltradosMarcados =
    filtrados.length > 0 && filtrados.every((item) => selecionados.includes(item.id));

  const marcarFiltrados = () => {
    const ids = filtrados.map((i) => i.id);
    const uniao = [...new Set([...selecionados, ...ids])];
    onChange(uniao);
  };

  const desmarcarFiltrados = () => {
    const idsSet = new Set(filtrados.map((i) => i.id));
    onChange(selecionados.filter((id) => !idsSet.has(id)));
  };

  return (
    <div className="flex flex-col min-h-0 flex-1">
      <div
        className="text-[10px] font-semibold tracking-[0.18em] uppercase mb-2 shrink-0"
        style={{ color: C.muted, fontFamily: 'Plus Jakarta Sans' }}
      >
        {titulo}
        <span className="ml-2 font-normal tabular-nums tracking-normal">
          ({selecionados.length}/{itens.length})
        </span>
      </div>

      <div
        className="relative mb-2 shrink-0"
      >
        <Search
          size={14}
          className="absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none"
          style={{ color: C.muted }}
        />
        <input
          type="search"
          value={busca}
          onChange={(e) => onBuscaChange(e.target.value)}
          placeholder="Buscar na lista…"
          className="w-full border py-1.5 pl-8 pr-3 text-sm outline-none focus:border-[#1351B4]"
          style={{
            borderColor: C.line,
            fontFamily: 'Plus Jakarta Sans',
            color: C.text,
          }}
        />
      </div>

      <div className="flex gap-2 mb-2 shrink-0 text-[10px] uppercase tracking-wider">
        <button
          type="button"
          onClick={marcarFiltrados}
          disabled={filtrados.length === 0}
          className="hover:underline disabled:opacity-40"
          style={{ color: C.blue, fontFamily: 'Plus Jakarta Sans' }}
        >
          Marcar visíveis
        </button>
        <span style={{ color: C.line }}>|</span>
        <button
          type="button"
          onClick={desmarcarFiltrados}
          disabled={filtrados.length === 0}
          className="hover:underline disabled:opacity-40"
          style={{ color: C.muted, fontFamily: 'Plus Jakarta Sans' }}
        >
          Desmarcar visíveis
        </button>
      </div>

      <ul
        className="flex-1 overflow-y-auto border divide-y min-h-[120px] max-h-[min(280px,40vh)]"
        style={{ borderColor: C.line, background: C.card }}
        role="listbox"
        aria-multiselectable="true"
      >
        {filtrados.length === 0 && (
          <li className="px-3 py-6 text-center text-sm" style={{ color: C.muted }}>
            Nenhum item encontrado.
          </li>
        )}
        {filtrados.map((item, idx) => {
          const ativo = selecionados.includes(item.id);
          return (
            <li key={item.id}>
              <label
                htmlFor={`${idPrefix}-${item.id}`}
                className="flex items-start gap-2 px-3 py-2 cursor-pointer transition-colors hover:bg-slate-50"
                style={{ background: ativo ? 'rgba(19,81,180,0.06)' : undefined }}
              >
                <span
                  className="shrink-0 w-6 text-right tabular-nums text-[11px] pt-0.5"
                  style={{ color: C.muted, fontFamily: 'JetBrains Mono' }}
                >
                  {String(idx + 1).padStart(2, '0')}
                </span>
                <span
                  className="shrink-0 mt-0.5 flex h-4 w-4 items-center justify-center border"
                  style={{
                    borderColor: ativo ? C.blue : C.line,
                    background: ativo ? C.blue : 'transparent',
                  }}
                >
                  {ativo && <Check size={10} strokeWidth={3} color="white" />}
                </span>
                <input
                  id={`${idPrefix}-${item.id}`}
                  type="checkbox"
                  className="sr-only"
                  checked={ativo}
                  onChange={() => {
                    onChange(
                      ativo
                        ? selecionados.filter((id) => id !== item.id)
                        : [...selecionados, item.id]
                    );
                  }}
                />
                <span className="flex-1 min-w-0">
                  <span
                    className="block text-sm leading-snug"
                    style={{ color: C.navy, fontFamily: 'Plus Jakarta Sans' }}
                  >
                    {renderLabel(item)}
                  </span>
                  {renderMeta && (
                    <span className="block text-[11px] mt-0.5" style={{ color: C.muted }}>
                      {renderMeta(item)}
                    </span>
                  )}
                </span>
              </label>
            </li>
          );
        })}
      </ul>

      {filtrados.length > 0 && filtrados.length < itens.length && (
        <p className="mt-1.5 text-[11px] shrink-0" style={{ color: C.muted }}>
          Exibindo {filtrados.length} de {itens.length} itens
          {todosFiltradosMarcados ? ' · todos visíveis marcados' : ''}
        </p>
      )}
    </div>
  );
}

export default function FiltrosGerais({
  programasOpcoes,
  semanasOpcoes,
  filtroPrograma,
  setFiltroPrograma,
  filtroSemana,
  setFiltroSemana,
  totalBase,
  totalFiltrado,
  onLimpar,
}) {
  const [aberto, setAberto] = useState(false);
  const [buscaProg, setBuscaProg] = useState('');
  const [buscaSem, setBuscaSem] = useState('');
  const painelRef = useRef(null);

  const qtdFiltros = filtroPrograma.length + filtroSemana.length;
  const ativos = qtdFiltros > 0;

  const itensPrograma = useMemo(
    () =>
      programasOpcoes.map((p) => ({
        id: p.nome,
        nome: p.nome,
        qtd: p.qtd,
      })),
    [programasOpcoes]
  );

  const itensSemana = useMemo(
    () =>
      semanasOpcoes.map((s) => ({
        id: s.key,
        label: s.label,
        intervalo: s.intervalo,
        qtd: s.qtd,
      })),
    [semanasOpcoes]
  );

  useEffect(() => {
    if (!aberto) return undefined;
    const fn = (e) => {
      if (painelRef.current && !painelRef.current.contains(e.target)) {
        setAberto(false);
      }
    };
    document.addEventListener('mousedown', fn);
    return () => document.removeEventListener('mousedown', fn);
  }, [aberto]);

  const resumoAtivo = useMemo(() => {
    const partes = [];
    if (filtroPrograma.length) {
      partes.push(
        filtroPrograma.length === 1
          ? '1 programa'
          : `${filtroPrograma.length} programas`
      );
    }
    if (filtroSemana.length) {
      partes.push(
        filtroSemana.length === 1 ? '1 semana' : `${filtroSemana.length} semanas`
      );
    }
    return partes.join(' · ');
  }, [filtroPrograma.length, filtroSemana.length]);

  return (
    <div
      ref={painelRef}
      className="border-b relative z-20"
      style={{ borderColor: C.line, background: C.card }}
    >
      <div className="mx-auto max-w-[1280px] px-8">
        <div className="flex flex-wrap items-center gap-3 py-2.5 min-h-[44px]">
          <button
            type="button"
            onClick={() => setAberto((v) => !v)}
            className="inline-flex items-center gap-2 text-[11px] font-semibold tracking-wider uppercase px-3 py-1.5 border transition-colors"
            style={{
              borderColor: aberto ? C.blue : C.line,
              color: aberto ? C.blue : C.navy,
              background: aberto ? 'rgba(19,81,180,0.06)' : 'transparent',
              fontFamily: 'Plus Jakarta Sans',
            }}
            aria-expanded={aberto}
            aria-controls="filtros-gerais-painel"
          >
            <SlidersHorizontal size={14} strokeWidth={1.75} />
            Filtrar base
            <ChevronDown
              size={14}
              style={{
                transform: aberto ? 'rotate(180deg)' : 'none',
                transition: 'transform 0.2s',
              }}
            />
          </button>

          <span
            className="text-xs tabular-nums"
            style={{ color: C.muted, fontFamily: 'Plus Jakarta Sans' }}
          >
            <strong style={{ color: C.navy }}>{totalFiltrado}</strong>
            <span className="mx-1">/</span>
            {totalBase} solicitações
          </span>

          {ativos && (
            <>
              <span
                className="hidden sm:inline text-[10px] px-2 py-0.5 tabular-nums font-semibold"
                style={{
                  background: C.navy,
                  color: 'white',
                  fontFamily: 'Plus Jakarta Sans',
                }}
              >
                {qtdFiltros} filtro{qtdFiltros !== 1 ? 's' : ''}
              </span>
              <span
                className="hidden md:inline text-xs truncate max-w-[min(420px,40vw)]"
                style={{ color: C.muted }}
                title={resumoAtivo}
              >
                {resumoAtivo}
              </span>
              <button
                type="button"
                onClick={onLimpar}
                className="ml-auto inline-flex items-center gap-1 text-[10px] font-medium tracking-wider uppercase hover:underline"
                style={{ color: C.red, fontFamily: 'Plus Jakarta Sans' }}
              >
                <X size={11} />
                Limpar
              </button>
            </>
          )}
        </div>

        {aberto && (
          <div
            id="filtros-gerais-painel"
            className="pb-5 pt-1 border-t"
            style={{ borderColor: C.line }}
          >
            <p
              className="text-[11px] mb-4 max-w-2xl"
              style={{ color: C.muted, fontFamily: 'Plus Jakarta Sans' }}
            >
              Aplica-se a todo o painel. Listas numeradas com busca — adequadas a muitos
              programas e semanas no futuro.
            </p>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
              <ListaFiltro
                titulo="Programa"
                idPrefix="prog"
                itens={itensPrograma}
                selecionados={filtroPrograma}
                onChange={setFiltroPrograma}
                busca={buscaProg}
                onBuscaChange={setBuscaProg}
                renderLabel={(item) => item.nome}
                renderMeta={(item) => `${item.qtd} solicitação${item.qtd !== 1 ? 'ões' : ''}`}
              />

              <ListaFiltro
                titulo="Semana do ano · chegada AIO"
                idPrefix="sem"
                itens={itensSemana}
                selecionados={filtroSemana}
                onChange={setFiltroSemana}
                busca={buscaSem}
                onBuscaChange={setBuscaSem}
                renderLabel={(item) => item.label}
                renderMeta={(item) => `${item.intervalo} · ${item.qtd} AIO(s)`}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
