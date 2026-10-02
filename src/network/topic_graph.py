import logging, numpy as np, pandas as pd, networkx as nx

logger = logging.getLogger(__name__)

def build_correlation_matrix(attention_df: pd.DataFrame) -> pd.DataFrame:
    pivot = attention_df.pivot_table(index="date", columns="topic", values="attention_score").fillna(0)
    return pivot.corr(method="pearson")

def build_attention_graph(attention_df: pd.DataFrame, threshold: float = 0.7) -> nx.Graph:
    corr_matrix = build_correlation_matrix(attention_df)
    latest = attention_df.sort_values("date").groupby("topic")["attention_score"].last()
    avg = attention_df.groupby("topic")["attention_score"].mean()
    G = nx.Graph()
    for topic in corr_matrix.columns:
        G.add_node(topic, current_score=round(float(latest.get(topic, 0)), 2), avg_score=round(float(avg.get(topic, 0)), 2))
    topics = list(corr_matrix.columns)
    for i in range(len(topics)):
        for j in range(i + 1, len(topics)):
            corr = corr_matrix.iloc[i, j]
            if not np.isnan(corr) and abs(corr) >= threshold:
                G.add_edge(topics[i], topics[j], weight=round(float(corr), 3))
    logger.info("Network: %d nodes, %d edges", G.number_of_nodes(), G.number_of_edges())
    return G