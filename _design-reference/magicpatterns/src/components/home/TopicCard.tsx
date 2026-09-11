import React from 'react';
import type { Topic, TopicAccent } from '../../data/homeContent';

const ACCENTS: Record<TopicAccent, {title: string;bullet: string;bar: string;head: string;}> = {
  navy: { title: 'text-[#14213d]', bullet: 'bg-[#14213d]', bar: 'bg-[#14213d]', head: 'bg-[#f1f5f9]' },
  green: { title: 'text-[#047857]', bullet: 'bg-[#047857]', bar: 'bg-[#047857]', head: 'bg-[#ecfdf5]' },
  purple: { title: 'text-[#6d28d9]', bullet: 'bg-[#6d28d9]', bar: 'bg-[#6d28d9]', head: 'bg-[#f5f3ff]' },
  red: { title: 'text-[#b91c1c]', bullet: 'bg-[#b91c1c]', bar: 'bg-[#b91c1c]', head: 'bg-[#fef2f2]' },
  blue: { title: 'text-[#1d4ed8]', bullet: 'bg-[#1d4ed8]', bar: 'bg-[#1d4ed8]', head: 'bg-[#eff6ff]' }
};

interface TopicCardProps {
  topic: Topic;
}

export function TopicCard({ topic }: TopicCardProps) {
  const accent = ACCENTS[topic.accent];

  return (
    <article className="flex h-full flex-col overflow-hidden rounded-xl border border-[#e2e8f0] bg-white shadow-[0_1px_2px_rgba(15,23,42,0.05)]">
      <div className={`${accent.bar} h-1.5 w-full`} aria-hidden="true" />
      <div className={`${accent.head} px-5 py-4`}>
        <h3 className={`${accent.title} text-[16px] font-bold uppercase leading-tight tracking-[0.02em]`}>
          {topic.title}
        </h3>
      </div>
      <ul className="flex flex-1 flex-col gap-2.5 px-5 py-4">
        {topic.items.map((item) =>
        <li key={item} className="flex gap-2.5 text-[14px] leading-[1.6] text-[#374151]">
            <span className={`${accent.bullet} mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full`} aria-hidden="true" />
            <span>{item}</span>
          </li>
        )}
      </ul>
    </article>);

}