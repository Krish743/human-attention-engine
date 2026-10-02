import numpy as np
import pandas as pd

def compute_velocity(attention_df: pd.DataFrame) -> pd.DataFrame:
    df = attention_df.copy().sort_values(["topic", "date"])
    df["velocity"] = df.groupby("topic")["attention_score"].transform(
        lambda s: np.gradient(s.values)
    )
    return df

def compute_growth_rate(attention_df: pd.DataFrame, window_days: int = 7) -> pd.DataFrame:
    df = attention_df.copy().sort_values(["topic", "date"])
    df["growth_rate"] = df.groupby("topic")["attention_score"].transform(
        lambda s: s.diff(periods=window_days)
    )
    return df