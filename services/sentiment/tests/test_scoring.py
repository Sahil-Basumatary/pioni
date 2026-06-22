from sentiment.scoring import compute_confidence_details


def test_confidence_mix_improves_with_independent_x_source():
    scores = [0.4, 0.35, 0.3]

    single_source_conf, single_source_drivers = compute_confidence_details(
        scores,
        has_news=True,
        has_reddit=False,
    )
    multi_source_conf, multi_source_drivers = compute_confidence_details(
        scores,
        has_news=True,
        has_reddit=False,
        has_x=True,
    )

    assert single_source_drivers["mix"] == 0.85
    assert multi_source_drivers["mix"] == 1.0
    assert multi_source_conf > single_source_conf

