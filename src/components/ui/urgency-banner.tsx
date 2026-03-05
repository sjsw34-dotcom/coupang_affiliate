interface UrgencyBannerProps {
  title: string;
  points: string[];
}

export default function UrgencyBanner({ title, points }: UrgencyBannerProps) {
  if (!title || points.length === 0) return null;

  return (
    <section className="my-10 rounded-2xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 p-6 md:p-8">
      <p className="text-lg font-bold text-gray-900">
        <span className="mr-2">🔥</span>{title}
      </p>
      <ul className="mt-4 space-y-2">
        {points.map((point, i) => (
          <li key={i} className="text-sm leading-relaxed text-gray-700">
            {point}
          </li>
        ))}
      </ul>
    </section>
  );
}
