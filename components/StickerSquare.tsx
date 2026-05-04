'use client'

import { StickerType } from '@/data/album-copa-2026'

export type StickerStatus = 'colada' | 'venda' | 'troca' | 'doacao' | 'preciso' | 'repetida'

interface StickerSquareProps {
  number: number
  name?: string
  stickerType?: StickerType
  status?: StickerStatus | StickerStatus[]
  size?: 'sm' | 'md' | 'lg'
  onClick?: () => void
  interactive?: boolean
  showName?: boolean
}

const STATUS_CONFIG = {
  colada:  { bg: 'bg-green-600',  border: 'border-green-700',  text: '✓', label: 'Colada',   ring: 'ring-green-500' },
  repetida:{ bg: 'bg-amber-500',  border: 'border-amber-600',  text: '+', label: 'Repetida', ring: 'ring-amber-400' },
  venda:   { bg: 'bg-green-500',  border: 'border-green-600',  text: 'V', label: 'Venda',    ring: 'ring-green-400' },
  troca:   { bg: 'bg-blue-500',   border: 'border-blue-600',   text: 'T', label: 'Troca',    ring: 'ring-blue-400' },
  doacao:  { bg: 'bg-purple-500', border: 'border-purple-600', text: 'D', label: 'Doação',   ring: 'ring-purple-400' },
  preciso: { bg: 'bg-red-500',    border: 'border-red-600',    text: 'P', label: 'Preciso',  ring: 'ring-red-400' },
}

const SIZE_CONFIG = {
  sm: { box: 'w-10 h-10 text-xs',    num: 'text-[10px] font-bold', dot: 'w-1.5 h-1.5' },
  md: { box: 'w-12 h-12 text-sm',    num: 'text-xs font-bold',     dot: 'w-2 h-2' },
  lg: { box: 'w-16 h-16 text-base',  num: 'text-sm font-bold',     dot: 'w-2.5 h-2.5' },
}

export default function StickerSquare({
  number,
  name,
  stickerType = 'normal',
  status,
  size = 'sm',
  onClick,
  interactive = false,
  showName = false,
}: StickerSquareProps) {
  const sz = SIZE_CONFIG[size]
  const statuses = Array.isArray(status) ? status.filter(Boolean) as StickerStatus[] : status ? [status] : []
  const primaryStatus = statuses[0] ?? null
  const cfg = primaryStatus ? STATUS_CONFIG[primaryStatus] : null
  const isBrilhante = stickerType === 'brilhante'
  const isEscudo    = stickerType === 'escudo'

  const baseClasses = [
    sz.box,
    'relative rounded-lg border-2 flex flex-col items-center justify-center select-none transition-all duration-150',
    interactive ? 'cursor-pointer hover:scale-105 active:scale-95' : '',
    cfg
      ? `${cfg.bg} ${cfg.border} text-white`
      : 'bg-white border-slate-200 text-slate-600',
    isBrilhante && !cfg ? 'sticker-brilhante border-amber-400 bg-amber-50 text-amber-700' : '',
    isEscudo && !cfg    ? 'border-indigo-300 bg-indigo-50 text-indigo-700' : '',
  ].join(' ')

  return (
    <div className="flex flex-col items-center gap-0.5">
      <div className={baseClasses} onClick={onClick} title={name}>
        {/* Número */}
        <span className={sz.num}>{number}</span>

        {/* Indicador de tipo (brilhante / escudo) */}
        {isBrilhante && !cfg && (
          <span className="text-[8px] leading-none">✨</span>
        )}
        {isEscudo && !cfg && (
          <span className="text-[8px] leading-none">🛡️</span>
        )}

        {/* Dots de multi-status */}
        {statuses.length > 1 && (
          <div className="absolute bottom-0.5 right-0.5 flex gap-0.5">
            {statuses.slice(1).map((s) => s && (
              <span
                key={s}
                className={`${sz.dot} rounded-full ${STATUS_CONFIG[s].bg} border border-white`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Nome abaixo (opcional) */}
      {showName && name && (
        <span className="text-[9px] text-slate-500 text-center leading-tight max-w-[48px] truncate">
          {name.split(' ').slice(0, 2).join(' ')}
        </span>
      )}
    </div>
  )
}
