import Image from 'next/image';

interface MatchItemsProps {
  itemIds: number[];
}

// アイテムアイコン（空きの枠は出さない）
export function MatchItems({ itemIds }: MatchItemsProps) {
  return (
    <div className="flex gap-0.5 flex-wrap max-w-[80px]">
      {itemIds
        .slice(0, 6)
        .filter((id) => id !== 0)
        .map((id, i) => (
          <Image
            key={i}
            src={`/images/item/${id}.png`}
            alt={`item-${id}`}
            width={20}
            height={20}
            className="rounded"
          />
        ))}
    </div>
  );
}
