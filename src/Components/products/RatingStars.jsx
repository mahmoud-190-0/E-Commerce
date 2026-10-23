export default function RatingStars({ value = 0, count = 0 }) {
  const rounded = Math.round(value * 2) / 2; // half-star precision
  return (
    <div className="rating" aria-label={`Rated ${value.toFixed(1)} out of 5`}>
      <span className="rating__stars" aria-hidden="true">
        {[1, 2, 3, 4, 5].map((i) => (
          <span
            key={i}
            className={
              rounded >= i
                ? "star star--full"
                : rounded >= i - 0.5
                  ? "star star--half"
                  : "star star--empty"
            }>
            ★
          </span>
        ))}
      </span>
      <span className="rating__count">({count})</span>
    </div>
  );
}
