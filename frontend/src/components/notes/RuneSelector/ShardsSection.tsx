'use client';

import { getShards } from '@/lib/data/runes';
import { RuneButton } from './RuneButton';

interface ShardsSectionProps {
  shards: number[];
  disabled: boolean;
  onShardChange: (slot: number, id: number) => void;
}

export function ShardsSection({
  shards,
  disabled,
  onShardChange,
}: ShardsSectionProps) {
  const slotLabels = ['攻撃', 'フレックス', '防御'];
  return (
    <div>
      <h4 className="text-sm font-semibold text-gray-700 mb-3">Shards</h4>
      <div className="space-y-2">
        {[0, 1, 2].map((slot) => (
          <div key={slot} className="flex gap-2">
            {getShards(slot).map((shard) => (
              <RuneButton
                key={shard.id}
                id={shard.id}
                icon={shard.icon}
                name={shard.name}
                selected={shards[slot] === shard.id}
                disabled={disabled}
                size="sm"
                ariaLabel={`${slotLabels[slot]}シャード: ${shard.name}`}
                onClick={() => onShardChange(slot, shard.id)}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
