import time, logging
from pathlib import Path
from typing import List
import pandas as pd
from pytrends.request import TrendReq

logger = logging.getLogger(__name__)
RAW_DATA_DIR = Path(__file__).resolve().parents[2] / "data" / "raw"
RAW_DATA_DIR.mkdir(parents=True, exist_ok=True)

class GoogleTrendsCollector:
    def __init__(self, timeframe="today 3-m", geo="", sleep=1.5):
        self.timeframe = timeframe
        self.geo = geo
        self.sleep = sleep
        self.pytrends = TrendReq(hl="en-US", tz=0, timeout=(10, 25))

    def fetch(self, topics: List[str], force_refresh: bool = False) -> pd.DataFrame:
        cache_path = RAW_DATA_DIR / "google_trends.csv"
        if not force_refresh and cache_path.exists():
            logger.info("Loading Google Trends from cache")
            return pd.read_csv(cache_path, parse_dates=["date"])
        all_frames = []
        for i in range(0, len(topics), 5):
            batch = topics[i:i+5]
            logger.info("Fetching trends for: %s", batch)
            try:
                self.pytrends.build_payload(batch, timeframe=self.timeframe, geo=self.geo)
                data = self.pytrends.interest_over_time()
                if data.empty:
                    continue
                data = data.drop(columns=["isPartial"], errors="ignore")
                data = data.reset_index().melt(id_vars="date", var_name="topic", value_name="search_interest")
                all_frames.append(data)
            except Exception as exc:
                logger.error("Failed batch %s: %s", batch, exc)
            time.sleep(self.sleep)
        if not all_frames:
            return pd.DataFrame(columns=["date", "topic", "search_interest"])
        result = pd.concat(all_frames, ignore_index=True)
        result.to_csv(cache_path, index=False)
        return result