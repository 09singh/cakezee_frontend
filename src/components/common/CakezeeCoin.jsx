
import { Link } from "react-router-dom";
import { Cake, Heart } from "lucide-react";

export default function CakezeeCoin({ sidebar = false }) {
  return (
    <Link
      to="/"
      aria-label="Cakezee Home"
      className={`cakezee-coin-link ${sidebar ? "cakezee-coin-sidebar" : ""}`}
    >
      <span className="cakezee-coin">
        <span className="cakezee-coin-rim" />
        <span className="cakezee-coin-inner">
          <span className="cakezee-coin-cake">
            <Cake strokeWidth={1.35} />
          </span>

          <span className="cakezee-coin-name">Cakezee</span>

          <Heart
            className="cakezee-coin-heart"
            fill="currentColor"
            strokeWidth={1.2}
          />
        </span>
      </span>
    </Link>
  );
}
