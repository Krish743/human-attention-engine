import pandas as pd
from typing import Optional

def compute_half_life(scores: pd.Series) -> Optional[float]:
    if scores.empty or scores.max() == 0:
        return None
    peak_idx = scores.idxmax()
    peak_val = scores.max()
    after_peak = scores.loc[peak_idx:]
    below_half = after_peak[after_peak <= peak_val * 0.5]
    if below_half.empty:
        return None
    peak_pos = scores.index.get_loc(peak_idx)
    half_pos = scores.index.get_loc(below_half.index[0])
    return float(half_pos - peak_pos)

def compute_topic_summary(attention_df: pd.DataFrame) -> pd.DataFrame:
    rows = []
    for topic, grp in attention_df.sort_values("date").groupby("topic"):
        scores = grp["attention_score"]
        vel = grp["velocity"] if "velocity" in grp.columns else pd.Series(dtype=float)
        gr = grp["growth_rate"] if "growth_rate" in grp.columns else pd.Series(dtype=float)
        gr_clean = gr.dropna()
        rows.append({
            "topic": topic,
            "current_score": round(float(scores.iloc[-1]), 2),
            "peak_score": round(float(scores.max()), 2),
            "avg_score": round(float(scores.mean()), 2),
            "volatility": round(float(scores.std()), 2),
            "latest_velocity": round(float(vel.iloc[-1]) if len(vel) else 0, 3),
            "growth_7d": round(float(gr_clean.iloc[-1]) if len(gr_clean) else 0, 2),
            "half_life_days": compute_half_life(scores),
        })
    return pd.DataFrame(rows).sort_values("current_score", ascending=False).reset_index(drop=True)